import { ITEMS } from "./registry.js";

export class ExcelImportError extends Error {
  constructor(messages) {
    super(messages.join("\n"));
    this.name = "ExcelImportError";
    this.messages = messages;
  }
}

const FIELD_DESCRIPTORS = Object.freeze([
  { fieldId: "title", aliases: ["主標", "主標題"] },
  { fieldId: "subtitle", aliases: ["副標", "副標題"] },
  { fieldId: "small", aliases: ["小字", "保護文字"] }
]);

// 14_AR 專屬欄位（Jamie 裁決；label 取自正式工單，normalizedLabel 會剝除尾端括號註記）。
// 14 欄位為 optional：缺欄不使合法快速取件工單失敗；沿既有 anchor 同列右一格／
// merge-aware 取值；raw:false 使數值儲存格保持顯示格式（如 8,888）。
const AR_ITEM_ID = "14";
const AR_FIELD_DESCRIPTORS = Object.freeze([
  { fieldId: "line1", aliases: ["第一行"] },
  { fieldId: "line2", aliases: ["第二行"] }
]);

// 15_MSBN 專屬欄位（Jamie 裁決；aliases 只取新版正式工單實際 label 的 normalized
// 形式，normalizedLabel 會剝除尾端括號註記）。15 欄位為 optional：缺欄不使合法
// 工單失敗。days 匯入僅接受 formatted ""｜"1"～"9"；其他值整份 import atomic
// reject（不 clamp、不 skip）。
const MSBN_ITEM_ID = "15";
const MSBN_FIELD_DESCRIPTORS = Object.freeze([
  { fieldId: "mainTitle", aliases: ["主標題"] },
  { fieldId: "days", aliases: ["到貨後天數"] },
  { fieldId: "smallTitle", aliases: ["小標題"] },
  { fieldId: "subtitle", aliases: ["副標題"] },
  { fieldId: "smallLine1", aliases: ["小字 - 第一行"] },
  { fieldId: "smallLine2", aliases: ["小字 - 第二行"] }
]);
const MSBN_DAYS_FIELD_ID = "days";
const MSBN_DAYS_IMPORT_PATTERN = /^[1-9]$/;

function cellString(value) {
  return value === null || value === undefined ? "" : String(value);
}

export function normalizeWorkbookText(value) {
  return cellString(value)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

function normalizedLabel(value) {
  return normalizeWorkbookText(value)
    .replace(/\s*[（(][^）)]*[）)]\s*$/u, "")
    .trim();
}

function worksheetRows(worksheet) {
  return globalThis.XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true
  });
}

// 正式工單輸入區結構（由正式封測工單實證）：
// - 「需填寫」marker（如 A14＝shared 輸入區、H18＝14/15 輸入區）標示正式輸入區起點。
// - 「以下不需填寫…」terminator（如 A18）標示其下方為自動同步 echo 表格，
//   該區重複出現的主標／副標／保護文字 labels 不是正式輸入 anchors。
// Anchor 僅在輸入區內有效：存在 marker m 使 anchor.row > m.row 且
// anchor.column >= m.column，且不存在 terminator t（t.row > m.row 且
// t.row <= anchor.row 且 t.column <= anchor.column）截斷該 marker 的涵蓋範圍。
// 工作表完全沒有「需填寫」marker 時，維持既有全表搜尋行為（舊式工單相容）。
// 有效搜尋空間內仍以既有 unique-anchor fail-closed 判定（恰 1，0／多皆拒絕）。
const INPUT_REGION_MARKER = "需填寫";
const INPUT_REGION_TERMINATOR_PREFIX = "以下不需填寫";

function findInputRegionBoundaries(rows) {
  const markers = [];
  const terminators = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const normalized = normalizeWorkbookText(value);
      if (normalized === INPUT_REGION_MARKER) {
        markers.push({ row: rowIndex, column: columnIndex });
      } else if (normalized.startsWith(INPUT_REGION_TERMINATOR_PREFIX)) {
        terminators.push({ row: rowIndex, column: columnIndex });
      }
    });
  });
  return { markers, terminators };
}

function isWithinInputRegion(position, boundaries) {
  if (boundaries.markers.length === 0) return true;
  return boundaries.markers.some((marker) => {
    if (position.row <= marker.row || position.column < marker.column) return false;
    return !boundaries.terminators.some(
      (terminator) =>
        terminator.row > marker.row &&
        terminator.row <= position.row &&
        terminator.column <= position.column
    );
  });
}

function findAnchorsFor(descriptors, rows, boundaries) {
  const found = new Map(descriptors.map(({ fieldId }) => [fieldId, []]));
  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const label = normalizedLabel(value);
      descriptors.forEach((descriptor) => {
        if (descriptor.aliases.some((alias) => normalizeWorkbookText(alias) === label)) {
          const position = { row: rowIndex, column: columnIndex };
          if (isWithinInputRegion(position, boundaries)) {
            found.get(descriptor.fieldId).push(position);
          }
        }
      });
    });
  });
  return found;
}

// Item-block scoping（Jamie 核准之 deterministic 規則；新版正式工單實證）：
// 需填寫 input region 內、normalized text 等於 official ITEMS[].name 的 cell 為
// item-block marker（如 H20=14_AR、H22=15_MSBN）；block rows＝該 cell 所屬 merged
// range 的 rows（無 merge 則單 row）、block column＝marker column。label 屬於某
// item block iff block.rowStart <= label.row <= block.rowEnd 且 label.column >
// block.column。Shared anchors 排除屬於任何 item block 的 label（新版工單 K22
// 主標題／K25 副標題與 shared aliases 撞名，若不排除會 atomic reject 整份正式
// 工單）；15 anchors 只在 15_MSBN block 內有效。無「需填寫」marker 的舊式工單
// 不建立任何 block，全表搜尋行為完全不變。不採 first-wins／last-wins／document
// order／最近 cell 等 heuristic。
function findItemBlocks(worksheet, rows, boundaries) {
  if (boundaries.markers.length === 0) return [];
  const officialNames = new Map(ITEMS.map(({ id, name }) => [normalizeWorkbookText(name), id]));
  const merges = worksheet["!merges"] || [];
  const blocks = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const itemId = officialNames.get(normalizeWorkbookText(value));
      if (itemId === undefined) return;
      if (!isWithinInputRegion({ row: rowIndex, column: columnIndex }, boundaries)) return;
      const merge = merges.find(
        (range) =>
          rowIndex >= range.s.r &&
          rowIndex <= range.e.r &&
          columnIndex >= range.s.c &&
          columnIndex <= range.e.c
      );
      blocks.push({
        itemId,
        rowStart: merge ? merge.s.r : rowIndex,
        rowEnd: merge ? merge.e.r : rowIndex,
        column: columnIndex
      });
    });
  });
  return blocks;
}

function isOwnedByBlock(position, block) {
  return (
    position.row >= block.rowStart &&
    position.row <= block.rowEnd &&
    position.column > block.column
  );
}

function findFieldAnchors(rows, boundaries, blocks) {
  const anchors = findAnchorsFor(FIELD_DESCRIPTORS, rows, boundaries);
  // Shared anchors 排除 item-block 內的 per-item labels；其餘維持既有
  // exactly-1 fail-closed（0／多皆 reject）。
  anchors.forEach((positions, fieldId) => {
    anchors.set(
      fieldId,
      positions.filter((position) => !blocks.some((block) => isOwnedByBlock(position, block)))
    );
  });
  return anchors;
}

function findArFieldAnchors(rows, boundaries) {
  return findAnchorsFor(AR_FIELD_DESCRIPTORS, rows, boundaries);
}

function findMsbnFieldAnchors(rows, boundaries, blocks) {
  const anchors = findAnchorsFor(MSBN_FIELD_DESCRIPTORS, rows, boundaries);
  const msbnBlocks = blocks.filter((block) => block.itemId === MSBN_ITEM_ID);
  anchors.forEach((positions, fieldId) => {
    anchors.set(
      fieldId,
      positions.filter((position) => msbnBlocks.some((block) => isOwnedByBlock(position, block)))
    );
  });
  return anchors;
}

function hasWorkbookMarker(rows) {
  const flattened = rows.flat().map(normalizeWorkbookText).filter(Boolean);
  if (flattened.some((value) => value.includes("快速取件"))) return true;
  const officialNames = new Set(ITEMS.map(({ name }) => normalizeWorkbookText(name)));
  const matchedNames = new Set(flattened.filter((value) => officialNames.has(value)));
  return matchedNames.size >= 3;
}

function mergedValueColumn(worksheet, anchor) {
  const merge = (worksheet["!merges"] || []).find(
    (range) =>
      anchor.row >= range.s.r &&
      anchor.row <= range.e.r &&
      anchor.column >= range.s.c &&
      anchor.column <= range.e.c
  );
  return merge ? merge.e.c + 1 : anchor.column + 1;
}

function identifyWorksheet(workbook) {
  const candidates = [];
  (workbook.SheetNames || []).forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = worksheetRows(worksheet);
    const boundaries = findInputRegionBoundaries(rows);
    const blocks = findItemBlocks(worksheet, rows, boundaries);
    const anchors = findFieldAnchors(rows, boundaries, blocks);
    const hasUniqueAnchors = FIELD_DESCRIPTORS.every(
      ({ fieldId }) => anchors.get(fieldId).length === 1
    );
    if (hasUniqueAnchors && hasWorkbookMarker(rows)) {
      candidates.push({ sheetName, worksheet, rows, anchors, boundaries, blocks });
    }
  });

  if (candidates.length === 0) {
    throw new ExcelImportError(["無法確認此檔案是快速取件工單。"]);
  }
  if (candidates.length > 1) {
    throw new ExcelImportError([
      `工單有多個符合的工作表，無法判斷：${candidates.map(({ sheetName }) => sheetName).join("、")}`
    ]);
  }
  return candidates[0];
}

export async function parseExcelCandidate(file, currentState) {
  if (!globalThis.XLSX) throw new ExcelImportError(["Excel 解析程式庫尚未載入。"]);

  let workbook;
  try {
    workbook = globalThis.XLSX.read(await file.arrayBuffer(), {
      type: "array",
      cellDates: false
    });
  } catch (_error) {
    throw new ExcelImportError(["無法解析工單 Excel 檔案。"]);
  }

  const { worksheet, rows, anchors, boundaries, blocks } = identifyWorksheet(workbook);
  const sharedText = {};
  FIELD_DESCRIPTORS.forEach(({ fieldId }) => {
    const [anchor] = anchors.get(fieldId);
    const valueColumn = mergedValueColumn(worksheet, anchor);
    sharedText[fieldId] = cellString(rows[anchor.row]?.[valueColumn]);
  });

  // 14_AR 欄位（optional）：輸入區內 anchor 恰一個才取值；缺欄或多候選時保留現值
  //（同一 unique-anchor 安全原則，不取第一個），不使整份合法工單失敗。
  // Excel Import 不因 14 合計 >5.5 拒絕、裁切或改寫。
  const items = structuredClone(currentState.excel.items);
  const currentAr = items[AR_ITEM_ID];
  const arValues = {
    line1: typeof currentAr?.line1 === "string" ? currentAr.line1 : "",
    line2: typeof currentAr?.line2 === "string" ? currentAr.line2 : ""
  };
  const arAnchors = findArFieldAnchors(rows, boundaries);
  AR_FIELD_DESCRIPTORS.forEach(({ fieldId }) => {
    const matches = arAnchors.get(fieldId);
    if (matches.length !== 1) return;
    const valueColumn = mergedValueColumn(worksheet, matches[0]);
    arValues[fieldId] = cellString(rows[matches[0].row]?.[valueColumn]);
  });
  items[AR_ITEM_ID] = arValues;

  // 15_MSBN 欄位（optional）：只認 15_MSBN item block 內、恰一個 anchor 的欄位；
  // 缺欄或多候選時保留現值（同一 unique-anchor 安全原則，不取第一個），不使整份
  // 合法工單失敗。文字欄不因 Editor weighted limit 拒絕、不呼叫 banwords、合法
  // blank 清空。days 僅接受 formatted ""｜"1"～"9"，其他值整份 import atomic reject。
  const currentMsbn = items[MSBN_ITEM_ID];
  const msbnValues = Object.fromEntries(
    MSBN_FIELD_DESCRIPTORS.map(({ fieldId }) => [
      fieldId,
      typeof currentMsbn?.[fieldId] === "string" ? currentMsbn[fieldId] : ""
    ])
  );
  const msbnAnchors = findMsbnFieldAnchors(rows, boundaries, blocks);
  MSBN_FIELD_DESCRIPTORS.forEach(({ fieldId }) => {
    const matches = msbnAnchors.get(fieldId);
    if (matches.length !== 1) return;
    const valueColumn = mergedValueColumn(worksheet, matches[0]);
    const value = cellString(rows[matches[0].row]?.[valueColumn]);
    if (fieldId === MSBN_DAYS_FIELD_ID && value !== "" && !MSBN_DAYS_IMPORT_PATTERN.test(value)) {
      throw new ExcelImportError(["工單的到貨後天數只接受 1～9，已拒絕整份匯入。"]);
    }
    msbnValues[fieldId] = value;
  });
  items[MSBN_ITEM_ID] = msbnValues;

  return {
    sourceName: file.name,
    sharedText,
    items
  };
}

export const excelFieldDescriptors = FIELD_DESCRIPTORS;
