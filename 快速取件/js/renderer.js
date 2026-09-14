import { getItem } from "./registry.js";

const renderers = new Map();

export class UnsupportedRendererError extends Error {
  constructor(itemId) {
    super(`${itemId} 尚未完成逐項視覺設定。`);
    this.name = "UnsupportedRendererError";
    this.itemId = itemId;
  }
}

export function registerRenderer(rendererKey, renderFunction) {
  if (!rendererKey || typeof renderFunction !== "function") {
    throw new TypeError("Renderer registration 無效。");
  }
  renderers.set(rendererKey, renderFunction);
}

export function isRendererReady(item) {
  return Boolean(item?.rendererKey && renderers.has(item.rendererKey));
}

export async function renderItemToCanvas({ itemId, stateSnapshot }) {
  const item = getItem(itemId);
  if (!item || !isRendererReady(item)) throw new UnsupportedRendererError(itemId);

  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = item.width;
  canvas.height = item.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法建立 Canvas 2D context。");

  await renderers.get(item.rendererKey)({
    ctx: context,
    item,
    state: stateSnapshot,
    assets: Object.freeze({})
  });

  if (canvas.width !== item.width || canvas.height !== item.height) {
    throw new Error(`${item.name} renderer 不得修改正式 Canvas 尺寸。`);
  }
  return canvas;
}
