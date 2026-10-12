// SPX 開獎秀 — export the current live style as 14 images plus one workspace JSON.

import { canvasToJpegBlob, canvasToPngBlob, renderLiveToCanvas } from "./renderer-01.js";
import { serializeLiveWorkspace } from "./workspace-live.js";

const JSZIP_URL = new URL("../../01_線上電子BN/vendor/jszip.min.js", import.meta.url);
let jsZipPromise = null;

function loadJsZip() {
  if (globalThis.JSZip) return Promise.resolve(globalThis.JSZip);
  jsZipPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-live-jszip]");
    const onLoad = () => globalThis.JSZip ? resolve(globalThis.JSZip) : reject(new Error("JSZip 載入失敗。"));
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", () => reject(new Error("JSZip 載入失敗。")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = JSZIP_URL.href;
    script.dataset.liveJszip = "true";
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("JSZip 載入失敗。")), { once: true });
    document.head.append(script);
  }).catch((error) => {
    jsZipPromise = null;
    throw error;
  });
  return jsZipPromise;
}

function localDateCode(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
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

export function getLiveWorkspaceNames(styleId, date = new Date()) {
  const styleName = styleId === "smart-locker" ? "智取櫃" : styleId === "store" ? "門市" : null;
  if (!styleName) throw new Error(`直播不支援的 style：${styleId}。`);
  const dateCode = localDateCode(date);
  const baseName = `直播_${styleName}_${dateCode}`;
  return { zipName: `${baseName}.zip`, jsonName: `${baseName}.json` };
}

export function getLiveOutputName(layout) {
  return layout.outputName ?? (layout.id === "02"
    ? "直播大廳LPBN_系統CTA.jpg"
    : "直播大廳LPBN_立即看.jpg");
}

export function downloadLiveWorkspaceJson({ styleId, activeLayoutId, layouts, states, date = new Date() }) {
  const { jsonName } = getLiveWorkspaceNames(styleId, date);
  const json = serializeLiveWorkspace({ styleId, activeLayoutId, layouts, states });
  triggerDownload(new Blob([json], { type: "application/json;charset=utf-8" }), jsonName);
  return jsonName;
}

export async function exportLiveProject({ styleId, activeLayoutId, layouts, states, date = new Date() }) {
  const snapshot = new Map(layouts.map((layout) => [layout.id, structuredClone(states.get(layout.id))]));
  const json = serializeLiveWorkspace({ styleId, activeLayoutId, layouts, states: snapshot });
  const { zipName, jsonName } = getLiveWorkspaceNames(styleId, date);
  const JSZip = await loadJsZip();
  const zip = new JSZip();

  for (const layout of layouts) {
    const format = layout.outputFormat ?? "jpg";
    if (format !== "jpg" && format !== "png") throw new Error(`${layout.name} 輸出格式未設定。`);
    const rendered = await renderLiveToCanvas({ styleId, state: snapshot.get(layout.id), layout });
    if (rendered.width !== layout.canvas.width || rendered.height !== layout.canvas.height) {
      throw new Error(`${layout.name} Canvas 尺寸不符。`);
    }
    const blob = format === "png" ? await canvasToPngBlob(rendered) : await canvasToJpegBlob(rendered);
    zip.file(getLiveOutputName(layout), blob);
  }

  zip.file(jsonName, json);
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  triggerDownload(blob, zipName);
  return { zipName, jsonName, entryCount: layouts.length + 1 };
}
