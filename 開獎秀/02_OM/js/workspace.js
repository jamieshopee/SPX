// SPX 開獎秀 — OM Workspace JSON contract

import { countTextUnits } from "./text-validation.js";

export const WORKSPACE_FORMAT = "SPX Lottery Show OM Workspace";
export const WORKSPACE_VERSION = 1;
const TEXT_LIMITS = Object.freeze({ title: 8, subtitle: 7, small1: 18, small2: 18 });
const COLOR_FIELDS = Object.freeze(["background", "title", "subtitle", "small"]);
const LOGO_MODES = Object.freeze(["auto", "orange", "white"]);

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

function normalizeColor(value, field) {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new WorkspaceJsonError(`workspace.colors.${field} 無效。`);
  }
  return value.toLowerCase();
}

function validateText(text) {
  if (!isPlainObject(text)) throw new WorkspaceJsonError("workspace.text 缺失或格式無效。");
  const normalized = {};
  Object.entries(TEXT_LIMITS).forEach(([field, limit]) => {
    if (typeof text[field] !== "string") throw new WorkspaceJsonError(`workspace.text.${field} 無效。`);
    if (countTextUnits(text[field]) > limit) throw new WorkspaceJsonError(`workspace.text.${field} 超過 ${limit} 字限制。`);
    normalized[field] = text[field];
  });
  return normalized;
}

function validateWorkspace(workspace) {
  if (!isPlainObject(workspace)) throw new WorkspaceJsonError("workspace 缺失或格式無效。");
  if (!isPlainObject(workspace.colors)) throw new WorkspaceJsonError("workspace.colors 缺失或格式無效。");
  const colors = Object.fromEntries(COLOR_FIELDS.map((field) => [field, normalizeColor(workspace.colors[field], field)]));
  if (!LOGO_MODES.includes(workspace.logoMode)) throw new WorkspaceJsonError("workspace.logoMode 無效。");
  return {
    text: validateText(workspace.text),
    colors,
    logoMode: workspace.logoMode
  };
}

export function serializeWorkspace({ styleId, activeLayoutId, state }) {
  return JSON.stringify({
    format: WORKSPACE_FORMAT,
    version: WORKSPACE_VERSION,
    item: "om",
    styleId,
    activeLayoutId,
    workspace: {
      text: { ...state.text },
      colors: { ...state.colors },
      logoMode: state.logoMode
    }
  }, null, 2);
}

export function parseWorkspaceJson(text, { currentStyleId, layoutIds }) {
  let source;
  try {
    source = JSON.parse(text);
  } catch (_error) {
    throw new WorkspaceJsonError("暫存檔 JSON 格式錯誤。");
  }
  if (!isPlainObject(source) || source.format !== WORKSPACE_FORMAT) {
    throw new WorkspaceJsonError("此檔案不是 OM 暫存檔。");
  }
  if (source.version !== WORKSPACE_VERSION) {
    throw new WorkspaceJsonError(`不支援此暫存檔版本；目前版本為 ${WORKSPACE_VERSION}。`);
  }
  if (source.item !== "om") throw new WorkspaceJsonError("暫存檔 item 無效。");
  if (source.styleId !== currentStyleId) throw new WorkspaceJsonError("暫存檔樣式與目前樣式不一致");
  if (!Array.isArray(layoutIds) || !layoutIds.includes(source.activeLayoutId)) {
    throw new WorkspaceJsonError("暫存檔 activeLayoutId 無效。");
  }
  return {
    styleId: source.styleId,
    activeLayoutId: source.activeLayoutId,
    state: validateWorkspace(source.workspace)
  };
}
