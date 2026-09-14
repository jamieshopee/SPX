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

function findFieldAnchors(rows) {
  const found = new Map(FIELD_DESCRIPTORS.map(({ fieldId }) => [fieldId, []]));
  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const label = normalizedLabel(value);
      FIELD_DESCRIPTORS.forEach((descriptor) => {
        if (descriptor.aliases.some((alias) => normalizeWorkbookText(alias) === label)) {
          found.get(descriptor.fieldId).push({ row: rowIndex, column: columnIndex });
        }
      });
    });
  });
  return found;
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
    const anchors = findFieldAnchors(rows);
    const hasUniqueAnchors = FIELD_DESCRIPTORS.every(
      ({ fieldId }) => anchors.get(fieldId).length === 1
    );
    if (hasUniqueAnchors && hasWorkbookMarker(rows)) {
      candidates.push({ sheetName, worksheet, rows, anchors });
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

  const { worksheet, rows, anchors } = identifyWorksheet(workbook);
  const sharedText = {};
  FIELD_DESCRIPTORS.forEach(({ fieldId }) => {
    const [anchor] = anchors.get(fieldId);
    const valueColumn = mergedValueColumn(worksheet, anchor);
    sharedText[fieldId] = cellString(rows[anchor.row]?.[valueColumn]);
  });

  return {
    sourceName: file.name,
    sharedText,
    items: structuredClone(currentState.excel.items)
  };
}

export const excelFieldDescriptors = FIELD_DESCRIPTORS;
