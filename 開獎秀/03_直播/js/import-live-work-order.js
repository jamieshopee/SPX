// SPX 開獎秀 — 直播工單：只讀取「美術工單_直播」詳細版位區塊。

import { parseLiveWorkspaceJson, serializeLiveWorkspace } from "./workspace-live.js";

const SHEET_NAME = "美術工單_直播";
const CONTROL_CHARACTER = /[\u0000-\u0009\u000b-\u001f\u007f]|_x0003_/iu;

function fail(message) { throw new Error(`直播工單：${message}`); }
function label(value) { return String(value ?? "").replace(/\s+/gu, ""); }

function cellText(XLSX, sheet, row, column) {
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  const cell = sheet[address];
  if (!cell || cell.t === "z") return null;
  if (cell.f || !["s", "str", "n", "d"].includes(cell.t)) fail(`${address} 不是可匯入的固定文字或數值。`);
  const value = cell.t === "n" || cell.t === "d"
    ? String(cell.w ?? XLSX.utils.format_cell(cell))
    : String(cell.v ?? "");
  if (CONTROL_CHARACTER.test(value)) fail(`${address} 含有不可匯入的控制字元。`);
  return value === "" ? null : value;
}

function locateSections(XLSX, sheet, layouts) {
  if (!sheet["!ref"]) fail("工作表沒有有效的資料範圍。");
  const bounds = XLSX.utils.decode_range(sheet["!ref"]);
  const markers = [];
  for (let row = bounds.s.r; row <= bounds.e.r; row += 1) {
    if (cellText(XLSX, sheet, row, 0) === "【製作內容文案】") markers.push(row);
  }
  if (markers.length !== 1) fail("找不到唯一的製作內容文案區塊。");
  const sectionRows = layouts.map((layout) => {
    const matches = [];
    for (let row = markers[0] + 1; row <= bounds.e.r; row += 1) {
      if (cellText(XLSX, sheet, row, 0) === layout.name) matches.push(row);
    }
    if (matches.length !== 1) fail(`${layout.name} 詳細區塊必須唯一存在。`);
    const row = matches[0];
    const size = cellText(XLSX, sheet, row, 2);
    const format = cellText(XLSX, sheet, row, 3);
    if (label(size).toLowerCase() !== `${layout.canvas.width}x${layout.canvas.height}` ||
        !label(format).startsWith((layout.outputFormat ?? "jpg").toUpperCase())) {
      fail(`${layout.name} 的尺寸或輸出格式與正式版位不符。`);
    }
    return row;
  });
  if (sectionRows.some((row, index) => index > 0 && row <= sectionRows[index - 1])) {
    fail("直播詳細版位區塊順序或邊界不明確。");
  }
  return new Map(layouts.map((layout, index) => [layout.id, {
    start: sectionRows[index],
    end: index + 1 < layouts.length ? sectionRows[index + 1] : bounds.e.r + 1
  }]));
}

function findRow(XLSX, sheet, section, marker) {
  const matches = [];
  for (let row = section.start; row < section.end; row += 1) {
    const value = label(cellText(XLSX, sheet, row, 4));
    if (value.startsWith(label(marker))) matches.push(row);
  }
  if (matches.length !== 1) fail(`${marker} 欄位在詳細區塊中缺漏或不唯一。`);
  return matches[0];
}

function requireLabel(XLSX, sheet, row, column, expected) {
  if (label(cellText(XLSX, sheet, row, column)) !== label(expected)) {
    fail(`${XLSX.utils.encode_cell({ r: row, c: column })} 欄位標籤不符。`);
  }
}

function put(state, layout, path, value) {
  if (value === null) return;
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((current, key) => current?.[key], state.text);
  if (!parent || typeof parent[last] !== "string") fail(`${layout.name} 缺少 ${path} 可編輯欄位。`);
  if (parent[last] === value) return;
  parent[last] = value;
  if (layout.id === "06" && state.textRanges?.[last]) {
    state.textRanges[last] = Array.from({ length: layout.text[last].maxLines }, () => []);
  }
  if (layout.id === "08") {
    const selectable = layout.awardTable.selectableFields.find((field) => field.path.join(".") === path);
    if (selectable) state.textRanges[selectable.id] = Array.from({ length: selectable.geometry.maxLines }, () => []);
  }
}

function putLines(state, layout, path, values) {
  if (values.every((value) => value === null)) return;
  const keys = path.split(".");
  const current = keys.reduce((value, key) => value?.[key], state.text);
  if (typeof current !== "string") fail(`${layout.name} 缺少 ${path} 多行欄位。`);
  const lines = current ? current.split("\n") : [];
  values.forEach((value, index) => { if (value !== null) lines[index] = value; });
  put(state, layout, path, lines.map((value) => value ?? "").join("\n"));
}

function importSimpleFields(XLSX, sheet, section, state, layout, fields) {
  fields.forEach(([marker, path]) => {
    const row = findRow(XLSX, sheet, section, marker);
    put(state, layout, path, cellText(XLSX, sheet, row, 5));
  });
}

function importStep05(XLSX, sheet, section, state, layout) {
  const header = findRow(XLSX, sheet, section, "固定不提供變更");
  ["step.1", "step.2", "step.3"].forEach((name, index) => requireLabel(XLSX, sheet, header, 5 + index, name));
  ["第一行", "第二行", "第三行"].forEach((marker, lineIndex) => {
    const row = findRow(XLSX, sheet, section, marker);
    if (row !== header + lineIndex + 1) fail("05 STEP 行次與固定標籤不符。");
    for (let step = 1; step <= 3; step += 1) {
      put(state, layout, `steps.step${step}.line${lineIndex + 1}`, cellText(XLSX, sheet, row, 4 + step));
    }
  });
}

function importBlocks06(XLSX, sheet, section, state, layout) {
  const first = findRow(XLSX, sheet, section, "區塊一");
  const second = findRow(XLSX, sheet, section, "區塊二");
  if (second !== first + 3) fail("06 區塊行次不符，無法安全保留換行。");
  putLines(state, layout, "block1", [0, 1, 2].map((offset) => cellText(XLSX, sheet, first + offset, 5)));
  putLines(state, layout, "block2", [0, 1, 2].map((offset) => cellText(XLSX, sheet, second + offset, 5)));
}

function importStep07(XLSX, sheet, section, state, layout) {
  const fixedRows = [];
  for (let row = section.start; row < section.end; row += 1) {
    if (label(cellText(XLSX, sheet, row, 4)).startsWith("固定不提供變更")) fixedRows.push(row);
  }
  if (fixedRows.length !== 2) fail("07 STEP 固定標籤缺漏或重複。");
  ["step.1", "step.2", "step.3"].forEach((name, index) => requireLabel(XLSX, sheet, fixedRows[0], 5 + index, name));
  requireLabel(XLSX, sheet, fixedRows[1], 5, "step.4");
  requireLabel(XLSX, sheet, fixedRows[0] + 1, 4, "大字(限6字內)");
  requireLabel(XLSX, sheet, fixedRows[0] + 2, 4, "小字(限9字內)");
  for (let step = 1; step <= 3; step += 1) {
    put(state, layout, `steps.step${step}.big`, cellText(XLSX, sheet, fixedRows[0] + 1, 4 + step));
    put(state, layout, `steps.step${step}.small`, cellText(XLSX, sheet, fixedRows[0] + 2, 4 + step));
  }
  requireLabel(XLSX, sheet, fixedRows[1] + 1, 4, "大字(限15字內)");
  requireLabel(XLSX, sheet, fixedRows[1] + 2, 4, "大字(限15字內)");
  requireLabel(XLSX, sheet, fixedRows[1] + 3, 4, "小字(限18字內)");
  putLines(state, layout, "steps.step4.big", [
    cellText(XLSX, sheet, fixedRows[1] + 1, 5), cellText(XLSX, sheet, fixedRows[1] + 2, 5)
  ]);
  put(state, layout, "steps.step4.small", cellText(XLSX, sheet, fixedRows[1] + 3, 5));
}

function importTable08(XLSX, sheet, section, state, layout) {
  const headings = ["獎項", "得獎金額", "中獎方式", "得獎範例"];
  const headerRows = [];
  for (let row = section.start; row + 7 < section.end; row += 1) {
    if (label(cellText(XLSX, sheet, row + 1, 4)) !== "特別獎") continue;
    const values = headings.map((name, index) => cellText(XLSX, sheet, row, 4 + index));
    if (values.some((value, index) => value !== null && label(value.split("\n")[0]) !== headings[index])) continue;
    if (values.some((value) => value !== null)) headerRows.push(row);
  }
  if (headerRows.length !== 1) fail("08 表格標題列缺漏或不唯一。");
  const headerRow = headerRows[0];
  headings.forEach((name, index) => {
    const value = cellText(XLSX, sheet, headerRow, 4 + index);
    if (value === null) return;
    const lines = value.split("\n");
    if (label(lines[0]) !== label(name) || lines.length > 2) fail("08 表格標題或大小字結構不符。");
    const key = ["prize", "amount", "method", "example"][index];
    put(state, layout, `headers.${key}.big`, lines[0]);
    if (lines.length === 2 && lines[1] !== "") put(state, layout, `headers.${key}.small`, lines[1]);
  });
  const awards = [
    ["special", "特別獎"], ["liveLimited", "直播限定獎"], ["first", "頭獎"],
    ["second", "貳獎"], ["third", "參獎"], ["fourth", "肆獎"], ["fifth", "伍獎"]
  ];
  awards.forEach(([id, name], index) => {
    const row = headerRow + index + 1;
    if (row >= section.end || label(cellText(XLSX, sheet, row, 4)) !== name) fail(`08 ${name} 獎項列缺漏或順序不符。`);
    put(state, layout, `awards.${id}.name`, cellText(XLSX, sheet, row, 4));
    put(state, layout, `awards.${id}.amount`, cellText(XLSX, sheet, row, 5));
    if (id === "liveLimited") {
      if (cellText(XLSX, sheet, row, 7) !== null) fail("08 直播限定獎沒有獨立得獎範例欄。");
      const merged = cellText(XLSX, sheet, row, 6);
      if (merged !== null) {
        const lines = merged.split("\n");
        if (lines.length > 2) fail("08 直播限定獎右側最多大字與小字兩行。");
        if (lines[0] !== "") put(state, layout, "awards.liveLimited.big", lines[0]);
        if (lines[1] && lines[1] !== "") put(state, layout, "awards.liveLimited.small", lines[1]);
      }
    } else {
      put(state, layout, `awards.${id}.method`, cellText(XLSX, sheet, row, 6));
      put(state, layout, `awards.${id}.example`, cellText(XLSX, sheet, row, 7));
    }
  });
}

export async function parseLiveWorkOrderCandidate(file, XLSX, {
  styleId, activeLayoutId, layouts, states, createInitialState, validateState
}) {
  if (!file || typeof file.arrayBuffer !== "function") fail("請先選擇 Excel 工單。");
  if (XLSX?.version !== "0.20.3" || !XLSX.read || !XLSX.utils) fail("Excel 解析器版本不符合正式需求。");
  let workbook;
  try {
    workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellFormula: true, cellHTML: false, cellStyles: false });
  } catch (_error) { fail("無法解析工單 Excel 檔案。"); }
  const sheet = workbook.Sheets?.[SHEET_NAME];
  if (!sheet) fail(`找不到正式工作表「${SHEET_NAME}」。`);
  const sections = locateSections(XLSX, sheet, layouts);
  const candidates = new Map(layouts.map((layout) => {
    const current = states.get(layout.id);
    if (!current) fail(`缺少 ${layout.name} 工作狀態。`);
    return [layout.id, structuredClone(current)];
  }));
  const simple = {
    "01": [["主標+時間", "titleTime"], ["副標", "subtitle"], ["警語", "warning"]],
    "02": [["主標+時間", "titleTime"], ["副標", "subtitle"], ["警語", "warning"]],
    "03": [["大字", "big"], ["小字-第一行", "small1"], ["小字-第二行", "small2"]],
    "04": [["主標", "title"], ["副標", "subtitle"], ["小字-第一行", "small1"], ["小字-第二行", "small2"]],
    "05": [["主標", "title"], ["副標", "subtitle"], ["警語", "warning"]],
    "06": [["警語", "warning"]],
    "07": [["主標", "title"], ["副標", "subtitle"], ["小字-第一行", "small1"], ["小字-第二行", "small2"], ["警語", "warning"]],
    "08": [["大字", "qualification"], ["小字", "qualificationNote"], ["警語", "footerNote"]],
    "09": [["第一行", "line1"], ["第二行", "line2"]],
    "10": [["第一行", "line1"], ["第二行", "line2"]],
    "13": [["文案", "headline"]]
  };
  layouts.forEach((layout) => {
    const section = sections.get(layout.id);
    const state = candidates.get(layout.id);
    if (simple[layout.id]) importSimpleFields(XLSX, sheet, section, state, layout, simple[layout.id]);
    if (layout.id === "05") importStep05(XLSX, sheet, section, state, layout);
    if (layout.id === "06") importBlocks06(XLSX, sheet, section, state, layout);
    if (layout.id === "07") importStep07(XLSX, sheet, section, state, layout);
    if (layout.id === "08") importTable08(XLSX, sheet, section, state, layout);
  });
  return parseLiveWorkspaceJson(serializeLiveWorkspace({
    styleId, activeLayoutId, layouts, states: candidates
  }), { currentStyleId: styleId, layouts, createInitialState, validateState });
}
