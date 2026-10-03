// SPX 開獎秀 — 線上／電子BN：版位模組掛載入口
// ---------------------------------------------------------------------------
// 由 開獎秀/js/console.js 在 item.id === "online-bn" 時動態 import；
// 也由 Manual Verification Viewer（launch/viewer.html）直接 import。
// om／live 走不到這個 import，因此不載入 online-bn 的 JS，也不載入它的 CSS。
//
// 職責：
//   1. 動態載入 online-bn 專屬 stylesheet（context-isolated，載入失敗 fail-closed）
//   2. 左欄渲染正式版位清單並支援切換（目前 01、02、03、04 四個）
//   3. 中欄掛上 Preview controller（使用共用 layout engine）
//   4. 右欄掛上正式 controls（欄位由該 layout descriptor 提供）
//   5. 持有使用者可變 state（page memory；不使用 localStorage／sessionStorage／
//      history.state），任一控制變更即以同一 renderer 重繪
//
// 嚴格邊界：
//   - 版位清單是單純的陣列，不是 registry／plugin system，
//     也不為 05～17 預先抽象。
//   - 切換版位＝以該 layout 的 defaults 重新初始化 state（Jamie 核准行為），
//     不建立 state cache、不使用任何持久化機制。
//   - 正式 Console 的 URL context 仍只有 item／style；切換版位不改 URL。
//   - 不修改 registry.js、不修改 console.css、不改動三欄 shell geometry。
// ---------------------------------------------------------------------------

import { LAYOUT_01_DDCARD_BN } from "./layout-01-ddcard-bn.js";
import { LAYOUT_02_MALL_HBN } from "./layout-02-mall-hbn.js";
import { LAYOUT_03_LPBN } from "./layout-03-lpbn.js";
import { LAYOUT_04_POP_UP } from "./layout-04-pop-up.js";
import { createInitialState, getStyleData } from "./layout-engine.js";
import { createPreviewController } from "./preview.js";
import { mountControls } from "./controls.js";

const LAYOUTS = Object.freeze([
  LAYOUT_01_DDCARD_BN,
  LAYOUT_02_MALL_HBN,
  LAYOUT_03_LPBN,
  LAYOUT_04_POP_UP
]);

export const DEFAULT_LAYOUT_ID = LAYOUT_01_DDCARD_BN.id;

export function getLayout(layoutId) {
  return LAYOUTS.find((layout) => layout.id === layoutId) ?? null;
}

export function listLayouts() {
  return LAYOUTS;
}

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

export async function mountOnlineBn({
  styleId,
  mounts,
  onRendered,
  onActivated,
  layoutId = DEFAULT_LAYOUT_ID
}) {
  const initialLayout = getLayout(layoutId);
  if (initialLayout === null) {
    throw new Error(`線上／電子BN 不支援的版位：${layoutId}。`);
  }
  if (getStyleData(initialLayout, styleId) === null) {
    throw new Error(`線上／電子BN 不支援的樣式：${styleId}。`);
  }

  const { layoutList, layoutListEmpty, previewBody, controlBody } = mounts;
  if (!layoutList || !previewBody || !controlBody) {
    throw new Error("線上／電子BN 缺少必要的掛載點。");
  }

  await ensureStylesheet();

  let activeLayout = null;
  let state = null;
  let preview = null;
  let pending = Promise.resolve();
  const buttons = new Map();

  function requestRender() {
    pending = pending.then(() => preview.render({ layout: activeLayout, styleId, state }));
    return pending;
  }

  function paintLayoutList() {
    buttons.forEach((button, id) => {
      const isActive = id === activeLayout.id;
      if (isActive) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  async function activate(layout) {
    if (preview) preview.dispose();
    activeLayout = layout;
    // 切換版位＝以該 layout 的 defaults 重新初始化：文字回空白、顏色回該 style 預設。
    state = createInitialState(layout, styleId);
    previewBody.replaceChildren();
    preview = createPreviewController(previewBody, { onRendered });
    mountControls(controlBody, { layout, state, onChange: requestRender });
    paintLayoutList();
    pending = Promise.resolve();
    await requestRender();
    if (typeof onActivated === "function") await onActivated(layout);
  }

  // 左欄：目前兩個正式版位，點擊非目前版位即切換。
  LAYOUTS.forEach((layout) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "obn-layout-button";
    button.dataset.layoutId = layout.id;
    button.textContent = layout.name;
    button.addEventListener("click", () => {
      if (activeLayout && layout.id === activeLayout.id) return;
      activate(layout).catch((error) => {
        console.error("線上／電子BN 版位切換失敗。", error);
      });
    });
    buttons.set(layout.id, button);
  });

  layoutList.replaceChildren(...buttons.values());
  if (layoutListEmpty) layoutListEmpty.hidden = true;

  await activate(initialLayout);

  return {
    getActiveLayout: () => activeLayout,
    getState: () => state,
    requestRender,
    dispose() {
      if (preview) preview.dispose();
      previewBody.replaceChildren();
      controlBody.replaceChildren();
      layoutList.replaceChildren();
      buttons.clear();
      if (layoutListEmpty) layoutListEmpty.hidden = false;
    }
  };
}
