const BANWORDS_URL = new URL("../../assets/banwords.xlsx", import.meta.url);
const SHEET_NAME = "禁用語";
const REQUIRED_HEADERS = Object.freeze(["禁用語列表", "改字", "排除"]);

let rulesPromise = null;

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function parseRules(workbook) {
  const worksheet = workbook?.Sheets?.[SHEET_NAME];
  if (!worksheet) throw new Error(`共用禁用語缺少「${SHEET_NAME}」工作表。`);

  const rows = globalThis.XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false
  });
  const headers = rows[0] || [];
  REQUIRED_HEADERS.forEach((expected, index) => {
    if (stringValue(headers[index]).trim() !== expected) {
      throw new Error(`共用禁用語第 ${index + 1} 欄必須是「${expected}」。`);
    }
  });

  return rows.slice(1).flatMap((row, index) => {
    const keyword = stringValue(row[0]).trim();
    if (!keyword) return [];
    return [{
      row: index + 2,
      keyword,
      replacement: stringValue(row[1]).trim(),
      exclude: stringValue(row[2]).trim(),
      message: stringValue(row[3]).trim()
    }];
  });
}

export function loadBanwordRules() {
  if (rulesPromise) return rulesPromise;
  rulesPromise = (async () => {
    if (!globalThis.XLSX) throw new Error("Excel 解析程式庫尚未載入。");
    const response = await fetch(BANWORDS_URL);
    if (!response.ok) throw new Error(`無法載入共用禁用語（HTTP ${response.status}）。`);
    const workbook = globalThis.XLSX.read(await response.arrayBuffer(), {
      type: "array",
      cellDates: false
    });
    const rules = parseRules(workbook);
    if (!rules.length) throw new Error("共用禁用語沒有可用規則。");
    return Object.freeze(rules.map((rule) => Object.freeze(rule)));
  })();
  return rulesPromise;
}

function splitList(value) {
  return stringValue(value)
    .split(/[\n,，、、/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRegexKeyword(keyword) {
  if (!keyword || keyword === "-" || keyword === "~" || keyword.length === 1) return false;
  return (
    /\\[dDsSwWbB]/.test(keyword) ||
    /^\^.*\$$/.test(keyword) ||
    /[+*?]+/.test(keyword) ||
    /\[[^\]]+\]/.test(keyword) ||
    /\([^)]*\)/.test(keyword) ||
    /\|/.test(keyword) ||
    /\\./.test(keyword)
  );
}

function buildPattern(keyword) {
  const flags = /[A-Za-z]/.test(keyword) ? "gi" : "g";
  if (keyword === "-") return /\-/g;
  if (keyword === "~") return /\~/g;
  if (isRegexKeyword(keyword)) {
    try {
      return new RegExp(keyword, flags);
    } catch (_error) {
      // Invalid source regex remains a literal rule.
    }
  }
  return new RegExp(escapeRegExp(keyword), flags);
}

function protectExcluded(text, excludeText) {
  let protectedText = text;
  const segments = [];
  splitList(excludeText).forEach((excluded) => {
    protectedText = protectedText.replace(
      new RegExp(escapeRegExp(excluded), "g"),
      (match) => {
        const token = `__SPX_EXCLUDE_${segments.length}__`;
        segments.push({ token, value: match });
        return token;
      }
    );
  });
  return { protectedText, segments };
}

function restoreExcluded(text, segments) {
  return segments.reduce((value, segment) => value.replace(segment.token, segment.value), text);
}

export function applyBanwords(value, rules) {
  const original = stringValue(value);
  let text = original;
  let blocked = false;
  const messages = [];

  rules.forEach((rule) => {
    const { protectedText, segments } = protectExcluded(text, rule.exclude);
    const pattern = buildPattern(rule.keyword);
    pattern.lastIndex = 0;
    if (!pattern.test(protectedText)) {
      text = restoreExcluded(protectedText, segments);
      return;
    }
    pattern.lastIndex = 0;
    const replacement = rule.replacement || "";
    const nextText = protectedText.replace(pattern, replacement);
    if (nextText !== protectedText) {
      if (!replacement) blocked = true;
      if (rule.message) messages.push(rule.message);
    }
    text = restoreExcluded(nextText, segments);
  });

  return {
    text,
    changed: text !== original,
    blocked,
    messages: [...new Set(messages)]
  };
}

export const banwordsSourceUrl = BANWORDS_URL.href;
