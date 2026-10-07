// SPX 開獎秀 — OM：正式控制台版位模組
// ---------------------------------------------------------------------------
// 此模組只負責 OM01～OM08 的 Console orchestration：
// descriptor registry、session state、preview、controls 與 OM-specific CSS。
// renderer 與 descriptors 保持為唯一正式來源，不在此複製 geometry。
// ---------------------------------------------------------------------------

import { createInitialState, renderLayoutToCanvas } from "./renderer.js";
import { countTextUnits, formatUnits } from "./text-validation.js";
import { parseOmWorkOrderCandidate } from "./work-order-import.js";
import { exportWorkspace } from "./export.js";
import { parseWorkspaceJson } from "./workspace.js";
import { LAYOUT_01_GOOGLE_PMAX_1200X1200 } from "./layout-01-google-pmax-1200x1200.js";
import { LAYOUT_02_GOOGLE_PMAX_1200X628 } from "./layout-02-google-pmax-1200x628.js";
import { LAYOUT_03_GOOGLE_PMAX_960X1200 } from "./layout-03-google-pmax-960x1200.js";
import { LAYOUT_04_LINE_OA } from "./layout-04-line-oa.js";
import { LAYOUT_05_LINE_VOOM } from "./layout-05-line-voom.js";
import { LAYOUT_06_PIXNET_SIDE_STICKER_SIDE_IMAGE } from "./layout-06-pixnet-side-sticker-side-image.js";
import { LAYOUT_07_PIXNET_SIDE_STICKER_BANNER } from "./layout-07-pixnet-side-sticker-banner.js";
import { LAYOUT_08_YAHOO_MBBANNER } from "./layout-08-yahoo-mbbanner.js";

const OM_STYLESHEET_URL = new URL("../css/om-console.css", import.meta.url);
const SHEETJS_URL = new URL("../../01_線上電子BN/vendor/xlsx.full.min.js", import.meta.url);
const SHEETJS_MARK = "omSheetJs";
const LOGO_MODES = Object.freeze(["auto", "orange", "white"]);
const LOGO_LABELS = Object.freeze({ auto: "自動", orange: "橘色", white: "白色" });
const LAYOUTS = Object.freeze([
  LAYOUT_01_GOOGLE_PMAX_1200X1200,
  LAYOUT_02_GOOGLE_PMAX_1200X628,
  LAYOUT_03_GOOGLE_PMAX_960X1200,
  LAYOUT_04_LINE_OA,
  LAYOUT_05_LINE_VOOM,
  LAYOUT_06_PIXNET_SIDE_STICKER_SIDE_IMAGE,
  LAYOUT_07_PIXNET_SIDE_STICKER_BANNER,
  LAYOUT_08_YAHOO_MBBANNER
]);

let sheetJsPromise = null;

function loadStylesheet() {
  const existing = document.querySelector(`link[data-om-console-stylesheet="true"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = OM_STYLESHEET_URL.href;
    link.dataset.omConsoleStylesheet = "true";
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", () => reject(new Error("OM Console CSS 載入失敗。")), { once: true });
    document.head.append(link);
  });
}

function loadSheetJs() {
  if (globalThis.XLSX?.version === "0.20.3") return Promise.resolve(globalThis.XLSX);
  sheetJsPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-om-sheet-js]");
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

function createState(layout, styleId) {
  return createInitialState(styleId, layout);
}

function createConsoleState(layout, styleId) {
  const state = createState(layout, styleId);
  state.text = { title: "", subtitle: "", small1: "", small2: "" };
  return state;
}

function createSection(number, title) {
  const section = document.createElement("section");
  section.className = "om-control-card";
  const heading = document.createElement("h3");
  heading.className = "om-control-heading";
  const index = document.createElement("span");
  index.className = "om-control-number";
  index.textContent = number;
  index.setAttribute("aria-hidden", "true");
  heading.append(index, document.createTextNode(title));
  section.append(heading);
  return section;
}

function normalizeHex(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value ?? "").trim());
  return match ? `#${match[1].toLowerCase()}` : null;
}

function createTextRow(field, state, onChange, onTextChange) {
  const row = document.createElement("div");
  row.className = "om-text-row";

  const wrapper = document.createElement("div");
  wrapper.className = "om-field";
  const label = document.createElement("label");
  label.className = "om-field-label";
  label.htmlFor = `om-text-${field.id}`;
  label.textContent = field.label;

  const counter = document.createElement("span");
  counter.className = "om-field-counter";

  const input = document.createElement("input");
  input.className = "om-text-input";
  input.id = `om-text-${field.id}`;
  input.type = "text";
  input.autocomplete = "off";
  input.value = state.text[field.id];

  let lastValid = input.value;
  let composing = false;

  const paintCounter = (value) => {
    counter.textContent = `${formatUnits(countTextUnits(value))} / ${field.limit}`;
  };
  const rollback = () => {
    input.value = lastValid;
    paintCounter(lastValid);
  };
  const commit = (value) => {
    lastValid = value;
    onTextChange(field.id, value);
    paintCounter(value);
    onChange();
  };

  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => {
    composing = false;
    if (countTextUnits(input.value) > field.limit) {
      rollback();
      return;
    }
    commit(input.value);
  });
  input.addEventListener("input", () => {
    const value = input.value;
    if (composing) {
      onTextChange(field.id, value);
      paintCounter(value);
      onChange();
      return;
    }
    if (countTextUnits(value) > field.limit) {
      rollback();
      return;
    }
    commit(value);
  });

  paintCounter(input.value);
  const head = document.createElement("div");
  head.className = "om-field-head";
  head.append(label, counter);
  wrapper.append(head, input);
  row.append(wrapper);
  return row;
}

function createColorInput(field, state, onChange, { compact = false, onColorChange } = {}) {
  const wrapper = document.createElement("label");
  wrapper.className = compact ? "om-color-picker-only" : "om-color-field";
  if (!compact) wrapper.append(document.createTextNode(field.label));

  const input = document.createElement("input");
  input.className = "om-color-input";
  input.type = "color";
  input.value = normalizeHex(state.colors[field.id]) ?? "#000000";
  input.setAttribute("aria-label", `${field.label}選色`);
  input.title = `${field.label}選色`;
  input.addEventListener("input", () => {
    const next = normalizeHex(input.value);
    if (!next) return;
    onColorChange?.(field.id, next);
    onChange();
  });
  wrapper.append(input);
  return { wrapper, input };
}

function createLogoMode(state, onChange, onLogoModeChange) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "om-logo-mode";
  const legend = document.createElement("legend");
  legend.className = "om-field-label";
  legend.textContent = "Logo";
  fieldset.append(legend);

  const group = document.createElement("div");
  group.className = "om-radio-group";
  LOGO_MODES.forEach((mode) => {
    const label = document.createElement("label");
    label.className = "om-radio";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "om-logo-mode";
    radio.value = mode;
    radio.checked = state.logoMode === mode;
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      onLogoModeChange?.(mode);
      onChange();
    });
    label.append(radio, document.createTextNode(LOGO_LABELS[mode]));
    group.append(label);
  });
  fieldset.append(group);
  return fieldset;
}

function mountControls(root, layout, state, {
  onChange,
  onReset,
  onImport,
  onTextChange,
  onColorChange,
  onLogoModeChange,
  onImportJson,
  onExport,
  exportBusy = false,
  exportStatusText = "準備下載",
  importStatusText = "尚未匯入工單"
}) {
  root.replaceChildren();
  root.classList.add("om-controls");

  const importSection = createSection("01", "匯入工單 Excel 或暫存檔");
  const excelButton = document.createElement("button");
  excelButton.type = "button";
  excelButton.className = "om-file-button";
  excelButton.textContent = "選擇 Excel";
  const excelInput = document.createElement("input");
  excelInput.type = "file";
  excelInput.accept = ".xlsx,.xls";
  excelInput.hidden = true;
  excelInput.setAttribute("aria-label", "選擇 Excel 工單");
  excelButton.addEventListener("click", () => excelInput.click());
  const jsonButton = document.createElement("button");
  jsonButton.type = "button";
  jsonButton.className = "om-file-button";
  jsonButton.textContent = "選擇 JSON";
  jsonButton.disabled = false;
  const jsonInput = document.createElement("input");
  jsonInput.type = "file";
  jsonInput.accept = ".json,application/json";
  jsonInput.hidden = true;
  jsonInput.setAttribute("aria-label", "選擇 JSON 暫存檔");
  jsonButton.addEventListener("click", () => jsonInput.click());
  const importStatus = document.createElement("p");
  importStatus.className = "om-control-status";
  importStatus.dataset.omStatus = "import";
  importStatus.setAttribute("aria-live", "polite");
  importStatus.textContent = importStatusText;
  excelInput.addEventListener("change", () => {
    const [file] = excelInput.files ?? [];
    if (file) onImport(file);
    excelInput.value = "";
  });
  jsonInput.addEventListener("change", async () => {
    const [file] = jsonInput.files ?? [];
    if (file) await onImportJson(file);
    jsonInput.value = "";
  });
  importSection.append(excelInput, jsonInput, excelButton, jsonButton, importStatus);

  const backgroundField = layout.colorFields.find((field) => field.id === "background");
  const backgroundSection = createSection("02", "背景色設定");
  if (backgroundField) {
    const picker = createColorInput(backgroundField, state, onChange, { compact: true, onColorChange });
    backgroundSection.querySelector(".om-control-heading").append(picker.wrapper);
  }

  const logoSection = createSection("03", "Logo 模式");
  logoSection.append(createLogoMode(state, onChange, onLogoModeChange));

  const textSection = createSection("04", "編輯文字＋顏色");
  const colorInputs = new Map();
  layout.colorFields.forEach((field) => {
    if (field.id === "background") return;
    colorInputs.set(field.id, createColorInput(field, state, onChange, { compact: true, onColorChange }));
  });
  layout.textOrder.forEach((id) => {
    const field = layout.text[id];
    const row = createTextRow(field, state, onChange, onTextChange);
    const color = colorInputs.get(field.colorKey);
    if (color) row.append(color.wrapper);
    textSection.append(row);
  });

  const exportSection = createSection("05", "下載完整專案");
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "om-primary-button";
  exportButton.textContent = "下載完整專案";
  exportButton.disabled = exportBusy;
  exportButton.addEventListener("click", onExport);
  const exportStatus = document.createElement("p");
  exportStatus.className = "om-control-status";
  exportStatus.dataset.omStatus = "export";
  exportStatus.setAttribute("aria-live", "polite");
  exportStatus.textContent = exportStatusText;
  exportSection.append(exportButton, exportStatus);

  const resetSection = createSection("06", "重設工作區域");
  const resetButton = document.createElement("button");
  resetButton.className = "om-danger-button";
  resetButton.type = "button";
  resetButton.textContent = "重設工作區域";
  resetButton.addEventListener("click", onReset);
  resetSection.append(resetButton);

  root.append(importSection, backgroundSection, logoSection, textSection, exportSection, resetSection);
  return {
    setExportBusy: (busy) => { exportButton.disabled = busy; },
    setExportStatus: (value) => { exportStatus.textContent = value; }
  };
}

function createErrorCard(layout, error) {
  const card = document.createElement("div");
  card.className = "om-preview-error";
  card.setAttribute("role", "alert");
  const title = document.createElement("p");
  title.className = "om-preview-error-title";
  title.textContent = `無法產生 ${layout.name} 預覽`;
  const detail = document.createElement("p");
  detail.className = "om-preview-error-detail";
  detail.textContent = error.message;
  card.append(title, detail);
  return card;
}

function availableSize(viewport) {
  const computed = getComputedStyle(viewport);
  return {
    width: Math.max(0, viewport.clientWidth - Number.parseFloat(computed.paddingLeft || "0") - Number.parseFloat(computed.paddingRight || "0")),
    height: Math.max(0, viewport.clientHeight - Number.parseFloat(computed.paddingTop || "0") - Number.parseFloat(computed.paddingBottom || "0"))
  };
}

export async function mountOm({ styleId, mounts }) {
  await loadStylesheet();
  if (!mounts?.layoutList || !mounts?.previewBody || !mounts?.controlBody) {
    throw new Error("OM Console mount point 不完整。");
  }

  const { layoutList, layoutListEmpty, previewBody, controlBody } = mounts;
  const states = new Map(LAYOUTS.map((layout) => [layout.id, createConsoleState(layout, styleId)]));
  let activeLayout = LAYOUTS[0];
  let activeCanvas = null;
  let activeCanvasSize = null;
  let renderToken = 0;
  let importStatus = "尚未匯入工單";
  let exportStatus = "準備下載";
  let exportBusy = false;
  let controls = null;

  const broadcastText = (fieldId, value) => {
    LAYOUTS.forEach((layout) => { states.get(layout.id).text[fieldId] = value; });
  };
  const broadcastColor = (fieldId, value) => {
    LAYOUTS.forEach((layout) => { states.get(layout.id).colors[fieldId] = value; });
  };
  const broadcastLogoMode = (value) => {
    LAYOUTS.forEach((layout) => { states.get(layout.id).logoMode = value; });
  };

  previewBody.classList.add("om-preview-body");
  layoutList.classList.add("om-layout-list");
  if (layoutListEmpty) layoutListEmpty.hidden = true;

  const refit = () => {
    if (!activeCanvas || !activeCanvasSize) return;
    const available = availableSize(previewBody);
    const scale = Math.min(available.width / activeCanvasSize.width, available.height / activeCanvasSize.height, 1);
    activeCanvas.style.width = `${Math.max(1, activeCanvasSize.width * scale)}px`;
    activeCanvas.style.height = `${Math.max(1, activeCanvasSize.height * scale)}px`;
  };
  const observer = new ResizeObserver(refit);
  observer.observe(previewBody);

  const render = async () => {
    const token = ++renderToken;
    const state = states.get(activeLayout.id);
    try {
      const canvas = await renderLayoutToCanvas({ layout: activeLayout, styleId, state });
      if (token !== renderToken) return;
      canvas.className = "om-preview-canvas";
      activeCanvas = canvas;
      activeCanvasSize = activeLayout.canvas;
      previewBody.replaceChildren(canvas);
      refit();
    } catch (error) {
      if (token !== renderToken) return;
      console.error(`${activeLayout.name} OM render 失敗。`, error);
      activeCanvas = null;
      activeCanvasSize = null;
      previewBody.replaceChildren(createErrorCard(activeLayout, error));
    }
  };

  const setImportStatus = (value) => {
    importStatus = value;
    controlBody.querySelector('[data-om-status="import"]')?.replaceChildren(document.createTextNode(value));
  };

  const importWorkOrder = async (file) => {
    setImportStatus("正在讀取工單…");
    try {
      const XLSX = await loadSheetJs();
      const candidate = await parseOmWorkOrderCandidate(file, XLSX);
      Object.entries(candidate).forEach(([fieldId, value]) => broadcastText(fieldId, value));
      mountActiveControls();
      await render();
      setImportStatus(`已匯入：${file.name}`);
    } catch (error) {
      setImportStatus(`匯入失敗：${error instanceof Error ? error.message : "OM 工單匯入失敗。"}`);
    }
  };

  const commitWorkspaceState = (candidate) => {
    LAYOUTS.forEach((layout) => {
      const next = createConsoleState(layout, styleId);
      next.text = { ...candidate.state.text };
      next.colors = { ...candidate.state.colors };
      next.logoMode = candidate.state.logoMode;
      states.set(layout.id, next);
    });
  };

  const importWorkspace = async (file) => {
    setImportStatus("正在匯入暫存檔…");
    try {
      const candidate = parseWorkspaceJson(await file.text(), {
        currentStyleId: styleId,
        layoutIds: LAYOUTS.map((layout) => layout.id)
      });
      commitWorkspaceState(candidate);
      await selectLayout(LAYOUTS.find((layout) => layout.id === candidate.activeLayoutId));
      setImportStatus(`已匯入：${file.name}`);
    } catch (error) {
      setImportStatus(`匯入失敗：${error instanceof Error ? error.message : "OM 暫存檔匯入失敗。"}`);
    }
  };

  const runExport = async () => {
    if (exportBusy) return;
    exportBusy = true;
    controls?.setExportBusy(true);
    exportStatus = "正在建立完整專案…";
    controls?.setExportStatus(exportStatus);
    const snapshot = {
      styleId,
      activeLayoutId: activeLayout.id,
      state: structuredClone(states.get(activeLayout.id))
    };
    try {
      const result = await exportWorkspace({ ...snapshot, layouts: LAYOUTS });
      exportStatus = `已下載：${result.zipName}`;
      controls?.setExportStatus(exportStatus);
    } catch (error) {
      exportStatus = `下載失敗：${error instanceof Error ? error.message : "OM 完整專案下載失敗。"}`;
      controls?.setExportStatus(exportStatus);
    } finally {
      exportBusy = false;
      controls?.setExportBusy(false);
    }
  };

  const buttons = new Map();
  const mountActiveControls = () => {
    controls = mountControls(controlBody, activeLayout, states.get(activeLayout.id), {
      onChange: render,
      onReset: reset,
      onImport: importWorkOrder,
      onImportJson: importWorkspace,
      onExport: runExport,
      exportBusy,
      exportStatusText: exportStatus,
      onTextChange: broadcastText,
      onColorChange: broadcastColor,
      onLogoModeChange: broadcastLogoMode,
      importStatusText: importStatus
    });
  };
  const selectLayout = (layout) => {
    activeLayout = layout;
    buttons.forEach((button, id) => button.setAttribute("aria-current", id === layout.id ? "true" : "false"));
    mountActiveControls();
    return render();
  };
  const reset = () => {
    LAYOUTS.forEach((layout) => states.set(layout.id, createConsoleState(layout, styleId)));
    exportStatus = "準備下載";
    mountActiveControls();
    render();
  };

  layoutList.replaceChildren();
  LAYOUTS.forEach((layout, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "om-layout-button";
    button.textContent = layout.name;
    button.dataset.layoutId = layout.id;
    button.setAttribute("aria-current", index === 0 ? "true" : "false");
    button.addEventListener("click", () => selectLayout(layout));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const nextIndex = (index + (event.key === "ArrowDown" ? 1 : -1) + LAYOUTS.length) % LAYOUTS.length;
      const next = LAYOUTS[nextIndex];
      selectLayout(next);
      buttons.get(next.id)?.focus();
    });
    buttons.set(layout.id, button);
    layoutList.append(button);
  });

  mountActiveControls();
  await render();
}

export { LAYOUTS };
