// SPX 開獎秀 — OM Excel 工單匯入
// ---------------------------------------------------------------------------
// 只解析「美術工單_OM」canonical input region 的四個共用文字欄位。
// OM01～OM08 下方同步展示區不是 parser source。
// ---------------------------------------------------------------------------

import { validateTextField } from "./text-validation.js";

export const TARGET_SHEET_NAME = "美術工單_OM";

const IDENTITY_LABEL = "工作項目名稱";
const IDENTITY_VALUE = "蝦皮店到店 百萬開獎秀 OM外廣";
const CONTENT_MARKER = "總製作內容";
const REGION_START = "需填寫";
const REGION_END = "以下不需填寫，自動同步主標、副標、小字";

const TEXT_FIELDS = Object.freeze([
  Object.freeze({ id: "title", anchor: "主標", label: "主標", limit: 8 }),
  Object.freeze({ id: "subtitle", anchor: "副標", label: "副標", limit: 7 }),
  Object.freeze({ id: "small1", anchor: "小字 - 第一行", label: "小字 - 第一行", limit: 18 }),
  Object.freeze({ id: "small2", anchor: "小字 - 第二行", label: "小字 - 第二行", limit: 18 })
]);

export class OmWorkOrderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "OmWorkOrderError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new OmWorkOrderError(code, message);
}

export function normalizeWorkbookText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ");
}

function normalizeAnchor(value) {
  return normalizeWorkbookText(value)
    .replace(/\s*[（(][^）)]*[）)]\s*$/u, "")
    .trim();
}

function cellString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function worksheetRows(XLSX, worksheet) {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true
  });
}

function findExact(rows, expected) {
  const matches = [];
  const normalizedExpected = normalizeWorkbookText(expected);
  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (normalizeWorkbookText(value) === normalizedExpected) matches.push({ row: rowIndex, column: columnIndex });
    });
  });
  return matches;
}

function requireUniqueTemplateMarker(rows, expected, description) {
  const matches = findExact(rows, expected);
  if (matches.length !== 1) fail("INVALID_TEMPLATE", `${description} 必須唯一存在。`);
  return matches[0];
}

function cellInMerge(worksheet, row, column) {
  return (worksheet["!merges"] ?? []).find((range) => (
    row >= range.s.r && row <= range.e.r &&
    column >= range.s.c && column <= range.e.c
  ));
}

function sheetBounds(XLSX, worksheet) {
  if (!worksheet["!ref"]) fail("INVALID_TEMPLATE", "OM 工單缺少有效工作表範圍。");
  return XLSX.utils.decode_range(worksheet["!ref"]);
}

function adjacentValue(XLSX, worksheet, rows, anchor, description) {
  const bounds = sheetBounds(XLSX, worksheet);
  const merge = cellInMerge(worksheet, anchor.row, anchor.column);
  const valueColumn = merge ? merge.e.c + 1 : anchor.column + 1;
  if (anchor.row > bounds.e.r || valueColumn > bounds.e.c) {
    fail("FIELD_NOT_FOUND", `${description} 缺少可定位的 value cell。`);
  }
  return cellString(rows[anchor.row]?.[valueColumn]);
}

function locateCanonicalRegion(rows) {
  const start = requireUniqueTemplateMarker(rows, REGION_START, "需填寫 marker");
  const ends = findExact(rows, REGION_END).filter((candidate) => (
    candidate.row > start.row && candidate.column <= start.column
  ));
  if (ends.length !== 1) {
    fail("INVALID_TEMPLATE", "OM canonical input region 的結束 marker 必須唯一且位於起點之後。");
  }
  return { start, end: ends[0] };
}

function locateField(rows, field, region) {
  const matches = [];
  for (let row = region.start.row + 1; row < region.end.row; row += 1) {
    for (let column = 0; column < (rows[row]?.length ?? 0); column += 1) {
      if (normalizeAnchor(rows[row][column]) === field.anchor) matches.push({ row, column });
    }
  }
  if (matches.length === 0) fail("FIELD_NOT_FOUND", `找不到 ${field.label} 欄位。`);
  if (matches.length > 1) fail("FIELD_AMBIGUOUS", `${field.label} 欄位出現多個候選。`);
  return matches[0];
}

function validateIdentity(XLSX, worksheet, rows) {
  const identityLabel = requireUniqueTemplateMarker(rows, IDENTITY_LABEL, "工作項目名稱 marker");
  const identityValue = adjacentValue(XLSX, worksheet, rows, identityLabel, "工作項目名稱");
  if (normalizeWorkbookText(identityValue) !== IDENTITY_VALUE) fail("INVALID_TEMPLATE", "OM 工單工作項目名稱不符。");
  requireUniqueTemplateMarker(rows, CONTENT_MARKER, "總製作內容 marker");
}

export function extractCanonicalValues(XLSX, worksheet) {
  const rows = worksheetRows(XLSX, worksheet);
  validateIdentity(XLSX, worksheet, rows);
  const region = locateCanonicalRegion(rows);
  const values = {};
  TEXT_FIELDS.forEach((field) => {
    const anchor = locateField(rows, field, region);
    values[field.id] = adjacentValue(XLSX, worksheet, rows, anchor, field.label);
  });
  return values;
}

export async function parseOmWorkOrderCandidate(file, XLSX) {
  if (!file || typeof file.arrayBuffer !== "function") fail("INVALID_FILE", "請先選擇 Excel 工單。");
  if (!XLSX?.read || !XLSX?.utils) fail("WORKBOOK_READ_FAILED", "Excel 解析程式庫尚未載入。");

  let workbook;
  try {
    workbook = XLSX.read(await file.arrayBuffer(), {
      type: "array",
      cellFormula: true,
      cellHTML: false,
      cellStyles: false
    });
  } catch (_error) {
    fail("WORKBOOK_READ_FAILED", "無法解析工單 Excel 檔案。");
  }

  const worksheet = workbook.Sheets?.[TARGET_SHEET_NAME];
  if (!worksheet) fail("SHEET_NOT_FOUND", `找不到正式工作表「${TARGET_SHEET_NAME}」。`);

  let extracted;
  try {
    extracted = extractCanonicalValues(XLSX, worksheet);
  } catch (error) {
    if (error instanceof OmWorkOrderError) throw error;
    fail("INVALID_TEMPLATE", "OM 工單格式驗證失敗。");
  }

  const validated = {};
  TEXT_FIELDS.forEach((field) => {
    try {
      validated[field.id] = validateTextField(extracted[field.id], field).value;
    } catch (_error) {
      fail("TEXT_LIMIT_EXCEEDED", `${field.label}超過 ${field.limit} 字限制。`);
    }
  });
  return validated;
}

export { TEXT_FIELDS };
