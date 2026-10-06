// SPX 開獎秀 — 線上／電子BN：正式工單 Excel 匯入
// ---------------------------------------------------------------------------
// 解析只負責 canonical work-order contract；不解析下方 01～17 同步表，
// 不持有 layout state，也不依賴檔名或 layout id。
// ---------------------------------------------------------------------------

import { normalize as normalizeQrUrl, isEmpty as isQrUrlEmpty } from "./qr-url-utils.js";
import { validateTextValues } from "./text-validation.js";

export const TARGET_SHEET_NAME = "美術工單_線上電子BN";
export const CANONICAL_REGION = Object.freeze({ minRow: 13, maxRow: 17, minCol: 0, maxCol: 5 });

const IDENTITY = Object.freeze({
  workItem: "蝦皮店到店 百萬開獎秀電子版位曝光",
  filledMarker: "需填寫",
  sectionMarker: "總製作內容",
  title: "主標 (限8字內)",
  subtitle: "副標 (限7字內)",
  small1: "小字 - 第一行 (限18字內)",
  small2: "小字 - 第二行 (限18字內)",
  qr: "電子版位活動頁縮址"
});

const EXPECTED_MARKERS = Object.freeze([
  "01_DDcard BN", "02_Mall HBN", "03_LPBN", "04_POP UP", "05_IG",
  "06_FB Post", "07_OM與FEED", "08_SKBN_APP左右", "09_SKBN_APP中",
  "10_SKBN_PC", "11_遊戲大廳 MSBN", "12_TVBN_一般門市", "13_TVBN_智取店",
  "14_繳費機直式BN-立保", "15_繳費機直式BN-博辰", "16_繳費機下方BN-立保",
  "17_繳費機下方BN-博辰"
]);

const TEXT_FIELDS = Object.freeze([
  Object.freeze({ id: "title", label: "主標", limit: 8 }),
  Object.freeze({ id: "subtitle", label: "副標", limit: 7 }),
  Object.freeze({ id: "small1", label: "小字 1", limit: 18 }),
  Object.freeze({ id: "small2", label: "小字 2", limit: 18 })
]);

function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function address(row, column) {
  return `${columnName(column)}${row + 1}`;
}

function decodeAddress(value) {
  const match = /^([A-Z]+)(\d+)$/.exec(value);
  if (!match) throw new Error(`無法解析 Excel cell：${value}`);
  let column = 0;
  for (const character of match[1]) column = column * 26 + character.charCodeAt(0) - 64;
  return { row: Number(match[2]) - 1, col: column - 1 };
}

function mergedTopLeft(sheet, row, col) {
  const merges = sheet["!merges"] ?? [];
  for (const merge of merges) {
    if (
      row >= merge.s.r && row <= merge.e.r &&
      col >= merge.s.c && col <= merge.e.c
    ) {
      return merge.s;
    }
  }
  return { row, col };
}

function cellValue(sheet, row, col) {
  const topLeft = mergedTopLeft(sheet, row, col);
  const cell = sheet[address(topLeft.r ?? topLeft.row, topLeft.c ?? topLeft.col)];
  if (!cell) return "";
  return cell.v ?? cell.w ?? "";
}

function rawCellValue(sheet, row, col) {
  const cell = sheet[address(row, col)];
  if (!cell) return "";
  return cell.v ?? cell.w ?? "";
}

function textValue(value) {
  return String(value ?? "");
}

function findUnique(sheet, expected, bounds) {
  const matches = [];
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      if (textValue(rawCellValue(sheet, row, col)) === expected) matches.push({ row, col });
    }
  }
  if (matches.length !== 1) {
    throw new Error(`工單身分驗證失敗：找不到唯一的「${expected}」。`);
  }
  return matches[0];
}

function readAdjacentValue(sheet, labelCell, bounds) {
  for (let col = labelCell.col + 1; col <= bounds.maxCol; col += 1) {
    const value = cellValue(sheet, labelCell.row, col);
    if (textValue(value) !== "") return textValue(value);
  }
  return "";
}

function validateIdentity(sheet) {
  const top = { minRow: 0, maxRow: 11, minCol: 0, maxCol: 25 };
  if (textValue(cellValue(sheet, 3, 1)) !== IDENTITY.workItem) {
    throw new Error("工單身分驗證失敗：工作項目名稱不符。");
  }
  if (textValue(cellValue(sheet, 4, 0)) !== IDENTITY.sectionMarker) {
    throw new Error("工單身分驗證失敗：總製作內容標記不符。");
  }
  const marker = findUnique(sheet, IDENTITY.filledMarker, { minRow: 0, maxRow: 30, minCol: 0, maxCol: 5 });
  EXPECTED_MARKERS.forEach((value) => findUnique(sheet, value, top));
  return marker;
}

function locateCanonical(sheet) {
  const marker = validateIdentity(sheet);
  const bounds = { ...CANONICAL_REGION, minRow: marker.row, maxRow: marker.row + 4 };
  const labels = {
    title: findUnique(sheet, IDENTITY.title, bounds),
    subtitle: findUnique(sheet, IDENTITY.subtitle, bounds),
    small1: findUnique(sheet, IDENTITY.small1, bounds),
    small2: findUnique(sheet, IDENTITY.small2, bounds),
    qrUrl: findUnique(sheet, IDENTITY.qr, bounds)
  };
  return { bounds, labels };
}

export function extractCanonicalValues(sheet) {
  const { bounds, labels } = locateCanonical(sheet);
  return {
    title: readAdjacentValue(sheet, labels.title, bounds),
    subtitle: readAdjacentValue(sheet, labels.subtitle, bounds),
    small1: readAdjacentValue(sheet, labels.small1, bounds),
    small2: readAdjacentValue(sheet, labels.small2, bounds),
    qrUrl: readAdjacentValue(sheet, labels.qrUrl, bounds)
  };
}

export function applyImportedWorkOrder(layout, state, importedWorkOrder) {
  layout.textOrder.forEach((fieldId) => {
    state.text[fieldId] = importedWorkOrder[fieldId] ?? "";
  });
  if (layout.qr !== undefined) state.qrUrl = importedWorkOrder.qrUrl;
  return state;
}

export async function parseWorkOrderCandidate(file, XLSX) {
  if (!file) throw new Error("請先選擇 Excel 工單。");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellFormula: true,
    cellHTML: false,
    cellStyles: false
  });
  const sheet = workbook.Sheets[TARGET_SHEET_NAME];
  if (!sheet) throw new Error(`找不到正式工作表「${TARGET_SHEET_NAME}」。`);

  const extracted = extractCanonicalValues(sheet);
  const text = validateTextValues(extracted, TEXT_FIELDS);
  const qrUrl = isQrUrlEmpty(extracted.qrUrl) ? "" : normalizeQrUrl(extracted.qrUrl);
  if (qrUrl === null) throw new Error("電子版位活動頁縮址不是有效的 http／https 網址。");

  return { ...text, qrUrl };
}
