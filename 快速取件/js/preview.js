import { formatItemDisplayName, getItem } from "./registry.js";
import { renderItemToCanvas, UnsupportedRendererError } from "./renderer.js";

function fitElement(viewport, element, item) {
  const availableWidth = Math.max(0, viewport.clientWidth - 48);
  const availableHeight = Math.max(0, viewport.clientHeight - 48);
  const scale = Math.min(
    availableWidth / item.width,
    availableHeight / item.height,
    1
  );
  element.style.width = `${Math.max(1, Math.round(item.width * scale))}px`;
  element.style.height = `${Math.max(1, Math.round(item.height * scale))}px`;
}

function createUnsupportedCard(item) {
  const card = document.createElement("div");
  card.className = "preview-status-card";
  card.dataset.previewItem = item.id;
  const eyebrow = document.createElement("p");
  eyebrow.className = "preview-status-code";
  eyebrow.textContent = `${formatItemDisplayName(item.name)} · ${item.width}×${item.height} · ${item.format.toUpperCase()}`;
  const title = document.createElement("h3");
  title.textContent = "尚未完成逐項視覺設定";
  const copy = document.createElement("p");
  copy.textContent = "共通平台已保留 renderer 接口；目前不產生假成品或推測版位。";
  card.append(eyebrow, title, copy);
  return card;
}

export function createPreviewController(viewport) {
  let token = 0;
  let currentItem = null;
  let currentElement = null;

  function refit() {
    if (currentItem && currentElement) fitElement(viewport, currentElement, currentItem);
  }

  const observer = new ResizeObserver(refit);
  observer.observe(viewport);

  async function render(state) {
    const item = getItem(state.selectedItemId);
    if (!item) return;
    const requestToken = ++token;
    try {
      const canvas = await renderItemToCanvas({ itemId: item.id, stateSnapshot: state });
      if (requestToken !== token) return;
      canvas.className = "preview-canvas";
      currentItem = item;
      currentElement = canvas;
      viewport.replaceChildren(canvas);
      refit();
    } catch (error) {
      if (requestToken !== token) return;
      if (!(error instanceof UnsupportedRendererError)) {
        console.error(error);
      }
      const card = createUnsupportedCard(item);
      currentItem = item;
      currentElement = card;
      viewport.replaceChildren(card);
      refit();
    }
  }

  return { render, refit, disconnect: () => observer.disconnect() };
}
