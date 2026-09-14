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
  const qualityReady = item.format === "jpg" &&
    typeof options.quality === "number" &&
    options.quality >= 0 &&
    options.quality <= 1;
  if (!qualityReady) return false;
  if (options.maxBytes === undefined || options.maxBytes === null) return true;
  // 容量控制 policy（FSS 式壓縮機制）必須完整：上限、floor 與固定搜尋次數缺一即未就緒。
  return Number.isInteger(options.maxBytes) &&
    options.maxBytes > 0 &&
    typeof options.qualityFloor === "number" &&
    options.qualityFloor >= 0 &&
    options.qualityFloor <= options.quality &&
    Number.isInteger(options.searchSteps) &&
    options.searchSteps > 0;
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

// 結構性搬用 FSS BN 正式 JPG 容量機制（Jamie 裁決）：先以 initial quality encode，
// 達標直接採用；未達標先驗 quality floor（仍超標 → 整次 Export fail-closed），
// 再以固定次數 binary search 找「符合上限的最高 quality」。容量以 encode 後
// blob.size 判定；快速取件無 DPI requirement，不做 FSS 的 72 dpi byte patch。
async function encodeJpegWithinLimit(canvas, item) {
  const { quality, maxBytes, qualityFloor, searchSteps } = item.encoderOptions;

  const fullQualityBlob = await canvasToBlob(canvas, "image/jpeg", quality);
  if (fullQualityBlob.size <= maxBytes) return fullQualityBlob;

  const floorBlob = await canvasToBlob(canvas, "image/jpeg", qualityFloor);
  if (floorBlob.size > maxBytes) {
    throw new Error(
      `${item.name} 在最低品質 ${qualityFloor} 下仍超過容量上限 ${maxBytes} bytes，無法輸出完整專案。`
    );
  }

  let fittingQuality = qualityFloor;
  let exceedingQuality = quality;
  let bestBlob = floorBlob;
  for (let step = 0; step < searchSteps; step += 1) {
    const candidateQuality = (fittingQuality + exceedingQuality) / 2;
    const candidate = await canvasToBlob(canvas, "image/jpeg", candidateQuality);
    if (candidate.size <= maxBytes) {
      bestBlob = candidate;
      fittingQuality = candidateQuality;
    } else {
      exceedingQuality = candidateQuality;
    }
  }
  return bestBlob;
}

async function encodeItem(canvas, item) {
  const useJpegLimit = item.format === "jpg" &&
    item.encoderOptions.maxBytes !== undefined &&
    item.encoderOptions.maxBytes !== null;
  const blob = item.format === "png"
    ? await canvasToBlob(canvas, "image/png")
    : useJpegLimit
      ? await encodeJpegWithinLimit(canvas, item)
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
