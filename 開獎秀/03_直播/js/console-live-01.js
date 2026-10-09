// SPX 開獎秀 — 直播 01／02 shared console mount

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";
import { LIVE_02_LAYOUT } from "./layout-02-live-system-cta.js";
import { LIVE_03_LAYOUT } from "./layout-03-live-thumbnail-specified-day.js";
import { LIVE_04_LAYOUT } from "./layout-04-live-msbn-kv.js";
import { LIVE_05_LAYOUT } from "./layout-05-live-msbn-case-card.js";
import { canvasToJpegBlob, createInitialState, renderLiveToCanvas, validateLiveTextState } from "./renderer-01.js";

const LIVE_STYLESHEET_URL = new URL("../css/live-01.css", import.meta.url);
const LIVE_LAYOUTS = Object.freeze([LIVE_01_LAYOUT, LIVE_02_LAYOUT, LIVE_03_LAYOUT, LIVE_04_LAYOUT, LIVE_05_LAYOUT]);
let stylesheetPromise = null;

function ensureStylesheet() {
  stylesheetPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("link[data-live01-stylesheet]");
    if (existing) { resolve(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = LIVE_STYLESHEET_URL.href; link.dataset.live01Stylesheet = "true";
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", () => reject(new Error("直播 CSS 載入失敗。")), { once: true });
    document.head.append(link);
  }).catch((error) => { stylesheetPromise = null; throw error; });
  return stylesheetPromise;
}

function countTextUnits(value) {
  let units = 0;
  for (const character of String(value ?? "")) units += /\p{Script=Han}/u.test(character) ? 1 : 0.5;
  return units;
}

function formatUnits(units) { return Number.isInteger(units) ? String(units) : units.toFixed(1); }

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function readTextField(field, state) {
  return field.group ? state.text.steps[field.group][field.id] : state.text[field.id];
}

function writeTextField(field, state, value) {
  if (field.group) state.text.steps[field.group][field.id] = value;
  else state.text[field.id] = value;
}

function createTextField(field, state, onChange, layout) {
  const wrapper = document.createElement("label"); wrapper.className = "live-01-field";
  const head = document.createElement("span"); head.className = "live-01-field-head";
  const label = document.createElement("span"); label.textContent = field.label;
  const counter = document.createElement("span"); counter.className = "live-01-counter"; head.append(label, counter);
  const input = document.createElement("input"); input.type = "text"; input.value = readTextField(field, state); input.autocomplete = "off";
  let lastValid = input.value; let composing = false;
  const paint = (value) => { counter.textContent = `${formatUnits(countTextUnits(value))} / ${field.limit}`; };
  const rollback = () => { input.value = lastValid; paint(lastValid); };
  const commit = (value) => {
    const previous = lastValid;
    writeTextField(field, state, value);
    try {
      validateLiveTextState(layout, state);
      lastValid = value; paint(value); onChange();
    } catch (error) {
      writeTextField(field, state, previous);
      input.value = previous;
      paint(previous);
      return false;
    }
    return true;
  };
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => {
    composing = false;
    if (countTextUnits(input.value) > field.limit) { rollback(); return; }
    commit(input.value);
  });
  input.addEventListener("input", () => {
    if (composing) { writeTextField(field, state, input.value); paint(input.value); onChange(); return; }
    if (countTextUnits(input.value) > field.limit) { rollback(); return; }
    commit(input.value);
  });
  paint(input.value);
  wrapper.append(head, input);
  return { wrapper };
}

function createColorField(labelText, colorKey, state, onChange) {
  const label = document.createElement("label"); label.className = "live-01-color-field"; label.append(document.createTextNode(labelText));
  const input = document.createElement("input"); input.type = "color"; input.value = state.colors[colorKey]; input.setAttribute("aria-label", labelText);
  input.addEventListener("input", () => { state.colors[colorKey] = input.value; onChange(); }); label.append(input);
  return label;
}

function createLogoModeField(state, onChange) {
  const label = document.createElement("label"); label.className = "live-01-logo-mode"; label.append(document.createTextNode("Logo 模式"));
  const select = document.createElement("select"); select.className = "live-01-logo-select"; select.setAttribute("aria-label", "Logo 模式");
  [["auto", "Auto"], ["orange", "橘色"], ["white", "白色"]].forEach(([value, text]) => {
    const option = document.createElement("option"); option.value = value; option.textContent = text; option.selected = state.logoMode === value; select.append(option);
  });
  select.addEventListener("change", () => { state.logoMode = select.value; onChange(); });
  label.append(select); return label;
}

function getColorFields(layout) {
  return layout.colorFields ?? [
    { id: "background", label: "背景色" },
    { id: "titleTime", label: "主標＋時間" },
    { id: "subtitle", label: "副標" },
    { id: "warning", label: "警語" }
  ];
}

function createStepAccordion(group, state, onChange, layout) {
  const details = document.createElement("details");
  details.className = "live-05-step-group";
  const summary = document.createElement("summary");
  const title = document.createElement("span"); title.textContent = group.label;
  const summaryText = document.createElement("span"); summaryText.className = "live-05-step-summary";
  const updateSummary = () => {
    const values = group.rows.map((row) => readTextField(row, state)).filter(Boolean);
    summaryText.textContent = values.length ? values.join("／") : "尚未填寫";
  };
  summary.append(title, summaryText); details.append(summary);
  group.rows.forEach((row) => details.append(createTextField(row, state, () => { updateSummary(); onChange(); }, layout).wrapper));
  updateSummary();
  return details;
}

export async function mountLive01({ styleId, mounts }) {
  if (!LIVE_LAYOUTS.every((layout) => layout.styles[styleId])) throw new Error(`直播不支援的 style：${styleId}。`);
  const { layoutList, layoutListEmpty, previewBody, controlBody } = mounts;
  if (!layoutList || !layoutListEmpty || !previewBody || !controlBody) throw new Error("直播缺少必要的掛載點。");
  await ensureStylesheet();

  let activeLayout = LIVE_01_LAYOUT;
  let state = createInitialState(styleId, activeLayout);
  let renderToken = 0;
  let exportBusy = false;
  const canvas = document.createElement("canvas");
  canvas.width = activeLayout.canvas.width; canvas.height = activeLayout.canvas.height; canvas.className = "live-01-preview-canvas";
  canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.height = "auto"; previewBody.replaceChildren(canvas);

  let status = null;
  const render = async () => {
    const token = ++renderToken;
    const rendered = await renderLiveToCanvas({ styleId, state, layout: activeLayout });
    if (token !== renderToken) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext("2d").drawImage(rendered, 0, 0);
  };
  const renderSafely = () => render().catch((error) => { if (status) status.textContent = error instanceof Error ? error.message : "直播 render 失敗。"; });

  function mountLayoutButtons() {
    layoutList.replaceChildren();
    LIVE_LAYOUTS.forEach((layout) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "live-01-layout-button";
      button.textContent = `${layout.id}｜${layout.name}`; button.setAttribute("aria-current", String(layout.id === activeLayout.id));
      button.addEventListener("click", () => {
        if (layout.id === activeLayout.id) return;
        activeLayout = layout;
        state = createInitialState(styleId, activeLayout);
        canvas.width = activeLayout.canvas.width;
        canvas.height = activeLayout.canvas.height;
        mountLayoutButtons(); buildControls(); renderSafely();
      });
      layoutList.append(button);
    });
    layoutListEmpty.hidden = true;
  }

  function buildControls() {
    const controls = document.createElement("div"); controls.className = "live-01-controls";
    const textCard = document.createElement("section"); textCard.className = "live-01-card";
    const textHeading = document.createElement("h3"); textHeading.className = "live-01-heading"; textHeading.textContent = "編輯文字"; textCard.append(textHeading);
    activeLayout.textOrder.forEach((id) => {
      const field = activeLayout.text[id];
      textCard.append(createTextField(field, state, renderSafely, activeLayout).wrapper);
    });
    if (activeLayout.stepGroups) {
      const stepCard = document.createElement("section"); stepCard.className = "live-01-card live-05-step-card";
      const stepHeading = document.createElement("h3"); stepHeading.className = "live-01-heading"; stepHeading.textContent = "STEP 文字";
      stepCard.append(stepHeading);
      activeLayout.stepGroups.forEach((group) => stepCard.append(createStepAccordion(group, state, renderSafely, activeLayout)));
      controls.append(textCard, stepCard);
    }
    const logoCard = document.createElement("section"); logoCard.className = "live-01-card";
    const logoHeading = document.createElement("h3"); logoHeading.className = "live-01-heading"; logoHeading.textContent = "Logo";
    logoCard.append(logoHeading, createLogoModeField(state, renderSafely));
    const colorCard = document.createElement("section"); colorCard.className = "live-01-card";
    const colorHeading = document.createElement("h3"); colorHeading.className = "live-01-heading"; colorHeading.textContent = "顏色";
    const colors = document.createElement("div"); colors.className = "live-01-colors";
    getColorFields(activeLayout).forEach(({ label, id }) => colors.append(createColorField(label, id, state, renderSafely)));
    colorCard.append(colorHeading, colors);
    const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.className = "live-01-button"; exportButton.textContent = "下載 JPG";
    status = document.createElement("p"); status.className = "live-01-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); status.textContent = "準備就緒";
    exportButton.addEventListener("click", async () => {
      if (exportBusy) return;
      exportBusy = true; exportButton.disabled = true; status.textContent = "正在建立 JPG…";
      try {
        const rendered = await renderLiveToCanvas({ styleId, state: structuredClone(state), layout: activeLayout });
        const name = activeLayout.outputName ?? (activeLayout.id === "02" ? "直播大廳LPBN_系統CTA.jpg" : "直播大廳LPBN_立即看.jpg");
        downloadBlob(await canvasToJpegBlob(rendered), name); status.textContent = `已下載：${name}`;
      } catch (error) { status.textContent = error instanceof Error ? error.message : "JPG 下載失敗。"; }
      finally { exportBusy = false; exportButton.disabled = false; }
    });
    if (!activeLayout.stepGroups) controls.append(textCard);
    controls.append(logoCard, colorCard, exportButton, status); controlBody.replaceChildren(controls);
  }

  mountLayoutButtons(); buildControls(); await render();
}
