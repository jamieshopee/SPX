// SPX 開獎秀 — 直播 01 shared console mount

import { LIVE_01_LAYOUT, getLive01Style } from "./layout-01-live-lpbn.js";
import { canvasToJpegBlob, createInitialState, renderLive01ToCanvas } from "./renderer-01.js";

const LIVE_STYLESHEET_URL = new URL("../css/live-01.css", import.meta.url);
const OUTPUT_NAME = "直播大廳LPBN_立即看.jpg";
let stylesheetPromise = null;

function ensureStylesheet() {
  stylesheetPromise ||= new Promise((resolve, reject) => {
    const existing = document.querySelector("link[data-live01-stylesheet]");
    if (existing) { resolve(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LIVE_STYLESHEET_URL.href;
    link.dataset.live01Stylesheet = "true";
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", () => reject(new Error("直播 01 CSS 載入失敗。")), { once: true });
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
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = fileName; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createTextField(field, state, onChange) {
  const wrapper = document.createElement("label"); wrapper.className = "live-01-field";
  const head = document.createElement("span"); head.className = "live-01-field-head";
  const label = document.createElement("span"); label.textContent = field.label;
  const counter = document.createElement("span"); counter.className = "live-01-counter";
  head.append(label, counter);
  const input = document.createElement("input"); input.type = "text"; input.value = state.text[field.id]; input.autocomplete = "off";
  let lastValid = input.value; let composing = false;
  const paint = (value) => { counter.textContent = `${formatUnits(countTextUnits(value))} / ${field.limit}`; };
  const rollback = () => { input.value = lastValid; paint(lastValid); };
  const commit = (value) => { lastValid = value; state.text[field.id] = value; paint(value); onChange(); };
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; if (countTextUnits(input.value) > field.limit) rollback(); else commit(input.value); });
  input.addEventListener("input", () => {
    if (composing) { state.text[field.id] = input.value; paint(input.value); onChange(); return; }
    if (countTextUnits(input.value) > field.limit) rollback(); else commit(input.value);
  });
  paint(input.value); wrapper.append(head, input); return wrapper;
}

function createColorField(labelText, colorKey, state, onChange) {
  const label = document.createElement("label"); label.className = "live-01-color-field"; label.append(document.createTextNode(labelText));
  const input = document.createElement("input"); input.type = "color"; input.value = state.colors[colorKey]; input.setAttribute("aria-label", labelText);
  input.addEventListener("input", () => { state.colors[colorKey] = input.value; onChange(); }); label.append(input); return label;
}

function createLogoModeField(state, onChange) {
  const label = document.createElement("label"); label.className = "live-01-logo-mode";
  label.append(document.createTextNode("Logo 模式"));
  const select = document.createElement("select"); select.className = "live-01-logo-select";
  select.setAttribute("aria-label", "Logo 模式");
  [["auto", "Auto"], ["orange", "橘色"], ["white", "白色"]].forEach(([value, text]) => {
    const option = document.createElement("option"); option.value = value; option.textContent = text; option.selected = state.logoMode === value; select.append(option);
  });
  select.addEventListener("change", () => { state.logoMode = select.value; onChange(); });
  label.append(select); return label;
}

export async function mountLive01({ styleId, mounts }) {
  const style = getLive01Style(styleId);
  if (!style) throw new Error(`直播 01 不支援的 style：${styleId}。`);
  const { layoutList, layoutListEmpty, previewBody, controlBody } = mounts;
  if (!layoutList || !layoutListEmpty || !previewBody || !controlBody) throw new Error("直播 01 缺少必要的掛載點。");
  await ensureStylesheet();

  const state = createInitialState(styleId);
  let renderToken = 0; let exportBusy = false;
  const canvas = document.createElement("canvas");
  canvas.width = LIVE_01_LAYOUT.canvas.width; canvas.height = LIVE_01_LAYOUT.canvas.height; canvas.className = "live-01-preview-canvas";
  canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.height = "auto"; previewBody.replaceChildren(canvas);

  layoutList.replaceChildren();
  const layoutButton = document.createElement("button");
  layoutButton.type = "button"; layoutButton.className = "live-01-layout-button"; layoutButton.textContent = `01｜${LIVE_01_LAYOUT.name}`;
  layoutButton.setAttribute("aria-current", "true"); layoutButton.disabled = true; layoutList.append(layoutButton); layoutListEmpty.hidden = true;

  const render = async () => {
    const token = ++renderToken;
    const rendered = await renderLive01ToCanvas({ styleId, state });
    if (token !== renderToken) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext("2d").drawImage(rendered, 0, 0);
  };
  const requestRender = () => render().catch((error) => { status.textContent = error instanceof Error ? error.message : "直播 01 render 失敗。"; });
  const controls = document.createElement("div"); controls.className = "live-01-controls";
  const textCard = document.createElement("section"); textCard.className = "live-01-card";
  const textHeading = document.createElement("h3"); textHeading.className = "live-01-heading"; textHeading.textContent = "編輯文字"; textCard.append(textHeading);
  LIVE_01_LAYOUT.textOrder.forEach((id) => textCard.append(createTextField(LIVE_01_LAYOUT.text[id], state, requestRender)));
  const logoCard = document.createElement("section"); logoCard.className = "live-01-card";
  const logoHeading = document.createElement("h3"); logoHeading.className = "live-01-heading"; logoHeading.textContent = "Logo";
  logoCard.append(logoHeading, createLogoModeField(state, requestRender));
  const colorCard = document.createElement("section"); colorCard.className = "live-01-card";
  const colorHeading = document.createElement("h3"); colorHeading.className = "live-01-heading"; colorHeading.textContent = "顏色";
  const colors = document.createElement("div"); colors.className = "live-01-colors";
  colors.append(createColorField("背景色", "background", state, requestRender), createColorField("主標＋時間", "titleTime", state, requestRender), createColorField("副標", "subtitle", state, requestRender), createColorField("警語", "warning", state, requestRender));
  colorCard.append(colorHeading, colors);
  const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.className = "live-01-button"; exportButton.textContent = "下載 JPG";
  const status = document.createElement("p"); status.className = "live-01-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); status.textContent = "準備就緒";
  exportButton.addEventListener("click", async () => {
    if (exportBusy) return;
    exportBusy = true; exportButton.disabled = true; status.textContent = "正在建立 JPG…";
    try {
      const rendered = await renderLive01ToCanvas({ styleId, state: structuredClone(state) });
      if (rendered.width !== 1125 || rendered.height !== 360) throw new Error("輸出尺寸不符。");
      downloadBlob(await canvasToJpegBlob(rendered), OUTPUT_NAME); status.textContent = `已下載：${OUTPUT_NAME}`;
    } catch (error) { status.textContent = error instanceof Error ? error.message : "JPG 下載失敗。"; }
    finally { exportBusy = false; exportButton.disabled = false; }
  });
  controls.append(textCard, logoCard, colorCard, exportButton, status); controlBody.replaceChildren(controls); await render();
}
