// SPX 開獎秀 — 線上／電子BN 共用控制台（雛形）
// ---------------------------------------------------------------------------
// 職責僅限：validate registry → 解析 ?item 與 ?style → 驗證 context →
//   寫入 item.name／style.name 與返回 href → 顯示三欄 shell 或 fail-closed。
//
// context state 只來自 URL query param；不使用 localStorage、sessionStorage
// 或 history.state。缺參數／非法／不相容一律 fail-closed，不猜測、不 fallback、
// 不 redirect、不改 URL。
//
// 範圍限制（Jamie 裁決）：
//   本檔不含 workspace、state manager、reducer、dispatch、event bus、
//   renderer、renderer registry、canvas、ResizeObserver、preview scale、
//   import、export、Excel、JSON、banwords、encoder、asset／底圖 mapping、
//   版位 schema 或版位陣列。目前沒有正式版位，三欄一律維持真正 empty state。
// ---------------------------------------------------------------------------

import { getItem, getStyle, validateRegistry } from "./registry.js";

const REGISTRY_ERROR_MESSAGE = "項目清單資料異常，無法載入。";
const MISSING_ITEM_MESSAGE = "缺少項目參數。";
const UNKNOWN_ITEM_MESSAGE = "找不到指定的項目。";
const NO_CONSOLE_MESSAGE = "此項目的控制台尚未開放。";
const MISSING_STYLE_MESSAGE = "缺少樣式參數。";
const UNKNOWN_STYLE_MESSAGE = "找不到指定的樣式。";
const UNSUPPORTED_STYLE_MESSAGE = "此項目不支援指定的樣式。";

const consoleShell = document.querySelector("#console-shell");
const errorView = document.querySelector("#console-error-view");
const pageError = document.querySelector("#page-error");
const backLink = document.querySelector("#back-link");
const errorBackLink = document.querySelector("#error-back-link");
const itemColumnTitle = document.querySelector("#item-column-title");
const currentStyle = document.querySelector("#current-style");

function styleSelectionHref(item) {
  return `./style.html?item=${encodeURIComponent(item.id)}`;
}

// fail-closed：不渲染三欄工作區，只顯示錯誤並保留返回出口。
// item context 已確認為合法控制台項目時回上一層「選擇樣式」；
// 否則維持 HTML 預設的 "./"（回開獎秀 Interface 1）。
function failClosed(message, item) {
  if (item !== null) {
    errorBackLink.href = styleSelectionHref(item);
  }
  consoleShell.hidden = true;
  pageError.textContent = message;
  errorView.hidden = false;
}

function render() {
  try {
    validateRegistry();
  } catch (error) {
    console.error("開獎秀 item registry 驗證失敗。", error);
    failClosed(REGISTRY_ERROR_MESSAGE, null);
    return;
  }

  const params = new URLSearchParams(location.search);
  const itemId = params.get("item");
  const styleId = params.get("style");

  if (itemId === null || itemId.trim() === "") {
    failClosed(MISSING_ITEM_MESSAGE, null);
    return;
  }

  const item = getItem(itemId);

  if (item === null) {
    failClosed(UNKNOWN_ITEM_MESSAGE, null);
    return;
  }

  // consoleHref 是此 item 完成樣式選擇後的合法 destination。
  // 沒有這個欄位的 item 尚未開放控制台，一律 fail-closed。
  if (typeof item.consoleHref !== "string" || item.consoleHref.trim() === "") {
    failClosed(NO_CONSOLE_MESSAGE, null);
    return;
  }

  if (styleId === null || styleId.trim() === "") {
    failClosed(MISSING_STYLE_MESSAGE, item);
    return;
  }

  const style = getStyle(styleId);

  if (style === null) {
    failClosed(UNKNOWN_STYLE_MESSAGE, item);
    return;
  }

  // style 必須同時存在於 STYLES，且屬於這個 item 的 styles。
  if (!item.styles.includes(style.id)) {
    failClosed(UNSUPPORTED_STYLE_MESSAGE, item);
    return;
  }

  itemColumnTitle.textContent = item.name;
  currentStyle.textContent = style.name;
  backLink.href = styleSelectionHref(item);

  errorView.hidden = true;
  consoleShell.hidden = false;
}

render();
