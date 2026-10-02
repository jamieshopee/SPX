// SPX 開獎秀 — 線上／電子BN：版位模組掛載入口
// ---------------------------------------------------------------------------
// 由 開獎秀/js/console.js 在 item.id === "online-bn" 時動態 import；
// 也由 Manual Verification Viewer（launch/viewer.html）直接 import。
// om／live 走不到這個 import，因此不載入 online-bn 的 JS，也不載入它的 CSS。
//
// 職責：
//   1. 動態載入 online-bn 專屬 stylesheet（context-isolated，載入失敗 fail-closed）
//   2. 左欄渲染唯一正式版位 01_DDcard BN 並標示為 selected
//   3. 中欄掛上 Preview controller（使用正式 renderer）
//   4. 右欄掛上正式 controls
//   5. 持有使用者可變 state（page memory；不使用 localStorage／sessionStorage／
//      history.state），任一控制變更即以同一 renderer 重繪
//
// 嚴格邊界：
//   - 目前只有 01 一個版位。不建立版位陣列迴圈、不建立多版位 state manager、
//     不因 assets 已有 17 組而產生 02～17。
//   - 不修改 registry.js、不修改 console.css、不改動三欄 shell geometry。
// ---------------------------------------------------------------------------

import { createInitialState, getStyleData } from "./layout-01-ddcard-bn.js";
import { createPreviewController } from "./preview.js";
import { mountControls } from "./controls.js";

// 目前唯一的正式版位。不是版位 registry，也不是 02～17 的預留結構。
const LAYOUT_ID = "01-ddcard-bn";
const LAYOUT_NAME = "01_DDcard BN";

const STYLESHEET_URL = new URL("../css/online-bn.css", import.meta.url);
const STYLESHEET_MARK = "onlineBnStylesheet";

let stylesheetPromise = null;

// online-bn CSS isolation：只在 online-bn mount 時載入一次。
// 重複 mount 不重複插入；載入失敗 fail-closed（不視為 mount 成功）。
function ensureStylesheet() {
  stylesheetPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("link[data-online-bn-stylesheet]");
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLESHEET_URL.href;
    link.dataset[STYLESHEET_MARK] = "true";
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener(
      "error",
      () => reject(new Error("線上／電子BN 樣式表載入失敗。")),
      { once: true }
    );
    document.head.append(link);
  }).catch((error) => {
    stylesheetPromise = null;
    throw error;
  });
  return stylesheetPromise;
}

// 左欄：目前只有一個正式版位，直接 selected。
// 不建立切換邏輯、不建立 selected state manager。
function renderLayoutList(listElement, emptyElement) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "obn-layout-button";
  button.dataset.layoutId = LAYOUT_ID;
  button.textContent = LAYOUT_NAME;
  button.setAttribute("aria-current", "true");

  listElement.replaceChildren(button);
  if (emptyElement) emptyElement.hidden = true;
  return button;
}

export async function mountOnlineBn({ styleId, mounts, onRendered }) {
  if (getStyleData(styleId) === null) {
    throw new Error(`線上／電子BN 不支援的樣式：${styleId}。`);
  }

  const { layoutList, layoutListEmpty, previewBody, controlBody } = mounts;
  if (!layoutList || !previewBody || !controlBody) {
    throw new Error("線上／電子BN 缺少必要的掛載點。");
  }

  await ensureStylesheet();

  const state = createInitialState(styleId);

  renderLayoutList(layoutList, layoutListEmpty);

  previewBody.replaceChildren();
  const preview = createPreviewController(previewBody, { onRendered });

  let pending = Promise.resolve();
  function requestRender() {
    pending = pending.then(() => preview.render({ styleId, state }));
    return pending;
  }

  mountControls(controlBody, { state, onChange: requestRender });

  await requestRender();

  return {
    state,
    requestRender,
    dispose() {
      preview.dispose();
      previewBody.replaceChildren();
      controlBody.replaceChildren();
      layoutList.replaceChildren();
      if (layoutListEmpty) layoutListEmpty.hidden = false;
    }
  };
}
