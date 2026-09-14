import { ITEMS } from "./registry.js";
import { isRendererReady, renderItemToCanvas } from "./renderer.js";
import { serializeWorkspace } from "./workspace-json.js";

const metadataHooks = new Map();

export class ExportReadinessError extends Error {
  constructor(items) {
    super(`尚未完成逐項視覺設定：${items.map(({ id }) => id).join("、")}`);
    this.name = "ExportReadinessError";
    this.items = items;
  }
}

export function localDateCode(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

export function isEncoderPolicyReady(item) {
  const options = item?.encoderOptions;
  if (!options || typeof options !== "object") return false;
  if (item.format === "png") return true;
  return item.format === "jpg" &&
    typeof options.quality === "number" &&
    options.quality >= 0 &&
    options.quality <= 1;
}

export function getUnreadyExportItems() {
  return ITEMS.filter((item) => !isRendererReady(item) || !isEncoderPolicyReady(item));
}

export function registerExportMetadataHook(format, hook) {
  if (typeof hook !== "function") throw new TypeError("metadata hook 必須是 function。");
  metadataHooks.set(format, hook);
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("圖片編碼失敗。")),
      mimeType,
      quality
    );
  });
}

async function encodeItem(canvas, item) {
  const blob = item.format === "png"
    ? await canvasToBlob(canvas, "image/png")
    : await canvasToBlob(canvas, "image/jpeg", item.encoderOptions.quality);
  const dpi = item.encoderOptions.dpi;
  if (dpi === undefined || dpi === null) return blob;
  const hook = metadataHooks.get(item.format);
  if (!hook) throw new Error(`${item.format.toUpperCase()} 尚未註冊 DPI metadata hook。`);
  return hook(blob, dpi);
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportWorkspace(state) {
  if (!globalThis.JSZip) throw new Error("ZIP 程式庫尚未載入。");
  const unready = getUnreadyExportItems();
  if (unready.length) throw new ExportReadinessError(unready);

  const snapshot = structuredClone(state);
  const dateCode = localDateCode();
  const zip = new globalThis.JSZip();

  for (const item of ITEMS) {
    const canvas = await renderItemToCanvas({ itemId: item.id, stateSnapshot: snapshot });
    const blob = await encodeItem(canvas, item);
    zip.file(`${item.name}.${item.format}`, blob);
  }

  zip.file(`快速取件_${dateCode}.json`, serializeWorkspace(snapshot));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  triggerDownload(blob, `快速取件_${dateCode}.zip`);
}
