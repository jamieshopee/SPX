// SPX 開獎秀 — Interface 1（選擇項目）
// ---------------------------------------------------------------------------
// 職責僅限：validate registry → render item cards → fail-closed status / error。
// 不含 router、storage、workspace、Excel、renderer、export、控制台 state。
// ---------------------------------------------------------------------------

import { ITEMS, validateRegistry } from "./registry.js";

const REGISTRY_ERROR_MESSAGE = "項目清單資料異常，無法載入。";
const UNAVAILABLE_MESSAGE = "此功能尚未開放";

const itemGrid = document.querySelector("#item-grid");
const pageError = document.querySelector("#page-error");
const status = document.querySelector("#status");

function showStatus(message) {
  status.textContent = message;
  status.hidden = false;
}

function showError(message) {
  itemGrid.replaceChildren();
  itemGrid.hidden = true;
  status.hidden = true;
  pageError.textContent = message;
  pageError.hidden = false;
}

// 可前往者渲染成真正的 <a>；控制台尚不存在者渲染成 <button>，
// 點擊只顯示 status，不 navigation、不改 URL、不導向不存在的頁面。
function createItemCard(item) {
  if (item.styles.length > 0) {
    const link = document.createElement("a");
    link.className = "item-card";
    link.href = `style.html?item=${encodeURIComponent(item.id)}`;
    link.textContent = item.name;
    return link;
  }

  if (item.directHref) {
    const link = document.createElement("a");
    link.className = "item-card";
    link.href = item.directHref;
    link.textContent = item.name;
    return link;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "item-card";
  button.textContent = item.name;
  button.addEventListener("click", () => showStatus(UNAVAILABLE_MESSAGE));
  return button;
}

function render() {
  try {
    validateRegistry();
  } catch (error) {
    console.error("開獎秀 item registry 驗證失敗。", error);
    showError(REGISTRY_ERROR_MESSAGE);
    return;
  }

  const cards = document.createDocumentFragment();

  for (const item of ITEMS) {
    cards.append(createItemCard(item));
  }

  itemGrid.replaceChildren(cards);
}

render();
