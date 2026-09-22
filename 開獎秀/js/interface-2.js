// SPX 開獎秀 — Interface 2（選擇樣式）
// ---------------------------------------------------------------------------
// 職責僅限：validate registry → 解析 ?item → render style cards（含 preview
// placeholder 分支）→ fail-closed status / error。
// item state 只來自 URL query param；不使用 localStorage、sessionStorage 或
// 任何 workspace。缺參數／非法／無樣式一律 fail-closed，不猜測、不 fallback。
// ---------------------------------------------------------------------------

import { getItem, getItemStyles, validateRegistry } from "./registry.js";

const REGISTRY_ERROR_MESSAGE = "項目清單資料異常，無法載入。";
const MISSING_ITEM_MESSAGE = "缺少項目參數。";
const UNKNOWN_ITEM_MESSAGE = "找不到指定的項目。";
const NO_STYLE_MESSAGE = "此項目不需選擇樣式。";
const UNAVAILABLE_MESSAGE = "此功能尚未開放";

const styleGrid = document.querySelector("#style-grid");
const pageError = document.querySelector("#page-error");
const status = document.querySelector("#status");
const currentItemLine = document.querySelector("#current-item-line");
const currentItemName = document.querySelector("#current-item");

function showStatus(message) {
  status.textContent = message;
  status.hidden = false;
}

function showError(message) {
  styleGrid.replaceChildren();
  styleGrid.hidden = true;
  status.hidden = true;
  pageError.textContent = message;
  pageError.hidden = false;
}

function showCurrentItem(item) {
  currentItemName.textContent = item.name;
  currentItemLine.hidden = false;
}

// previewSrc 有值時渲染 <img>，否則渲染占位表面。
// 兩者共用 .style-preview 這一組 geometry，未來加入正式 asset 不需改 geometry。
function createPreview(style) {
  if (typeof style.previewSrc === "string" && style.previewSrc.trim() !== "") {
    const image = document.createElement("img");
    image.className = "style-preview";
    image.src = style.previewSrc;
    image.alt = "";
    return image;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "style-preview style-preview--empty";
  placeholder.setAttribute("aria-hidden", "true");
  return placeholder;
}

// 控制台尚不存在，兩個樣式目前都渲染成 <button>：
// 點擊只顯示 status，不 navigation、不改 URL、不建立假控制台。
function createStyleCard(style) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "style-card";

  const label = document.createElement("span");
  label.className = "style-card__label";
  label.textContent = style.name;

  button.append(createPreview(style), label);
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

  const itemId = new URLSearchParams(location.search).get("item");

  if (itemId === null || itemId.trim() === "") {
    showError(MISSING_ITEM_MESSAGE);
    return;
  }

  const item = getItem(itemId);

  if (item === null) {
    showError(UNKNOWN_ITEM_MESSAGE);
    return;
  }

  showCurrentItem(item);

  if (item.styles.length === 0) {
    showError(NO_STYLE_MESSAGE);
    return;
  }

  const cards = document.createDocumentFragment();

  for (const style of getItemStyles(item)) {
    cards.append(createStyleCard(style));
  }

  styleGrid.replaceChildren(cards);
}

render();
