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

function findFieldAnchors(rows, boundaries) {
  return findAnchorsFor(FIELD_DESCRIPTORS, rows, boundaries);
}

function findArFieldAnchors(rows, boundaries) {
  return findAnchorsFor(AR_FIELD_DESCRIPTORS, rows, boundaries);
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
    const anchors = findFieldAnchors(rows, boundaries);
    const hasUniqueAnchors = FIELD_DESCRIPTORS.every(
      ({ fieldId }) => anchors.get(fieldId).length === 1
    );
    if (hasUniqueAnchors && hasWorkbookMarker(rows)) {
      candidates.push({ sheetName, worksheet, rows, anchors, boundaries });
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

  const { worksheet, rows, anchors, boundaries } = identifyWorksheet(workbook);
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

  return {
    sourceName: file.name,
    sharedText,
    items
  };
}

export const excelFieldDescriptors = FIELD_DESCRIPTORS;
