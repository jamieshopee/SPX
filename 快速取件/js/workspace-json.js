import { ITEMS, isItemId } from "./registry.js";
import { createInitialState, emptyMsbnData, isMsbnDaysValue, MSBN_DAYS_FIELD, MSBN_TEXT_FIELDS } from "./workspace.js";
import { decodeImageSource } from "./kv.js";
import { normalizeHex } from "./color-control.js";

export const WORKSPACE_FORMAT = "SPX Quick Pickup Workspace";
export const WORKSPACE_VERSION = 1;

export class WorkspaceJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkspaceJsonError";
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

// 14_AR（Jamie 裁決）：items["14"] 承載 line1／line2；舊 v1 的 14={} 向後相容為
// 兩欄空字串（不列 issue、不升 schema version）。JSON Import 沿 shared.text 既有
// 策略：合法字串原樣收納，不因合計 >5.5 裁切或改寫（上限由 Editor 後續 enforce）。
// 15_MSBN（Jamie 裁決）：items["15"] 承載六欄；舊 v1 的 15={} 向後相容為六欄空白
//（不列 issue、不升 version）。文字欄不因 Editor weighted limit 拒絕；
// days 只接受 ""｜"1"～"9"，非法值整份暫存檔 fail-closed reject（不 clamp）。
function validateItemContainers(value, issues, candidate) {
  if (!isPlainObject(value)) {
    issues.push("excel.items 缺失或格式無效");
    return;
  }
  ITEMS.forEach(({ id }) => {
    const entry = value[id];
    if (id === "15") {
      const next = emptyMsbnData();
      const knownFields = [...MSBN_TEXT_FIELDS, MSBN_DAYS_FIELD];
      if (!isPlainObject(entry)) {
        issues.push("excel.items.15 缺失或格式無效");
      } else {
        if (Object.hasOwn(entry, MSBN_DAYS_FIELD)) {
          if (typeof entry[MSBN_DAYS_FIELD] !== "string" || !isMsbnDaysValue(entry[MSBN_DAYS_FIELD])) {
            throw new WorkspaceJsonError("excel.items.15.days 只接受空白或 1～9，已拒絕整份暫存檔。");
          }
          next[MSBN_DAYS_FIELD] = entry[MSBN_DAYS_FIELD];
        }
        MSBN_TEXT_FIELDS.forEach((field) => {
          if (typeof entry[field] === "string") next[field] = entry[field];
          else if (Object.hasOwn(entry, field)) issues.push(`excel.items.15.${field} 無效`);
        });
        if (Object.keys(entry).some((key) => !knownFields.includes(key))) {
          issues.push("excel.items.15 含未知欄位，已忽略");
        }
      }
      candidate.excel.items["15"] = next;
      return;
    }
    if (id === "14") {
      const next = { line1: "", line2: "" };
      if (!isPlainObject(entry)) {
        issues.push("excel.items.14 缺失或格式無效");
      } else {
        ["line1", "line2"].forEach((field) => {
          if (typeof entry[field] === "string") next[field] = entry[field];
          else if (Object.hasOwn(entry, field)) issues.push(`excel.items.14.${field} 無效`);
        });
        if (Object.keys(entry).some((key) => key !== "line1" && key !== "line2")) {
          issues.push("excel.items.14 含未知欄位，已忽略");
        }
      }
      candidate.excel.items["14"] = next;
      return;
    }
    if (!isPlainObject(entry) || Object.keys(entry).length !== 0) {
      issues.push(`excel.items.${id} 必須是目前 v1 的空白 deferred structure`);
      candidate.excel.items[id] = {};
    }
  });
}

async function validateKv(value, issues) {
  if (value === null) return null;
  if (!isPlainObject(value)) {
    issues.push("shared.kv 格式無效");
    return null;
  }
  const hasShape =
    typeof value.dataUrl === "string" &&
    value.dataUrl.startsWith("data:image/") &&
    typeof value.mimeType === "string" &&
    typeof value.fileName === "string" &&
    Number.isInteger(value.width) && value.width > 0 &&
    Number.isInteger(value.height) && value.height > 0;
  if (!hasShape) {
    issues.push("shared.kv 欄位缺失或格式無效");
    return null;
  }
  try {
    const dimensions = await decodeImageSource(value.dataUrl);
    return {
      dataUrl: value.dataUrl,
      mimeType: value.mimeType,
      fileName: value.fileName,
      width: dimensions.width,
      height: dimensions.height
    };
  } catch (_error) {
    issues.push("shared.kv 圖片資料無法解碼");
    return null;
  }
}

export function serializeWorkspace(state) {
  return JSON.stringify(
    {
      format: WORKSPACE_FORMAT,
      version: WORKSPACE_VERSION,
      selectedItemId: state.selectedItemId,
      shared: structuredClone(state.shared),
      excel: structuredClone(state.excel)
    },
    null,
    2
  );
}

export async function parseWorkspaceJson(text) {
  let source;
  try {
    source = JSON.parse(text);
  } catch (_error) {
    throw new WorkspaceJsonError("暫存檔 JSON 格式錯誤。");
  }
  if (!isPlainObject(source) || source.format !== WORKSPACE_FORMAT) {
    throw new WorkspaceJsonError("此檔案不是快速取件暫存檔。");
  }
  if (source.version !== WORKSPACE_VERSION) {
    throw new WorkspaceJsonError(`不支援此暫存檔版本；目前版本為 ${WORKSPACE_VERSION}。`);
  }

  const candidate = createInitialState();
  const issues = [];

  if (isItemId(source.selectedItemId)) candidate.selectedItemId = source.selectedItemId;
  else issues.push("selectedItemId 缺失或無效");

  if (!isPlainObject(source.shared)) {
    issues.push("shared 缺失或格式無效");
  } else {
    const textSource = source.shared.text;
    if (!isPlainObject(textSource)) {
      issues.push("shared.text 缺失或格式無效");
    } else {
      ["title", "subtitle", "small"].forEach((field) => {
        if (typeof textSource[field] === "string") candidate.shared.text[field] = textSource[field];
        else issues.push(`shared.text.${field} 缺失或無效`);
      });
    }

    const colorSource = source.shared.colors;
    if (!isPlainObject(colorSource)) {
      issues.push("shared.colors 缺失或格式無效");
    } else {
      ["background", "title", "subtitle", "small"].forEach((field) => {
        const color = normalizeHex(colorSource[field]);
        if (color) candidate.shared.colors[field] = color;
        else issues.push(`shared.colors.${field} 缺失或無效`);
      });
    }

    if (["auto", "orange", "white"].includes(source.shared.logoMode)) {
      candidate.shared.logoMode = source.shared.logoMode;
    } else {
      issues.push("shared.logoMode 缺失或無效");
    }

    if (Object.hasOwn(source.shared, "kv")) {
      candidate.shared.kv = await validateKv(source.shared.kv, issues);
    } else {
      issues.push("shared.kv 缺失");
    }
  }

  if (!isPlainObject(source.excel)) {
    issues.push("excel 缺失或格式無效");
  } else {
    if (source.excel.sourceName === null || typeof source.excel.sourceName === "string") {
      candidate.excel.sourceName = source.excel.sourceName;
    } else {
      issues.push("excel.sourceName 缺失或無效");
    }
    validateItemContainers(source.excel.items, issues, candidate);
  }

  return { candidate, issues, level: issues.length ? "incomplete" : "complete" };
}

export async function restoreWorkspaceFile(file, workspace) {
  const result = await parseWorkspaceJson(await file.text());
  if (result.level === "incomplete") {
    const message = [
      "暫存檔缺少或包含無效資料，系統將以初始值補齊列出的欄位。仍要匯入嗎？",
      "",
      ...result.issues.map((issue) => `- ${issue}`)
    ].join("\n");
    if (!window.confirm(message)) return { restored: false, cancelled: true, issues: result.issues };
  }
  workspace.dispatch({ type: "REPLACE_WORKSPACE", state: result.candidate });
  return { restored: true, cancelled: false, issues: result.issues };
}
