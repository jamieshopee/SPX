// SPX 開獎秀 — 線上／電子BN：中欄 Preview controller
// ---------------------------------------------------------------------------
// 只負責「呼叫正式 renderer → 掛上 canvas → 依 viewport 等比 fit」。
//
// 嚴格邊界：
//   - 不建立 Preview-only renderer，唯一畫面來源是
//     layout-engine.js 的 renderLayoutToCanvas()。
//   - 不自行繪製背景、底圖、Logo 或任何文字。
//   - 不綁定任何單一版位：canvas 尺寸與名稱一律取自傳入的 layout descriptor。
//   - fit 只改 CSS display size（style.width／style.height），
//     永不改 canvas.width／canvas.height。
//   - 快速連續輸入以 render token 丟棄過期結果，避免 stale render 覆蓋最新 state。
//     這是最小 sequence guard，不是 state framework。
// ---------------------------------------------------------------------------

import { renderLayoutToCanvas } from "./layout-engine.js";

function availableSize(viewport) {
  const computed = getComputedStyle(viewport);
  const width = viewport.clientWidth -
    Number.parseFloat(computed.paddingLeft || "0") -
    Number.parseFloat(computed.paddingRight || "0");
  const height = viewport.clientHeight -
    Number.parseFloat(computed.paddingTop || "0") -
    Number.parseFloat(computed.paddingBottom || "0");
  return { width: Math.max(0, width), height: Math.max(0, height) };
}

function createErrorCard(layoutName, message) {
  const card = document.createElement("div");
  card.className = "obn-preview-error";
  card.setAttribute("role", "alert");

  const title = document.createElement("p");
  title.className = "obn-preview-error-title";
  title.textContent = `無法產生 ${layoutName} 預覽`;

  const detail = document.createElement("p");
  detail.className = "obn-preview-error-detail";
  detail.textContent = message;

  card.append(title, detail);
  return card;
}

export function createPreviewController(viewport, { onRendered } = {}) {
  let token = 0;
  let canvasElement = null;
  let currentCanvasSize = null;

  function refit() {
    if (!canvasElement || !currentCanvasSize) return;
    const available = availableSize(viewport);
    // 只縮不放：避免把正式 canvas 放大造成模糊。
    const scale = Math.min(
      available.width / currentCanvasSize.width,
      available.height / currentCanvasSize.height,
      1
    );
    canvasElement.style.width = `${Math.max(1, currentCanvasSize.width * scale)}px`;
    canvasElement.style.height = `${Math.max(1, currentCanvasSize.height * scale)}px`;
  }

  const observer = new ResizeObserver(refit);
  observer.observe(viewport);

  async function render({ layout, styleId, state }) {
    const requestToken = ++token;
    try {
      const canvas = await renderLayoutToCanvas({ layout, styleId, state });
      // 過期結果直接丟棄，不覆蓋較新的 render。
      if (requestToken !== token) return;
      canvas.className = "obn-preview-canvas";
      canvasElement = canvas;
      currentCanvasSize = layout.canvas;
      viewport.replaceChildren(canvas);
      refit();
      if (typeof onRendered === "function") onRendered(canvas);
    } catch (error) {
      if (requestToken !== token) return;
      console.error(`${layout.name} render 失敗。`, error);
      canvasElement = null;
      currentCanvasSize = null;
      viewport.replaceChildren(createErrorCard(layout.name, error.message));
    }
  }

  function dispose() {
    observer.disconnect();
    canvasElement = null;
    currentCanvasSize = null;
  }

  return { render, refit, dispose };
}
