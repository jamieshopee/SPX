// SPX 開獎秀 — live editor orchestration for layouts 01–14.

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";
import { LIVE_02_LAYOUT } from "./layout-02-live-system-cta.js";
import { LIVE_03_LAYOUT } from "./layout-03-live-thumbnail-specified-day.js";
import { LIVE_04_LAYOUT } from "./layout-04-live-msbn-kv.js";
import { LIVE_05_LAYOUT } from "./layout-05-live-msbn-case-card.js";
import { LIVE_06_LAYOUT } from "./layout-06-live-opening-card.js";
import { LIVE_07_LAYOUT } from "./layout-07-live-case-card-process.js";
import { LIVE_08_LAYOUT } from "./layout-08-live-award-explanation.js";
import { LIVE_09_LAYOUT } from "./layout-09-live-next-event-promo.js";
import { LIVE_10_LAYOUT } from "./layout-10-live-current-event.js";
import { LIVE_11_LAYOUT } from "./layout-11-tvbn-live-info.js";
import { LIVE_12_LAYOUT } from "./layout-12-new-live-room-fl-logo.js";
import { LIVE_13_LAYOUT } from "./layout-13-new-live-room-fl.js";
import { LIVE_14_LAYOUT } from "./layout-14-live-mirror-logo.js";
import { mountLive06TextSelection } from "./live-06-text-selection.js";
import { mountLive08TextSelection } from "./live-08-text-selection.js";
import { mountLive08AwardEditor } from "./live-08-award-editor.js";
import { clearTextRangesForField, createInitialState, renderLiveToCanvas, validateLiveTextState } from "./renderer-01.js";
import { exportLiveProject } from "./export-live.js";
import { parseLiveWorkspaceJson } from "./workspace-live.js";

const LIVE_STYLESHEET_URL = new URL("../css/live-01.css", import.meta.url);
const LIVE_LAYOUTS = Object.freeze([
  LIVE_01_LAYOUT, LIVE_02_LAYOUT, LIVE_03_LAYOUT, LIVE_04_LAYOUT, LIVE_05_LAYOUT,
  LIVE_06_LAYOUT, LIVE_07_LAYOUT, LIVE_08_LAYOUT, LIVE_09_LAYOUT, LIVE_10_LAYOUT,
  LIVE_11_LAYOUT, LIVE_12_LAYOUT, LIVE_13_LAYOUT, LIVE_14_LAYOUT
]);
const TEXT_SYNC_GROUPS = Object.freeze([
  Object.freeze(["01.titleTime", "02.titleTime"]),
  Object.freeze(["01.subtitle", "02.subtitle", "03.big", "04.subtitle", "05.subtitle", "07.subtitle"]),
  Object.freeze(["04.title", "05.title", "07.title"]),
  Object.freeze(["03.small1", "04.small1", "07.small1"])
]);
const COLOR_SYNC_GROUPS = Object.freeze([
  Object.freeze(LIVE_LAYOUTS.filter((layout) => layout.id !== "14").map((layout) => `${layout.id}.background`)),
  Object.freeze(["01.titleTime", "02.titleTime"]),
  Object.freeze(["01.subtitle", "02.subtitle", "03.big", "04.subtitle", "05.subtitle", "07.subtitle"]),
  Object.freeze(["04.title", "05.title", "07.title"]),
  Object.freeze(["03.small", "04.small", "07.small"]),
  Object.freeze(["01.warning", "02.warning", "05.warning", "06.warning", "07.warning"])
]);
const LOGO_SYNC_GROUPS = Object.freeze([
  Object.freeze(["01", "02", "03", "04", "05", "07"]),
  Object.freeze(["06", "12"])
]);
let stylesheetPromise = null;

function ensureStylesheet() {
  stylesheetPromise ||= new Promise((resolve, reject) => {
    if (document.querySelector("link[data-live01-stylesheet]")) { resolve(); return; }
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

function blankEditableTextValues(value) {
  if (typeof value === "string") return "";
  if (Array.isArray(value)) return value.map(blankEditableTextValues);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, blankEditableTextValues(nestedValue)]));
  }
  return value;
}

function createBlankLiveState(styleId, layout) {
  const state = createInitialState(styleId, layout);
  state.text = blankEditableTextValues(state.text);
  return state;
}

function readTextField(field, state) {
  return field.group ? state.text.steps[field.group][field.id] : state.text[field.id];
}

function writeTextField(field, state, value) {
  if (field.group) state.text.steps[field.group][field.id] = value;
  else state.text[field.id] = value;
}

function createTextField(field, state, layout, { onCommit, onChange, onDraft }) {
  const row = document.createElement("div"); row.className = "om-text-row live-01-text-row";
  const wrapper = document.createElement("div"); wrapper.className = "om-field";
  const head = document.createElement("div"); head.className = "om-field-head";
  const label = document.createElement("label"); label.className = "om-field-label";
  label.htmlFor = `live-text-${layout.id}-${field.group ?? "main"}-${field.id}`; label.textContent = field.label;
  const counter = document.createElement("span"); counter.className = "om-field-counter"; head.append(label, counter);
  const input = field.multiline ? document.createElement("textarea") : document.createElement("input");
  if (!field.multiline) input.type = "text";
  input.className = "om-text-input"; input.id = label.htmlFor; input.value = readTextField(field, state); input.autocomplete = "off";
  if (field.multiline) { input.rows = field.maxLines; input.spellcheck = false; }
  let lastValid = input.value;
  let composing = false;
  const exceedsLimit = (value) => field.multiline
    ? String(value).split("\n").length > field.maxLines || String(value).split("\n").some((line) => countTextUnits(line) > field.maxCharsPerLine)
    : field.limit != null && countTextUnits(value) > field.limit;
  const paint = (value) => {
    if (field.multiline) {
      const lines = String(value).split("\n");
      counter.textContent = `${lines.length}/${field.maxLines} 行 · ${lines.map(countTextUnits).join("/")} / ${field.maxCharsPerLine}`;
    } else counter.textContent = field.limit == null ? formatUnits(countTextUnits(value)) : `${formatUnits(countTextUnits(value))} / ${field.limit}`;
  };
  const rollback = () => {
    writeTextField(field, state, lastValid);
    input.value = lastValid; paint(lastValid); onDraft();
  };
  const commit = (value) => {
    if (exceedsLimit(value)) { rollback(); return false; }
    const previous = lastValid;
    writeTextField(field, state, previous);
    if (!onCommit(field, value)) { rollback(); return false; }
    lastValid = value; paint(value); onChange(); return true;
  };
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; commit(input.value); });
  input.addEventListener("input", () => {
    if (composing) {
      writeTextField(field, state, input.value); paint(input.value);
      if (!field.multiline) { onDraft(); onChange(); }
      return;
    }
    commit(input.value);
  });
  paint(input.value); wrapper.append(head, input); row.append(wrapper);
  return row;
}

function createColorField(labelText, colorKey, state, onChange, { compact = false } = {}) {
  const label = document.createElement("label"); label.className = compact ? "om-color-picker-only" : "om-live-extra-color-picker";
  if (!compact) label.append(document.createTextNode(labelText));
  const input = document.createElement("input"); input.className = "om-color-input"; input.type = "color";
  input.value = state.colors[colorKey] ?? "#000000";
  input.setAttribute("aria-label", `${labelText}選色`); input.title = `${labelText}選色`;
  input.addEventListener("input", () => onChange(colorKey, input.value)); label.append(input);
  return label;
}

function createLogoModeField(state, onChange) {
  const fieldset = document.createElement("fieldset"); fieldset.className = "om-logo-mode live-01-logo-mode";
  fieldset.setAttribute("aria-label", "Logo 模式");
  const group = document.createElement("div"); group.className = "om-radio-group";
  [["auto", "Auto"], ["orange", "橘色"], ["white", "白色"]].forEach(([value, text]) => {
    const label = document.createElement("label"); label.className = "om-radio";
    const radio = document.createElement("input"); radio.type = "radio"; radio.name = "live-logo-mode"; radio.value = value; radio.checked = state.logoMode === value;
    radio.addEventListener("change", () => { if (radio.checked) onChange(value); });
    label.append(radio, document.createTextNode(text)); group.append(label);
  });
  fieldset.append(group); return fieldset;
}

function getColorFields(layout) {
  return layout.colorFields ?? [
    { id: "background", label: "背景色" },
    { id: "titleTime", label: "主標＋時間" },
    { id: "subtitle", label: "副標" },
    { id: "warning", label: "警語" }
  ];
}

function createStepAccordion(group, state, layout, { onCommit, onChange, onDraft }) {
  const details = document.createElement("details"); details.className = "live-05-step-group";
  const summary = document.createElement("summary");
  const title = document.createElement("span"); title.textContent = group.label;
  const summaryText = document.createElement("span"); summaryText.className = "live-05-step-summary";
  const updateSummary = () => {
    const values = group.rows.map((row) => readTextField(row, state)).filter(Boolean);
    summaryText.textContent = values.length ? values.join("／") : "尚未填寫";
  };
  summary.append(title, summaryText); details.append(summary);
  group.rows.forEach((row) => details.append(createTextField(row, state, layout, {
    onCommit,
    onChange: () => { updateSummary(); onChange(); },
    onDraft: () => { updateSummary(); onDraft(); }
  })));
  updateSummary(); return details;
}

export async function mountLive01({ styleId, mounts }) {
  if (!LIVE_LAYOUTS.every((layout) => layout.styles[styleId])) throw new Error(`直播不支援的 style：${styleId}。`);
  const { layoutList, layoutListEmpty, previewBody, controlBody } = mounts;
  if (!layoutList || !layoutListEmpty || !previewBody || !controlBody) throw new Error("直播缺少必要的掛載點。");
  await ensureStylesheet();

  let states = new Map(LIVE_LAYOUTS.map((layout) => [layout.id, createBlankLiveState(styleId, layout)]));
  let activeLayout = LIVE_01_LAYOUT;
  let renderToken = 0;
  let projectExportBusy = false;
  let importStatusText = "Excel 匯入尚未開放；可選擇 JSON 工作區。";
  let projectStatusText = "準備下載完整專案";
  let syncStatus = null;
  let previewStatus = null;
  let cleanupSelection = () => {};
  let cleanupAwardEditor = () => {};
  let activeCanvasSize = activeLayout.canvas;
  const layoutButtons = new Map();
  const canvas = document.createElement("canvas");
  canvas.width = activeCanvasSize.width; canvas.height = activeCanvasSize.height;
  canvas.className = "live-01-preview-canvas om-preview-canvas";
  previewBody.classList.add("om-preview-body"); layoutList.classList.add("om-layout-list"); layoutListEmpty.hidden = true;
  previewBody.replaceChildren(canvas);

  const render = async () => {
    const token = ++renderToken;
    const layout = activeLayout;
    const rendered = await renderLiveToCanvas({ styleId, state: structuredClone(states.get(layout.id)), layout });
    if (token !== renderToken) return;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("無法建立直播 Preview Canvas。");
    context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(rendered, 0, 0);
    if (previewStatus) previewStatus.textContent = "Preview 已就緒。";
  };
  const renderSafely = () => render().catch((error) => {
    if (previewStatus) previewStatus.textContent = error instanceof Error ? error.message : "直播 Preview render 失敗。";
  });
  const availableSize = () => {
    const computed = getComputedStyle(previewBody);
    return {
      width: Math.max(0, previewBody.clientWidth - Number.parseFloat(computed.paddingLeft || "0") - Number.parseFloat(computed.paddingRight || "0")),
      height: Math.max(0, previewBody.clientHeight - Number.parseFloat(computed.paddingTop || "0") - Number.parseFloat(computed.paddingBottom || "0"))
    };
  };
  const refitPreview = () => {
    const available = availableSize();
    const scale = Math.min(available.width / activeCanvasSize.width, available.height / activeCanvasSize.height, 1);
    canvas.style.width = `${Math.max(1, activeCanvasSize.width * scale)}px`;
    canvas.style.height = `${Math.max(1, activeCanvasSize.height * scale)}px`;
  };
  const resizeObserver = new ResizeObserver(refitPreview);
  resizeObserver.observe(previewBody);

  const groupFor = (groups, key) => groups.find((group) => group.includes(key)) ?? null;
  const commitCandidates = (candidates) => {
    candidates.forEach((candidate, id) => {
      if (id === activeLayout.id) Object.assign(states.get(id), candidate);
      else states.set(id, candidate);
    });
  };
  const applyTextChange = (layout, field, value) => {
    const sourceKey = `${layout.id}.${field.id}`;
    const group = field.group ? null : groupFor(TEXT_SYNC_GROUPS, sourceKey);
    const candidates = new Map();
    try {
      (group ?? [sourceKey]).forEach((member) => {
        const [layoutId, fieldId] = member.split(".");
        const targetLayout = LIVE_LAYOUTS.find((candidate) => candidate.id === layoutId);
        const targetField = field.group ? field : targetLayout?.text[fieldId];
        const fieldAvailable = field.group
          ? targetLayout?.stepGroups?.some((group) => group.id === field.group)
          : targetLayout?.textOrder.includes(fieldId);
        if (!targetLayout || !targetField || !fieldAvailable) throw new Error("同步欄位不存在。");
        const candidate = structuredClone(states.get(layoutId));
        writeTextField(targetField, candidate, value);
        if (layoutId === "06" && targetField.multiline && value !== states.get(layoutId).text[fieldId]) clearTextRangesForField(candidate, targetField);
        validateLiveTextState(targetLayout, candidate);
        candidates.set(layoutId, candidate);
      });
      commitCandidates(candidates);
      if (syncStatus) syncStatus.textContent = group ? "已套用至相同語意且限制相容的版位。" : "此欄位僅保存在目前版位。";
      return true;
    } catch (error) {
      if (syncStatus) syncStatus.textContent = error instanceof Error ? error.message : "欄位驗證失敗，未套用變更。";
      return false;
    }
  };
  const applyColorChange = (layout, colorKey, value) => {
    const sourceKey = `${layout.id}.${colorKey}`;
    const group = groupFor(COLOR_SYNC_GROUPS, sourceKey);
    const candidates = new Map();
    (group ?? [sourceKey]).forEach((member) => {
      const [layoutId, key] = member.split(".");
      const targetLayout = LIVE_LAYOUTS.find((candidate) => candidate.id === layoutId);
      if (!targetLayout || !getColorFields(targetLayout).some((field) => field.id === key) || !(key in states.get(layoutId).colors)) return;
      const candidate = structuredClone(states.get(layoutId)); candidate.colors[key] = value; candidates.set(layoutId, candidate);
    });
    if (!candidates.size) return false;
    commitCandidates(candidates);
    if (syncStatus) syncStatus.textContent = group ? "顏色已同步至相同語意且控制範圍相容的版位。" : "顏色僅套用於目前版位。";
    return true;
  };
  const applyLogoMode = (layout, value) => {
    const group = LOGO_SYNC_GROUPS.find((members) => members.includes(layout.id));
    const candidates = new Map();
    (group ?? [layout.id]).forEach((layoutId) => {
      const targetLayout = LIVE_LAYOUTS.find((candidate) => candidate.id === layoutId);
      if (!targetLayout?.logo) return;
      const candidate = structuredClone(states.get(layoutId)); candidate.logoMode = value; candidates.set(layoutId, candidate);
    });
    commitCandidates(candidates);
    if (syncStatus) syncStatus.textContent = group ? "Logo 模式已同步至相同 Logo 家族。" : "Logo 模式僅套用於目前版位。";
  };
  const createCard = (number, title) => {
    const section = document.createElement("section"); section.className = "om-control-card live-01-card";
    const heading = document.createElement("h3"); heading.className = "om-control-heading live-01-heading";
    const index = document.createElement("span"); index.className = "om-control-number"; index.textContent = number; index.setAttribute("aria-hidden", "true");
    heading.append(index, document.createTextNode(title)); section.append(heading);
    return { section, heading };
  };
  const mountLayoutButtons = () => {
    layoutButtons.forEach((button, id) => button.setAttribute("aria-current", String(id === activeLayout.id)));
  };

  const buildControls = () => {
    cleanupAwardEditor(); cleanupAwardEditor = () => {};
    const state = states.get(activeLayout.id);
    const colorFields = getColorFields(activeLayout);
    const colorFieldById = new Map(colorFields.map((field) => [field.id, field]));
    const consumedColors = new Set();
    const controls = document.createElement("div"); controls.className = "om-controls live-01-controls";

    const importCard = createCard("01", "匯入工單 Excel 或暫存檔").section;
    const importInput = document.createElement("input"); importInput.type = "file"; importInput.accept = ".json,application/json"; importInput.hidden = true;
    importInput.setAttribute("aria-label", "選擇 JSON 工作區");
    const excelButton = document.createElement("button"); excelButton.type = "button"; excelButton.className = "om-file-button";
    excelButton.textContent = "選擇 Excel"; excelButton.disabled = true;
    const importButton = document.createElement("button"); importButton.type = "button"; importButton.className = "om-file-button"; importButton.textContent = "選擇 JSON";
    importButton.addEventListener("click", () => importInput.click());
    const importStatus = document.createElement("p"); importStatus.className = "om-control-status"; importStatus.setAttribute("role", "status"); importStatus.setAttribute("aria-live", "polite"); importStatus.textContent = importStatusText;
    importInput.addEventListener("change", async () => {
      const [file] = importInput.files ?? [];
      if (!file) return;
      importStatusText = `正在驗證：${file.name}`; importStatus.textContent = importStatusText;
      try {
        const candidate = parseLiveWorkspaceJson(await file.text(), {
          currentStyleId: styleId, layouts: LIVE_LAYOUTS, createInitialState, validateState: validateLiveTextState
        });
        cleanupSelection(); cleanupSelection = () => {};
        cleanupAwardEditor(); cleanupAwardEditor = () => {};
        states = candidate.states;
        activeLayout = LIVE_LAYOUTS.find((layout) => layout.id === candidate.activeLayoutId);
        importStatusText = `已還原：${file.name}`;
        mountLayoutButtons(); canvas.width = activeLayout.canvas.width; canvas.height = activeLayout.canvas.height; activeCanvasSize = activeLayout.canvas;
        buildControls(); mountSelection(); refitPreview(); await render();
      } catch (error) {
        importStatusText = `匯入失敗：${error instanceof Error ? error.message : "工作區驗證失敗。"}`;
        importStatus.textContent = importStatusText;
      } finally { importInput.value = ""; }
    });
    importCard.append(importInput, excelButton, importButton, importStatus); controls.append(importCard);

    const backgroundField = colorFieldById.get("background");
    if (backgroundField) {
      const backgroundCard = createCard("02", "背景色設定"); consumedColors.add("background");
      backgroundCard.heading.append(createColorField(backgroundField.label, "background", state, (key, value) => {
        if (applyColorChange(activeLayout, key, value)) renderSafely();
      }, { compact: true }));
      controls.append(backgroundCard.section);
    }
    if (activeLayout.logo) {
      const logoCard = createCard("03", "Logo 模式").section;
      logoCard.append(createLogoModeField(state, (value) => { applyLogoMode(activeLayout, value); renderSafely(); })); controls.append(logoCard);
    }

    const hasEditableText = activeLayout.textOrder.length > 0 || Boolean(activeLayout.stepGroups?.length);
    const hasExtraColors = colorFields.some((field) => field.id !== "background");
    if (hasEditableText || hasExtraColors) {
      const textCard = createCard("04", "編輯文字＋顏色").section;
      syncStatus = document.createElement("p"); syncStatus.className = "om-control-status live-01-sync-status";
      syncStatus.setAttribute("role", "status"); syncStatus.setAttribute("aria-live", "polite");
      syncStatus.textContent = "共同欄位依語意與版位限制同步；特殊欄位保留獨立。";
      const makeColor = (key) => {
        const definition = colorFieldById.get(key);
        if (!definition || key === "background" || consumedColors.has(key)) return null;
        consumedColors.add(key);
        return createColorField(definition.label, key, state, (colorKey, value) => {
          if (applyColorChange(activeLayout, colorKey, value)) renderSafely();
        }, { compact: true });
      };
      const onCommit = (field, value) => applyTextChange(activeLayout, field, value);
      activeLayout.textOrder.forEach((id) => {
        const field = activeLayout.text[id];
        const row = createTextField(field, state, activeLayout, { onCommit, onChange: renderSafely, onDraft: renderSafely });
        const color = makeColor(field.colorKey); if (color) row.append(color);
        textCard.append(row);
      });
      if (activeLayout.stepGroups) {
        const stepHeading = document.createElement("h4"); stepHeading.className = "om-control-heading live-01-step-heading"; stepHeading.textContent = "STEP 文字";
        const stepColor = makeColor("step"); if (stepColor) stepHeading.append(stepColor);
        textCard.append(stepHeading);
        activeLayout.stepGroups.forEach((group) => textCard.append(createStepAccordion(group, state, activeLayout, {
          onCommit, onChange: renderSafely, onDraft: renderSafely
        })));
      }
      colorFields.forEach(({ id, label }) => {
        if (id === "background" || consumedColors.has(id)) return;
        consumedColors.add(id);
        const row = document.createElement("div"); row.className = "om-live-extra-color-row";
        const caption = document.createElement("span"); caption.className = "om-field-label"; caption.textContent = label;
        row.append(caption, createColorField(label, id, state, (key, value) => {
          if (applyColorChange(activeLayout, key, value)) renderSafely();
        }, { compact: true })); textCard.append(row);
      });
      if (activeLayout.id === "08") {
        cleanupAwardEditor = mountLive08AwardEditor({
          container: textCard, layout: activeLayout, getState: () => states.get(activeLayout.id), onChange: renderSafely
        });
      }
      textCard.append(syncStatus); controls.append(textCard);
    } else syncStatus = null;

    const projectCard = createCard("05", "下載完整專案").section;
    const projectButton = document.createElement("button"); projectButton.type = "button"; projectButton.className = "om-primary-button live-project-export";
    projectButton.textContent = "下載完整專案"; projectButton.disabled = projectExportBusy;
    const projectStatus = document.createElement("p"); projectStatus.className = "om-control-status live-project-status"; projectStatus.setAttribute("role", "status"); projectStatus.setAttribute("aria-live", "polite"); projectStatus.textContent = projectStatusText;
    projectButton.addEventListener("click", async () => {
      if (projectExportBusy) return;
      projectExportBusy = true; projectButton.disabled = true; projectStatusText = "正在建立 15 個檔案…"; projectStatus.textContent = projectStatusText;
      try {
        const result = await exportLiveProject({ styleId, activeLayoutId: activeLayout.id, layouts: LIVE_LAYOUTS, states });
        projectStatusText = `已下載：${result.zipName}（${result.entryCount} 個檔案）`;
      } catch (error) {
        projectStatusText = `下載失敗：${error instanceof Error ? error.message : "完整專案匯出失敗。"}`;
      } finally {
        projectExportBusy = false; projectButton.disabled = false; projectStatus.textContent = projectStatusText;
        const currentButton = controlBody.querySelector(".live-project-export"); if (currentButton) currentButton.disabled = false;
        const currentStatus = controlBody.querySelector(".live-project-status"); if (currentStatus) currentStatus.textContent = projectStatusText;
      }
    });
    projectCard.append(projectButton, projectStatus); controls.append(projectCard);

    const resetCard = createCard("06", "重設工作區域").section;
    const resetButton = document.createElement("button"); resetButton.type = "button"; resetButton.className = "om-danger-button"; resetButton.textContent = "重設工作區域";
    resetButton.addEventListener("click", () => {
      states = new Map(LIVE_LAYOUTS.map((layout) => [layout.id, createBlankLiveState(styleId, layout)]));
      importStatusText = "工作區已重設為目前樣式預設值；可編輯文字留白。";
      projectStatusText = "準備下載完整專案";
      cleanupSelection(); cleanupSelection = () => {}; cleanupAwardEditor(); cleanupAwardEditor = () => {};
      mountLayoutButtons(); buildControls(); mountSelection(); renderSafely();
    });
    resetCard.append(resetButton); controls.append(resetCard);

    previewStatus = document.createElement("p"); previewStatus.className = "om-control-status"; previewStatus.setAttribute("role", "status");
    previewStatus.setAttribute("aria-live", "polite"); previewStatus.textContent = "Preview 已就緒."; controls.append(previewStatus);
    controlBody.replaceChildren(controls);
  };

  const selectLayout = (layout) => {
    if (layout.id === activeLayout.id) return;
    cleanupSelection(); cleanupSelection = () => {}; cleanupAwardEditor(); cleanupAwardEditor = () => {};
    activeLayout = layout; activeCanvasSize = layout.canvas; canvas.width = layout.canvas.width; canvas.height = layout.canvas.height;
    mountLayoutButtons(); buildControls(); mountSelection(); refitPreview(); renderSafely();
  };
  const mountSelection = () => {
    cleanupSelection(); cleanupSelection = () => {};
    if (activeLayout.id === "06") {
      cleanupSelection = mountLive06TextSelection({ container: previewBody, canvas, layout: activeLayout, getState: () => states.get(activeLayout.id), render: renderSafely });
    } else if (activeLayout.id === "08") {
      cleanupSelection = mountLive08TextSelection({ container: previewBody, canvas, layout: activeLayout, getState: () => states.get(activeLayout.id), render: renderSafely });
    }
  };

  layoutList.replaceChildren();
  LIVE_LAYOUTS.forEach((layout, index) => {
    const button = document.createElement("button"); button.type = "button"; button.className = "om-layout-button live-01-layout-button";
    button.textContent = layout.name; button.dataset.layoutId = layout.id; button.setAttribute("aria-current", String(layout.id === activeLayout.id));
    button.addEventListener("click", () => selectLayout(layout));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const nextIndex = (index + (event.key === "ArrowDown" ? 1 : -1) + LIVE_LAYOUTS.length) % LIVE_LAYOUTS.length;
      const next = LIVE_LAYOUTS[nextIndex]; selectLayout(next); layoutButtons.get(next.id)?.focus();
    });
    layoutButtons.set(layout.id, button); layoutList.append(button);
  });
  mountLayoutButtons(); buildControls(); mountSelection(); refitPreview(); await render();
  return () => { resizeObserver.disconnect(); cleanupSelection(); cleanupAwardEditor(); };
}
