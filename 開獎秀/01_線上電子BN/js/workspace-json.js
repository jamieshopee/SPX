import { normalize as normalizeQrUrl, isEmpty as isQrUrlEmpty } from "./qr-url-utils.js";
import { validateTextValues } from "./text-validation.js";
import { normalizeHex } from "./controls.js";

export const WORKSPACE_FORMAT = "SPX Lottery Show Online BN Workspace";
export const WORKSPACE_VERSION = 1;

const TEXT_FIELDS = Object.freeze([
  Object.freeze({ id: "title", label: "主標", limit: 8 }),
  Object.freeze({ id: "subtitle", label: "副標", limit: 7 }),
  Object.freeze({ id: "small1", label: "小字 1", limit: 18 }),
  Object.freeze({ id: "small2", label: "小字 2", limit: 18 })
]);
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

export function serializeWorkspace({ styleId, activeLayoutId, workspace, sourceName = null }) {
  return JSON.stringify({
    format: WORKSPACE_FORMAT,
    version: WORKSPACE_VERSION,
    styleId,
    activeLayoutId,
    workspace: {
      text: {
        title: String(workspace.text.title ?? ""),
        subtitle: String(workspace.text.subtitle ?? ""),
        small1: String(workspace.text.small1 ?? ""),
        small2: String(workspace.text.small2 ?? "")
      },
      colors: {
        background: workspace.colors.background,
        title: workspace.colors.title,
        subtitle: workspace.colors.subtitle,
        small: workspace.colors.small
      },
      logoMode: workspace.logoMode,
      qrUrl: workspace.qrUrl ?? ""
    },
    import: { sourceName: sourceName === null ? null : String(sourceName) }
  }, null, 2);
}

export function parseWorkspaceJson(text, { currentStyleId, getLayout }) {
  let source;
  try {
    source = JSON.parse(text);
  } catch (_error) {
    throw new WorkspaceJsonError("暫存檔 JSON 格式錯誤。");
  }
  if (!isPlainObject(source) || source.format !== WORKSPACE_FORMAT) {
    throw new WorkspaceJsonError("此檔案不是線上／電子BN 暫存檔。");
  }
  if (source.version !== WORKSPACE_VERSION) {
    throw new WorkspaceJsonError(`不支援此暫存檔版本；目前版本為 ${WORKSPACE_VERSION}。`);
  }
  if (source.styleId !== currentStyleId) {
    throw new WorkspaceJsonError("暫存檔樣式與目前 URL 樣式不一致。");
  }
  if (typeof source.activeLayoutId !== "string" || !getLayout(source.activeLayoutId)) {
    throw new WorkspaceJsonError("暫存檔版位無效。");
  }
  if (!isPlainObject(source.workspace)) {
    throw new WorkspaceJsonError("workspace 缺失或格式無效。");
  }
  const textSource = source.workspace.text;
  if (!isPlainObject(textSource)) throw new WorkspaceJsonError("workspace.text 缺失或格式無效。");
  let validatedText;
  try {
    validatedText = validateTextValues(textSource, TEXT_FIELDS);
  } catch (error) {
    throw new WorkspaceJsonError(error instanceof Error ? error.message : "workspace.text 無效。");
  }

  const colorsSource = source.workspace.colors;
  if (!isPlainObject(colorsSource)) throw new WorkspaceJsonError("workspace.colors 缺失或格式無效。");
  const colors = {};
  COLOR_FIELDS.forEach((field) => {
    const color = normalizeHex(colorsSource[field]);
    if (!color) throw new WorkspaceJsonError(`workspace.colors.${field} 無效。`);
    colors[field] = color;
  });

  if (!LOGO_MODES.includes(source.workspace.logoMode)) {
    throw new WorkspaceJsonError("workspace.logoMode 無效。");
  }
  const rawQr = source.workspace.qrUrl;
  const qrUrl = isQrUrlEmpty(rawQr) ? "" : normalizeQrUrl(rawQr);
  if (qrUrl === null) throw new WorkspaceJsonError("workspace.qrUrl 不是有效的 http／https 網址。");

  if (!isPlainObject(source.import) ||
      !(source.import.sourceName === null || typeof source.import.sourceName === "string")) {
    throw new WorkspaceJsonError("import.sourceName 無效。");
  }

  return {
    styleId: source.styleId,
    activeLayoutId: source.activeLayoutId,
    workspace: { text: validatedText, colors, logoMode: source.workspace.logoMode, qrUrl },
    sourceName: source.import.sourceName
  };
}
