// SPX 開獎秀 — 線上／電子BN：中欄 Preview controller
// ---------------------------------------------------------------------------
// 只負責「呼叫正式 renderer → 掛上 canvas → 依 viewport 等比 fit」。
//
// 嚴格邊界：
//   - 不建立 Preview-only renderer，唯一畫面來源是
//     layout-01-ddcard-bn.js 的 renderDdcardBn01ToCanvas()。
//   - 不自行繪製背景、底圖、Logo 或任何文字。
//   - fit 只改 CSS display size（style.width／style.height），
//     永不改 canvas.width／canvas.height。
//   - 快速連續輸入以 render token 丟棄過期結果，避免 stale render 覆蓋最新 state。
//     這是最小 sequence guard，不是 state framework。
// ---------------------------------------------------------------------------

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  renderDdcardBn01ToCanvas
} from "./layout-01-ddcard-bn.js";

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

function createErrorCard(message) {
  const card = document.createElement("div");
  card.className = "obn-preview-error";
  card.setAttribute("role", "alert");

  const title = document.createElement("p");
  title.className = "obn-preview-error-title";
  title.textContent = "無法產生 01_DDcard BN 預覽";

  const detail = document.createElement("p");
  detail.className = "obn-preview-error-detail";
  detail.textContent = message;

  card.append(title, detail);
  return card;
}

export function createPreviewController(viewport, { onRendered } = {}) {
  let token = 0;
  let canvasElement = null;

  function refit() {
    if (!canvasElement) return;
    const available = availableSize(viewport);
    // 只縮不放：避免把 531×792 放大造成模糊。
    const scale = Math.min(
      available.width / CANVAS_WIDTH,
      available.height / CANVAS_HEIGHT,
      1
    );
    const width = Math.max(1, CANVAS_WIDTH * scale);
    const height = Math.max(1, CANVAS_HEIGHT * scale);
    canvasElement.style.width = `${width}px`;
    canvasElement.style.height = `${height}px`;
  }

  const observer = new ResizeObserver(refit);
  observer.observe(viewport);

  async function render({ styleId, state }) {
    const requestToken = ++token;
    try {
      const canvas = await renderDdcardBn01ToCanvas({ styleId, state });
      // 過期結果直接丟棄，不覆蓋較新的 render。
      if (requestToken !== token) return;
      canvas.className = "obn-preview-canvas";
      canvasElement = canvas;
      viewport.replaceChildren(canvas);
      refit();
      if (typeof onRendered === "function") onRendered(canvas);
    } catch (error) {
      if (requestToken !== token) return;
      console.error("01_DDcard BN render 失敗。", error);
      canvasElement = null;
      viewport.replaceChildren(createErrorCard(error.message));
    }
  }

  function dispose() {
    observer.disconnect();
    canvasElement = null;
  }

  return { render, refit, dispose };
}
