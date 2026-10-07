// SPX 開獎秀 — OM：正式控制台版位模組
// ---------------------------------------------------------------------------
// 此模組只負責 OM01～OM08 的 Console orchestration：
// descriptor registry、session state、preview、controls 與 OM-specific CSS。
// renderer 與 descriptors 保持為唯一正式來源，不在此複製 geometry。
// ---------------------------------------------------------------------------

import { createInitialState, renderLayoutToCanvas } from "./renderer.js";
import { countTextUnits, formatUnits } from "./text-validation.js";
import { LAYOUT_01_GOOGLE_PMAX_1200X1200 } from "./layout-01-google-pmax-1200x1200.js";
import { LAYOUT_02_GOOGLE_PMAX_1200X628 } from "./layout-02-google-pmax-1200x628.js";
import { LAYOUT_03_GOOGLE_PMAX_960X1200 } from "./layout-03-google-pmax-960x1200.js";
import { LAYOUT_04_LINE_OA } from "./layout-04-line-oa.js";
import { LAYOUT_05_LINE_VOOM } from "./layout-05-line-voom.js";
import { LAYOUT_06_PIXNET_SIDE_STICKER_SIDE_IMAGE } from "./layout-06-pixnet-side-sticker-side-image.js";
import { LAYOUT_07_PIXNET_SIDE_STICKER_BANNER } from "./layout-07-pixnet-side-sticker-banner.js";
import { LAYOUT_08_YAHOO_MBBANNER } from "./layout-08-yahoo-mbbanner.js";

const OM_STYLESHEET_URL = new URL("../css/om-console.css", import.meta.url);
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

function createState(layout, styleId) {
  return createInitialState(styleId, layout);
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

function createTextRow(field, state, onChange) {
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
    state.text[field.id] = value;
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
      state.text[field.id] = value;
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

function createColorInput(field, state, onChange, { compact = false } = {}) {
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
    state.colors[field.id] = next;
    onChange();
  });
  wrapper.append(input);
  return { wrapper, input };
}

function createLogoMode(state, onChange) {
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
      state.logoMode = mode;
      onChange();
    });
    label.append(radio, document.createTextNode(LOGO_LABELS[mode]));
    group.append(label);
  });
  fieldset.append(group);
  return fieldset;
}

function mountControls(root, layout, state, { onChange, onReset }) {
  root.replaceChildren();
  root.classList.add("om-controls");

  const importSection = createSection("01", "匯入工單 Excel 或暫存檔");
  const excelButton = document.createElement("button");
  excelButton.type = "button";
  excelButton.className = "om-file-button";
  excelButton.textContent = "選擇 Excel";
  excelButton.disabled = true;
  const jsonButton = document.createElement("button");
  jsonButton.type = "button";
  jsonButton.className = "om-file-button";
  jsonButton.textContent = "選擇 JSON";
  jsonButton.disabled = true;
  const importStatus = document.createElement("p");
  importStatus.className = "om-control-status";
  importStatus.textContent = "OM 工單功能尚未實作";
  importSection.append(excelButton, jsonButton, importStatus);

  const backgroundField = layout.colorFields.find((field) => field.id === "background");
  const backgroundSection = createSection("02", "背景色設定");
  if (backgroundField) {
    const picker = createColorInput(backgroundField, state, onChange);
    backgroundSection.querySelector(".om-control-heading").append(picker.wrapper);
  }

  const logoSection = createSection("03", "Logo 模式");
  logoSection.append(createLogoMode(state, onChange));

  const textSection = createSection("04", "編輯文字＋顏色");
  const colorInputs = new Map();
  layout.colorFields.forEach((field) => {
    if (field.id === "background") return;
    colorInputs.set(field.id, createColorInput(field, state, onChange, { compact: true }));
  });
  layout.textOrder.forEach((id) => {
    const field = layout.text[id];
    const row = createTextRow(field, state, onChange);
    const color = colorInputs.get(field.colorKey);
    if (color) row.append(color.wrapper);
    textSection.append(row);
  });

  const exportSection = createSection("05", "下載完整專案");
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "om-primary-button";
  exportButton.textContent = "下載完整專案";
  exportButton.disabled = true;
  const exportStatus = document.createElement("p");
  exportStatus.className = "om-control-status";
  exportStatus.textContent = "OM Export 尚未實作";
  exportSection.append(exportButton, exportStatus);

  const resetSection = createSection("06", "重設工作區域");
  const resetButton = document.createElement("button");
  resetButton.className = "om-danger-button";
  resetButton.type = "button";
  resetButton.textContent = "重設工作區域";
  resetButton.addEventListener("click", onReset);
  resetSection.append(resetButton);

  root.append(importSection, backgroundSection, logoSection, textSection, exportSection, resetSection);
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
  const states = new Map(LAYOUTS.map((layout) => [layout.id, createState(layout, styleId)]));
  let activeLayout = LAYOUTS[0];
  let activeCanvas = null;
  let activeCanvasSize = null;
  let renderToken = 0;

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

  const buttons = new Map();
  const selectLayout = (layout) => {
    activeLayout = layout;
    buttons.forEach((button, id) => button.setAttribute("aria-current", id === layout.id ? "true" : "false"));
    mountControls(controlBody, layout, states.get(layout.id), { onChange: render, onReset: reset });
    render();
  };
  const reset = () => {
    states.set(activeLayout.id, createState(activeLayout, styleId));
    mountControls(controlBody, activeLayout, states.get(activeLayout.id), { onChange: render, onReset: reset });
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

  mountControls(controlBody, activeLayout, states.get(activeLayout.id), { onChange: render, onReset: reset });
  await render();
}

export { LAYOUTS };
