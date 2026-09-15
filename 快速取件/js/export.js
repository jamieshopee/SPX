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
  if (item.format === "png") {
    if (options.maxBytes === undefined || options.maxBytes === null) return true;
    // PNG 容量 policy（FSS D 樣式機制）必須完整：上限、DPI 與 fallback 色數缺一即未就緒。
    return Number.isInteger(options.maxBytes) &&
      options.maxBytes > 0 &&
      typeof options.dpi === "number" &&
      Number.isFinite(options.dpi) &&
      options.dpi > 0 &&
      Number.isInteger(options.indexedFallbackColors) &&
      options.indexedFallbackColors >= 2 &&
      options.indexedFallbackColors <= 256;
  }
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

// --- PNG pHYs 72 dpi patch（byte-level；結構性搬用 FSS 正式機制）---
// 不重新 encode、不動 IDAT pixel data；於 IHDR 後插入 pHYs（既有 pHYs 一律移除）。

function writeUint32(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePhysChunk(dpi) {
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  writeUint32(chunk, 0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  writeUint32(chunk, 8, pixelsPerMeter);
  writeUint32(chunk, 12, pixelsPerMeter);
  chunk[16] = 1;
  writeUint32(chunk, 17, crc32(chunk.subarray(4, 17)));
  return chunk;
}

const PNG_SIGNATURE = Object.freeze([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function patchPngDpiBytes(source, dpi) {
  if (
    source.length < 8 ||
    !PNG_SIGNATURE.every((byte, index) => source[index] === byte)
  ) {
    throw new Error("PNG 檔案結構無效。");
  }

  const parts = [source.subarray(0, 8)];
  let offset = 8;
  let inserted = false;

  while (offset < source.length) {
    if (offset + 8 > source.length) {
      throw new Error("PNG metadata 結構無效。");
    }
    const view = new DataView(source.buffer, source.byteOffset + offset, 8);
    const length = view.getUint32(0);
    const type = String.fromCharCode(...source.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (end > source.length) {
      throw new Error("PNG metadata 結構無效。");
    }
    if (type !== "pHYs") {
      parts.push(source.subarray(offset, end));
    }
    if (type === "IHDR" && !inserted) {
      parts.push(makePhysChunk(dpi));
      inserted = true;
    }
    offset = end;
  }

  if (!inserted) {
    throw new Error("PNG 缺少必要的 IHDR metadata。");
  }

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let position = 0;
  parts.forEach((part) => {
    result.set(part, position);
    position += part.length;
  });
  return result;
}

async function setPngDpi(blob, dpi) {
  const patched = patchPngDpiBytes(new Uint8Array(await blob.arrayBuffer()), dpi);
  return new Blob([patched], { type: "image/png" });
}

// PNG 容量機制（Jamie 裁決，完整比照 FSS D 樣式 POP UP）：
// native lossless PNG → pHYs dpi patch → patched bytes <= maxBytes 即採用；
// 超限 → 由「原始 Canvas raw RGBA」以 UPNG 產 indexed fallback（保留 alpha，
// 不以 patched PNG 為中間 pixel 來源）→ 再 patch dpi → 仍超限 → 整次 Export
// fail-closed。無 quality／floor／binary search（PNG 無此概念）。
async function encodePngWithinLimit(canvas, item) {
  const { maxBytes, dpi, indexedFallbackColors } = item.encoderOptions;

  const nativeBlob = await setPngDpi(await canvasToBlob(canvas, "image/png"), dpi);
  if (nativeBlob.size <= maxBytes) return nativeBlob;

  if (!globalThis.pako || !globalThis.UPNG) {
    throw new Error("PNG 壓縮程式庫尚未載入。");
  }

  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法讀取 Canvas 2D context。");
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const encodedBuffer = globalThis.UPNG.encode(
    [imageData.data.buffer],
    canvas.width,
    canvas.height,
    indexedFallbackColors
  );
  const fallbackBlob = await setPngDpi(
    new Blob([encodedBuffer], { type: "image/png" }),
    dpi
  );
  if (fallbackBlob.size > maxBytes) {
    throw new Error(
      `${item.name} 以 ${indexedFallbackColors} 色 PNG 壓縮後仍為 ${fallbackBlob.size} bytes，超過容量上限 ${maxBytes} bytes，無法輸出完整專案。`
    );
  }
  return fallbackBlob;
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
  const hasMaxBytes = item.encoderOptions.maxBytes !== undefined &&
    item.encoderOptions.maxBytes !== null;
  if (item.format === "png" && hasMaxBytes) {
    // PNG 容量機制內含 dpi patch，直接回傳最終 blob，不再經 metadata hook。
    return encodePngWithinLimit(canvas, item);
  }
  const blob = item.format === "png"
    ? await canvasToBlob(canvas, "image/png")
    : hasMaxBytes
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
