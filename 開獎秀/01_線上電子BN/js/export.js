import { createInitialState, renderLayoutToCanvas } from "./layout-engine.js";

const VENDOR_FILES = Object.freeze([
  ["jszip", new URL("../vendor/jszip.min.js", import.meta.url), "JSZip"],
  ["pako", new URL("../vendor/pako.min.js", import.meta.url), "pako"],
  ["upng", new URL("../vendor/upng.js", import.meta.url), "UPNG"]
]);

const FORMAT_BY_INDEX = Object.freeze([
  "jpg", "jpg", "jpg", "png", "jpg", "jpg", "jpg", "jpg", "jpg",
  "png", "png", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg"
]);
const DEFAULT_QR_URL = "https://shopee.tw/m/spxlottery";
let vendorPromise = null;

function loadScript(url, mark, globalName) {
  if (globalThis[globalName]) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-online-bn-vendor="${mark}"]`);
    if (existing) {
      existing.addEventListener("load", () => globalThis[globalName] ? resolve() : reject(new Error(`${mark} 程式庫載入失敗。`)), { once: true });
      existing.addEventListener("error", () => reject(new Error(`${mark} 程式庫載入失敗。`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = url.href;
    script.dataset.onlineBnVendor = mark;
    script.addEventListener("load", () => globalThis[globalName] ? resolve() : reject(new Error(`${mark} 程式庫載入失敗。`)), { once: true });
    script.addEventListener("error", () => reject(new Error(`${mark} 程式庫載入失敗。`)), { once: true });
    document.head.append(script);
  });
}

export function ensureExportVendors() {
  vendorPromise ||= VENDOR_FILES.reduce(
    (promise, [mark, url, globalName]) => promise.then(() => loadScript(url, mark, globalName)),
    Promise.resolve()
  ).catch((error) => {
    vendorPromise = null;
    throw error;
  });
  return vendorPromise;
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("圖片編碼失敗。")), mimeType, quality);
  });
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function patchPngDpiBytes(source, dpi) {
  if (source.length < 8 || source[0] !== 0x89 || source[1] !== 0x50 || source[2] !== 0x4e || source[3] !== 0x47) {
    throw new Error("PNG 檔案結構無效。");
  }
  const ppm = Math.round(dpi / 0.0254);
  const phys = new Uint8Array(21);
  writeUint32(phys, 0, 9); phys.set([0x70, 0x48, 0x59, 0x73], 4);
  writeUint32(phys, 8, ppm); writeUint32(phys, 12, ppm); phys[16] = 1;
  writeUint32(phys, 17, crc32(phys.subarray(4, 17)));
  const parts = [source.subarray(0, 8)]; let offset = 8; let inserted = false;
  while (offset < source.length) {
    if (offset + 8 > source.length) throw new Error("PNG metadata 結構無效。");
    const length = new DataView(source.buffer, source.byteOffset + offset, 4).getUint32(0);
    const type = String.fromCharCode(...source.subarray(offset + 4, offset + 8));
    const end = offset + length + 12;
    if (end > source.length) throw new Error("PNG metadata 結構無效。");
    if (type !== "pHYs") parts.push(source.subarray(offset, end));
    if (type === "IHDR" && !inserted) { parts.push(phys); inserted = true; }
    offset = end;
  }
  if (!inserted) throw new Error("PNG 缺少必要的 IHDR metadata。");
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let position = 0; parts.forEach((part) => { result.set(part, position); position += part.length; });
  return result;
}

async function encodeJpeg(canvas, layoutIndex) {
  if (layoutIndex !== 1) return canvasToBlob(canvas, "image/jpeg", 1.0);
  const maxBytes = 145000; const floor = 0.5; const steps = 7;
  const full = await canvasToBlob(canvas, "image/jpeg", 1.0);
  if (full.size <= maxBytes) return full;
  const floorBlob = await canvasToBlob(canvas, "image/jpeg", floor);
  if (floorBlob.size > maxBytes) throw new Error("02_Mall HBN 在最低品質 0.5 下仍超過 145000 bytes。");
  let low = floor; let high = 1.0; let best = floorBlob;
  for (let step = 0; step < steps; step += 1) {
    const quality = (low + high) / 2;
    const candidate = await canvasToBlob(canvas, "image/jpeg", quality);
    if (candidate.size <= maxBytes) { best = candidate; low = quality; } else high = quality;
  }
  return best;
}

async function encodePng(canvas, layoutIndex) {
  const native = await canvasToBlob(canvas, "image/png");
  if (layoutIndex !== 3) return native;
  const patched = new Blob([patchPngDpiBytes(new Uint8Array(await native.arrayBuffer()), 72)], { type: "image/png" });
  if (patched.size <= 250000) return patched;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法讀取 Canvas 2D context。");
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const encoded = globalThis.UPNG.encode([imageData.data.buffer], canvas.width, canvas.height, 256);
  const fallback = new Blob([patchPngDpiBytes(new Uint8Array(encoded), 72)], { type: "image/png" });
  if (fallback.size > 250000) throw new Error("04_POP UP 以 256 色 PNG 壓縮後仍超過 250000 bytes。");
  return fallback;
}

function localDateCode(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}
function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = fileName; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function stateForLayout(layout, styleId, workspace) {
  const state = createInitialState(layout, styleId);
  state.text = Object.fromEntries(layout.textOrder.map((id) => [id, workspace.text[id] ?? ""]));
  state.colors = { ...workspace.colors }; state.logoMode = workspace.logoMode;
  if (layout.qr !== undefined) state.qrUrl = workspace.qrUrl ?? DEFAULT_QR_URL;
  return state;
}

export async function exportWorkspace({ styleId, layouts, workspace, activeLayoutId, sourceName, serialize }) {
  await ensureExportVendors();
  const snapshot = structuredClone(workspace);
  const dateCode = localDateCode();
  const zip = new globalThis.JSZip();
  for (let index = 0; index < layouts.length; index += 1) {
    const layout = layouts[index];
    const canvas = await renderLayoutToCanvas({ layout, styleId, state: stateForLayout(layout, styleId, snapshot) });
    const blob = FORMAT_BY_INDEX[index] === "png" ? await encodePng(canvas, index) : await encodeJpeg(canvas, index);
    zip.file(`${layout.name}.${FORMAT_BY_INDEX[index]}`, blob);
  }
  zip.file(`線上電子BN_${dateCode}.json`, serialize({ styleId, activeLayoutId, workspace: snapshot, sourceName }));
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  triggerDownload(blob, `線上電子BN_${dateCode}.zip`);
  return { dateCode, entries: layouts.length + 1 };
}
