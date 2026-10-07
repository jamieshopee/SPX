// SPX 開獎秀 — OM full-project export

import { renderLayoutToCanvas } from "./renderer.js";
import { serializeWorkspace } from "./workspace.js";

const JSZIP_URL = new URL("../../01_線上電子BN/vendor/jszip.min.js", import.meta.url);
let jsZipPromise = null;

const FORMAT_BY_LAYOUT = Object.freeze({
  "google-pmax-1200x1200": "jpg",
  "google-pmax-1200x628": "jpg",
  "google-pmax-960x1200": "jpg",
  "line-oa": "png",
  "line-voom": "jpg",
  "pixnet-side-sticker-side-image": "png",
  "pixnet-side-sticker-banner": "jpg",
  "yahoo-mbbanner": "jpg"
});

function loadJsZip() {
  if (globalThis.JSZip) return Promise.resolve(globalThis.JSZip);
  jsZipPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-om-jszip]");
    const onLoad = () => globalThis.JSZip ? resolve(globalThis.JSZip) : reject(new Error("JSZip 載入失敗。"));
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", () => reject(new Error("JSZip 載入失敗。")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = JSZIP_URL.href;
    script.dataset.omJszip = "true";
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("JSZip 載入失敗。")), { once: true });
    document.head.append(script);
  }).catch((error) => {
    jsZipPromise = null;
    throw error;
  });
  return jsZipPromise;
}

function localDateCode(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== mimeType) {
        reject(new Error("圖片編碼失敗。"));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
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

export async function exportWorkspace({ styleId, activeLayoutId, state, layouts, date = new Date() }) {
  const JSZip = await loadJsZip();
  const snapshot = structuredClone({ styleId, activeLayoutId, state });
  const dateCode = localDateCode(date);
  const styleName = styleId === "smart-locker" ? "智取櫃" : "門市";
  const zipName = `OM_${styleName}_${dateCode}.zip`;
  const jsonName = `OM_${styleName}_${dateCode}.json`;
  const zip = new JSZip();

  for (const layout of layouts) {
    const format = FORMAT_BY_LAYOUT[layout.id];
    if (!format) throw new Error(`未定義 ${layout.name} 輸出格式。`);
    const canvas = await renderLayoutToCanvas({ layout, styleId, state: snapshot.state });
    if (canvas.width !== layout.canvas.width || canvas.height !== layout.canvas.height) {
      throw new Error(`${layout.name} Canvas 尺寸不符。`);
    }
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, mimeType, format === "jpg" ? 1.0 : undefined);
    zip.file(`${layout.name}.${format}`, blob);
  }

  zip.file(jsonName, serializeWorkspace(snapshot));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  triggerDownload(blob, zipName);
  return { zipName, jsonName, dateCode };
}
