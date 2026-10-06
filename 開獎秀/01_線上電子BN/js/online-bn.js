// SPX 開獎秀 — 線上／電子BN：版位模組掛載入口
// ---------------------------------------------------------------------------
// 由 開獎秀/js/console.js 在 item.id === "online-bn" 時動態 import；
// 也由 Manual Verification Viewer（launch/viewer.html）直接 import。
// om／live 走不到這個 import，因此不載入 online-bn 的 JS，也不載入它的 CSS。
//
// 職責：
//   1. 動態載入 online-bn 專屬 stylesheet（context-isolated，載入失敗 fail-closed）
//   2. 左欄渲染正式版位清單並支援切換（目前 01～17 十七個）
//   3. 中欄掛上 Preview controller（使用共用 layout engine）
//   4. 右欄掛上正式 controls（欄位由該 layout descriptor 提供）
//   5. 持有使用者可變 state（page memory；不使用 localStorage／sessionStorage／
//      history.state），任一控制變更即以同一 renderer 重繪
//
// 嚴格邊界：
//   - 版位清單是單純的陣列，不是 registry／plugin system，
//     也不為 16～17 預先抽象。
//   - 切換版位＝以該 layout 的 defaults 重新初始化 state（Jamie 核准行為），
//     不建立 state cache、不使用任何持久化機制。
//   - 正式 Console 的 URL context 仍只有 item／style；切換版位不改 URL。
//   - 不修改 registry.js、不修改 console.css、不改動三欄 shell geometry。
// ---------------------------------------------------------------------------

import { LAYOUT_01_DDCARD_BN } from "./layout-01-ddcard-bn.js";
import { LAYOUT_02_MALL_HBN } from "./layout-02-mall-hbn.js";
import { LAYOUT_03_LPBN } from "./layout-03-lpbn.js";
import { LAYOUT_04_POP_UP } from "./layout-04-pop-up.js";
import { LAYOUT_05_IG } from "./layout-05-ig.js";
import { LAYOUT_06_FB_POST } from "./layout-06-fb-post.js";
import { LAYOUT_07_OM_FEED } from "./layout-07-om-feed.js";
import { LAYOUT_08_SKBN_APP_LR } from "./layout-08-skbn-app-lr.js";
import { LAYOUT_09_SKBN_APP_MID } from "./layout-09-skbn-app-mid.js";
import { LAYOUT_10_SKBN_PC } from "./layout-10-skbn-pc.js";
import { LAYOUT_11_MSBN } from "./layout-11-msbn.js";
import { LAYOUT_12_TVBN_STORE } from "./layout-12-tvbn-store.js";
import { LAYOUT_13_TVBN_SMART_STORE } from "./layout-13-tvbn-smart-store.js";
import { LAYOUT_14_PAYMENT_VERTICAL } from "./layout-14-payment-vertical.js";
import { LAYOUT_15_PAYMENT_VERTICAL_BOCHEN } from "./layout-15-payment-vertical-bochen.js";
import { LAYOUT_16_PAYMENT_BOTTOM } from "./layout-16-payment-bottom.js";
import { LAYOUT_17_PAYMENT_BOTTOM_BOCHEN } from "./layout-17-payment-bottom-bochen.js";
import { createInitialState, getStyleData } from "./layout-engine.js";
import { createPreviewController } from "./preview.js";
import { mountControls } from "./controls.js";
import { parseWorkOrderCandidate } from "./work-order-import.js";
import { parseWorkspaceJson, serializeWorkspace } from "./workspace-json.js";
import { exportWorkspace } from "./export.js";

const LAYOUTS = Object.freeze([
  LAYOUT_01_DDCARD_BN,
  LAYOUT_02_MALL_HBN,
  LAYOUT_03_LPBN,
  LAYOUT_04_POP_UP,
  LAYOUT_05_IG,
  LAYOUT_06_FB_POST,
  LAYOUT_07_OM_FEED,
  LAYOUT_08_SKBN_APP_LR,
  LAYOUT_09_SKBN_APP_MID,
  LAYOUT_10_SKBN_PC,
  LAYOUT_11_MSBN,
  LAYOUT_12_TVBN_STORE,
  LAYOUT_13_TVBN_SMART_STORE,
  LAYOUT_14_PAYMENT_VERTICAL,
  LAYOUT_15_PAYMENT_VERTICAL_BOCHEN,
  LAYOUT_16_PAYMENT_BOTTOM,
  LAYOUT_17_PAYMENT_BOTTOM_BOCHEN
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
const SHEETJS_URL = new URL("../vendor/xlsx.full.min.js", import.meta.url);
const SHEETJS_MARK = "onlineBnSheetJs";
const DEFAULT_QR_URL = "https://shopee.tw/m/spxlottery";

let stylesheetPromise = null;
let sheetJsPromise = null;

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

function ensureSheetJs() {
  if (globalThis.XLSX?.version === "0.20.3") return Promise.resolve(globalThis.XLSX);
  sheetJsPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-online-bn-sheet-js]");
    if (existing) {
      existing.addEventListener("load", () => resolve(globalThis.XLSX), { once: true });
      existing.addEventListener("error", () => reject(new Error("Excel 解析器載入失敗。")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SHEETJS_URL.href;
    script.dataset[SHEETJS_MARK] = "true";
    script.addEventListener("load", () => {
      if (globalThis.XLSX?.version !== "0.20.3") {
        reject(new Error("Excel 解析器版本不符合正式需求。"));
        return;
      }
      resolve(globalThis.XLSX);
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Excel 解析器載入失敗。")), { once: true });
    document.head.append(script);
  }).catch((error) => {
    sheetJsPromise = null;
    throw error;
  });
  return sheetJsPromise;
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
  let controls = null;
  let importedWorkOrder = null;
  let workspace = null;
  let importSourceName = null;
  let importStatus = "尚未匯入檔案";
  let exportStatus = "";
  let exportBusy = false;
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

  function createState(layout) {
    const nextState = createInitialState(layout, styleId);
    if (workspace === null) {
      workspace = {
        text: { ...nextState.text },
        colors: { ...nextState.colors },
        logoMode: nextState.logoMode,
        qrUrl: DEFAULT_QR_URL
      };
    }
    nextState.text = Object.fromEntries(
      layout.textOrder.map((fieldId) => [fieldId, workspace.text[fieldId] ?? ""])
    );
    nextState.colors = { ...workspace.colors };
    nextState.logoMode = workspace.logoMode;
    nextState.qrUrl = workspace.qrUrl;
    return nextState;
  }

  function setImportStatus(value) {
    importStatus = value;
    controls?.setImportStatus(value);
  }

  async function importWorkOrder(file) {
    setImportStatus(`正在匯入：${file.name}`);
    try {
      const XLSX = await ensureSheetJs();
      const candidate = await parseWorkOrderCandidate(file, XLSX);
      const nextState = createState(activeLayout);
      workspace.text = {
        title: candidate.title,
        subtitle: candidate.subtitle,
        small1: candidate.small1,
        small2: candidate.small2
      };
      workspace.qrUrl = candidate.qrUrl;
      importedWorkOrder = candidate;
      importSourceName = file.name;
      nextState.text = Object.fromEntries(
        activeLayout.textOrder.map((fieldId) => [fieldId, workspace.text[fieldId] ?? ""])
      );
      state = nextState;
      mountCurrentControls();
      await requestRender();
      setImportStatus(`已匯入：${file.name}`);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Excel 工單匯入失敗。");
    }
  }

  async function importWorkspace(file) {
    setImportStatus(`正在匯入：${file.name}`);
    try {
      const candidate = parseWorkspaceJson(await file.text(), {
        currentStyleId: styleId,
        getLayout
      });
      // JSON 已完整驗證；以下才一次提交，任何驗證失敗都不碰目前 workspace。
      workspace = structuredClone(candidate.workspace);
      importSourceName = candidate.sourceName;
      importedWorkOrder = null;
      if (candidate.activeLayoutId !== activeLayout.id) {
        await activate(getLayout(candidate.activeLayoutId));
      } else {
        state = createState(activeLayout);
        mountCurrentControls();
        await requestRender();
      }
      setImportStatus(`已匯入：${file.name}`);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "JSON 暫存檔匯入失敗。");
    }
  }

  async function runExport() {
    if (exportBusy) return;
    exportBusy = true;
    controls?.setExportBusy(true);
    controls?.setExportStatus("正在建立完整專案…");
    try {
      const result = await exportWorkspace({
        styleId,
        layouts: LAYOUTS,
        workspace: structuredClone(workspace),
        activeLayoutId: activeLayout.id,
        sourceName: importSourceName,
        serialize: serializeWorkspace
      });
      exportStatus = `已下載：線上電子BN_${result.dateCode}.zip`;
      controls?.setExportStatus(exportStatus);
    } catch (error) {
      exportStatus = error instanceof Error ? `下載失敗：${error.message}` : "下載完整專案失敗。";
      controls?.setExportStatus(exportStatus);
    } finally {
      exportBusy = false;
      controls?.setExportBusy(false);
    }
  }

  async function resetWorkspace() {
    if (!window.confirm("確定要重設工作區域嗎？已匯入的工單、文字與顏色設定將回到初始狀態。此操作無法復原。")) return;
    importedWorkOrder = null;
    workspace = null;
    importSourceName = null;
    state = createState(activeLayout);
    setImportStatus("尚未匯入檔案");
    exportStatus = "";
    mountCurrentControls();
    await requestRender();
  }

  function mountCurrentControls() {
    controls = mountControls(controlBody, {
      layout: activeLayout,
      state,
      onChange: requestRender,
      onTextChange: (fieldId, value) => {
        workspace.text[fieldId] = value;
      },
      onColorChange: (fieldId, value) => {
        workspace.colors[fieldId] = value;
      },
      onLogoModeChange: (mode) => {
        workspace.logoMode = mode;
      },
      onQrChange: (value) => {
        workspace.qrUrl = value;
      },
      onImportFile: importWorkOrder,
      onImportJson: importWorkspace,
      importStatus,
      onReset: resetWorkspace,
      onExport: runExport,
      exportStatus
    });
  }

  async function activate(layout) {
    if (preview) preview.dispose();
    activeLayout = layout;
    // 切換版位＝defaults 加上共用 importedWorkOrder baseline；不建立版位 cache。
    state = createState(layout);
    previewBody.replaceChildren();
    preview = createPreviewController(previewBody, { onRendered });
    mountCurrentControls();
    paintLayoutList();
    pending = Promise.resolve();
    await requestRender();
    if (typeof onActivated === "function") await onActivated(layout);
  }

  // 左欄：目前十六個正式版位，點擊非目前版位即切換。
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

  function handleLayoutKeydown(event) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const target = event.target instanceof Element
      ? event.target.closest(".obn-layout-button")
      : null;
    if (!target) return;
    const currentIndex = LAYOUTS.findIndex((layout) => layout.id === activeLayout.id);
    const offset = event.key === "ArrowUp" ? -1 : 1;
    const nextIndex = Math.max(0, Math.min(LAYOUTS.length - 1, currentIndex + offset));
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    activate(LAYOUTS[nextIndex])
      .then(() => buttons.get(LAYOUTS[nextIndex].id)?.focus())
      .catch((error) => console.error("線上／電子BN 鍵盤版位切換失敗。", error));
  }

  layoutList.addEventListener("keydown", handleLayoutKeydown);

  await activate(initialLayout);

  return {
    getActiveLayout: () => activeLayout,
    getState: () => state,
    getWorkspace: () => structuredClone(workspace),
    requestRender,
    dispose() {
      if (preview) preview.dispose();
      previewBody.replaceChildren();
      controlBody.replaceChildren();
      layoutList.replaceChildren();
      layoutList.removeEventListener("keydown", handleLayoutKeydown);
      buttons.clear();
      if (layoutListEmpty) layoutListEmpty.hidden = false;
    }
  };
}
