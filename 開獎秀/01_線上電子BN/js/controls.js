// SPX 開獎秀 — 線上／電子BN：右欄正式 Controls
// ---------------------------------------------------------------------------
// 既有正式控制項：
//   主標／副標／小字 1／小字 2 四個文字欄
//   背景色／主標色／副標色／小字色 四個顏色
//   Logo Mode：Auto／Orange／White
//   descriptor 宣告 qr 時，另有一個「縮址」欄位；01～11 controls 保持不變。
//
// 小字 1 與小字 2 共用同一個小字顏色，不新增第二個小字顏色控制。
// 沒有 KV：不建立任何 KV 控制、state 或 placeholder。
//
// 本檔不綁定任何單一版位：文字欄位、上限與顏色欄位一律由傳入的
// layout descriptor 提供（layout.textOrder／layout.text／layout.colorFields）。
//
// weighted count（四欄共用，Jamie 正式規則）：中文 = 1 unit；英文／數字／符號 = 0.5 unit。
// 上限由各 layout 的 field.limit 提供（online-bn 目前全版位共通 8 / 7 / 18 / 18）。
//
// 超限行為為最小 fail-closed rollback：
//   還原 input.value 到 lastValidValue、不更新 state、不 rerender、
//   不截斷字串、不彈窗。
//
// IME：composition 期間不做 rollback（避免未選字的中間態被誤判而清掉輸入）；
//   compositionend 後完整驗證一次，超限才 rollback。
//
// 本檔不碰 Canvas、不碰 renderer、不保存 state 擁有權（state 由 online-bn.js 持有）。
// ---------------------------------------------------------------------------

import { LOGO_MODES } from "./logo-auto.js";
import { resolveLogoVariant } from "./logo-auto.js";
import { normalize as normalizeQrUrl, isEmpty as isQrUrlEmpty } from "./qr-url-utils.js";
import { countTextUnits, formatUnits } from "./text-validation.js";

const LOGO_MODE_LABELS = Object.freeze({ auto: "自動", orange: "橘色", white: "白色" });

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

export function normalizeHex(value) {
  const match = HEX_PATTERN.exec(String(value ?? "").trim());
  return match ? `#${match[1].toLowerCase()}` : null;
}

function createSection(number, title) {
  const section = document.createElement("section");
  section.className = "obn-control-card";
  const heading = document.createElement("h3");
  heading.className = "obn-control-heading";
  const index = document.createElement("span");
  index.className = "obn-control-number";
  index.textContent = number;
  index.setAttribute("aria-hidden", "true");
  heading.append(index, document.createTextNode(title));
  section.append(heading);
  return section;
}

function createTextField(field, state, onChange, onTextChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "obn-field";

  const label = document.createElement("label");
  label.className = "obn-field-label";
  label.htmlFor = `obn-text-${field.id}`;
  label.textContent = field.label;

  const counter = document.createElement("span");
  counter.className = "obn-field-counter";

  const head = document.createElement("div");
  head.className = "obn-field-head";
  head.append(label, counter);

  const input = document.createElement("input");
  input.className = "obn-text-input";
  input.id = `obn-text-${field.id}`;
  input.type = "text";
  input.autocomplete = "off";
  input.value = state.text[field.id];

  let lastValidValue = input.value;
  let isComposing = false;

  function paintCounter(value) {
    counter.textContent = `${formatUnits(countTextUnits(value))} / ${field.limit}`;
  }

  function commit(value) {
    lastValidValue = value;
    state.text[field.id] = value;
    if (typeof onTextChange === "function") onTextChange(field.id, value);
    paintCounter(value);
    onChange();
  }

  // 超限 rollback：還原到上一個合法值，不更新 state、不 rerender、不截斷。
  function rollback() {
    input.value = lastValidValue;
    paintCounter(lastValidValue);
  }

  input.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  input.addEventListener("compositionend", () => {
    isComposing = false;
    const value = input.value;
    if (countTextUnits(value) > field.limit) {
      // composition 期間可能已把中間態寫入 state，這裡一併還原並重繪。
      rollback();
      if (state.text[field.id] !== lastValidValue) {
        state.text[field.id] = lastValidValue;
        if (typeof onTextChange === "function") onTextChange(field.id, lastValidValue);
        onChange();
      }
      return;
    }
    commit(value);
  });

  input.addEventListener("input", () => {
    const value = input.value;
    // composition 進行中：給即時預覽，但不做驗證與 rollback。
    if (isComposing) {
      state.text[field.id] = value;
      if (typeof onTextChange === "function") onTextChange(field.id, value);
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
  wrapper.append(head, input);
  return wrapper;
}

function createColorField(
  field,
  state,
  onChange,
  afterChange,
  onColorChange,
  pickerGroups,
  { compact = false } = {}
) {
  const wrapper = document.createElement("div");
  wrapper.className = compact ? "obn-color-picker-only" : "obn-field obn-color-field";

  if (!compact) {
    const label = document.createElement("label");
    label.className = "obn-field-label";
    label.htmlFor = `obn-color-${field.id}`;
    label.textContent = field.label;
    wrapper.append(label);
  }

  const input = document.createElement("input");
  input.className = "obn-color-input";
  input.id = `obn-color-${field.id}`;
  input.type = "color";
  input.setAttribute("aria-label", `${field.label}選色`);
  input.title = `${field.label}選色`;
  input.value = normalizeHex(state.colors[field.id]) ?? "#000000";

  const group = pickerGroups.get(field.id) ?? [];
  group.push(input);
  pickerGroups.set(field.id, group);

  input.addEventListener("input", () => {
    const next = normalizeHex(input.value);
    if (next === null) return;
    state.colors[field.id] = next;
    group.forEach((picker) => { picker.value = next; });
    if (typeof onColorChange === "function") onColorChange(field.id, next);
    if (typeof afterChange === "function") afterChange();
    onChange();
  });

  wrapper.append(input);
  return wrapper;
}

function createLogoModeField(state, onChange, onLogoModeChange) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "obn-logo-mode";

  const legend = document.createElement("legend");
  legend.className = "obn-field-label";
  legend.textContent = "Logo";
  fieldset.append(legend);

  const group = document.createElement("div");
  group.className = "obn-radio-group";

  const feedback = document.createElement("p");
  feedback.className = "obn-logo-feedback";
  feedback.setAttribute("aria-live", "polite");

  function paintResolved() {
    const variant = resolveLogoVariant(state.logoMode, state.colors.background);
    feedback.textContent = state.logoMode === "auto"
      ? `目前自動判斷：${variant === "orange" ? "橘色" : "白色"}`
      : `目前套用：${variant === "orange" ? "橘色" : "白色"}`;
  }

  LOGO_MODES.forEach((mode) => {
    const label = document.createElement("label");
    label.className = "obn-radio";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "obn-logo-mode";
    radio.value = mode;
    radio.checked = state.logoMode === mode;

    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      // 只保存 mode；variant 一律由 renderer 於每次 render 當場解算。
      state.logoMode = mode;
      if (typeof onLogoModeChange === "function") onLogoModeChange(mode);
      paintResolved();
      onChange();
    });

    label.append(radio, document.createTextNode(LOGO_MODE_LABELS[mode]));
    group.append(label);
  });

  fieldset.append(group, feedback);
  paintResolved();
  return { fieldset, refresh: paintResolved };
}

function createImportSection({ importStatus, onImportFile, onImportJson }) {
  const section = createSection("01", "匯入工單 Excel 或暫存檔");
  const input = document.createElement("input");
  input.className = "obn-file-input";
  input.id = "obn-work-order-file";
  input.type = "file";
  input.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
  input.setAttribute("aria-label", "選擇 Excel 工單");
  const jsonInput = document.createElement("input");
  jsonInput.className = "obn-file-input";
  jsonInput.id = "obn-workspace-json-file";
  jsonInput.type = "file";
  jsonInput.accept = ".json,application/json";
  jsonInput.setAttribute("aria-label", "選擇 JSON 暫存檔");

  const label = document.createElement("label");
  label.className = "obn-file-button";
  label.htmlFor = input.id;
  label.textContent = "選擇 Excel";
  const jsonLabel = document.createElement("label");
  jsonLabel.className = "obn-file-button";
  jsonLabel.htmlFor = jsonInput.id;
  jsonLabel.textContent = "選擇 JSON";

  const status = document.createElement("p");
  status.className = "obn-control-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = importStatus;

  input.addEventListener("change", () => {
    const [file] = input.files ?? [];
    if (file) onImportFile(file);
    input.value = "";
  });
  jsonInput.addEventListener("change", () => {
    const [file] = jsonInput.files ?? [];
    if (file) onImportJson(file);
    jsonInput.value = "";
  });

  section.append(input, jsonInput, label, jsonLabel, status);
  return { section, setStatus: (value) => { status.textContent = value; } };
}

function createExportSection({ onExport, exportStatus, exportBusy }) {
  const section = createSection("06", "下載完整專案");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "obn-primary-button";
  button.textContent = "下載完整專案";
  button.addEventListener("click", () => onExport());
  const status = document.createElement("p");
  status.className = "obn-control-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = exportStatus;
  section.append(button, status);
  return {
    section,
    setStatus: (value) => { status.textContent = value; },
    setBusy: (busy) => { button.disabled = busy; button.textContent = busy ? "輸出中…" : "下載完整專案"; }
  };
}

function createResetSection(onReset) {
  const section = createSection("07", "重設工作區域");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "obn-danger-button";
  button.textContent = "重設工作區域";
  button.addEventListener("click", () => onReset());
  section.append(button);
  return section;
}

function createQrUrlField(state, onChange, onQrChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "obn-field";
  const label = document.createElement("label");
  label.className = "obn-field-label";
  label.htmlFor = "obn-qr-url";
  label.textContent = "縮址";

  const input = document.createElement("input");
  input.className = "obn-text-input obn-qr-input";
  input.id = "obn-qr-url";
  input.type = "text";
  input.inputMode = "url";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.value = state.qrUrl;
  input.setAttribute("aria-describedby", "obn-qr-feedback");

  const feedback = document.createElement("p");
  feedback.id = "obn-qr-feedback";
  feedback.className = "obn-qr-feedback";
  feedback.setAttribute("aria-live", "polite");

  function paintValidation() {
    const normalized = normalizeQrUrl(input.value);
    const invalid = normalized === null && !isQrUrlEmpty(input.value);
    input.setAttribute("aria-invalid", String(invalid));
    feedback.textContent = invalid ? "請輸入有效的 http／https 網址；目前不顯示 QR。" : "";
    feedback.hidden = !invalid;
    return normalized;
  }

  input.addEventListener("input", () => {
    // 非法字串只留在 input 供修正；清空同一 state value，移除上一個 QR。
    state.qrUrl = paintValidation() ?? "";
    if (typeof onQrChange === "function") onQrChange(state.qrUrl);
    onChange();
  });
  input.addEventListener("blur", () => {
    const normalized = paintValidation();
    if (normalized !== null) input.value = normalized;
  });
  paintValidation();
  wrapper.append(label, input, feedback);
  return wrapper;
}

export function mountControls(
  container,
  {
    layout,
    state,
    onChange,
    onTextChange,
    onColorChange,
    onLogoModeChange,
    onImportFile,
    onImportJson,
    importStatus = "尚未匯入檔案",
    onReset,
    onQrChange,
    onExport,
    exportStatus = "",
    onExportBusyChange
  }
) {
  const root = document.createElement("div");
  root.className = "obn-controls";
  const pickerGroups = new Map();

  const importControl = createImportSection({ importStatus, onImportFile, onImportJson });
  const exportControl = createExportSection({
    onExport,
    exportStatus,
    exportBusy: false
  });

  const logoControl = createLogoModeField(state, onChange, onLogoModeChange);
  const backgroundSection = createSection("02", "背景色設定");
  const backgroundField = layout.colorFields.find((field) => field.id === "background");
  if (backgroundField) {
    const backgroundPicker = createColorField(
      backgroundField,
      state,
      onChange,
      () => logoControl.refresh(),
      onColorChange,
      pickerGroups,
      { compact: true }
    );
    backgroundSection.querySelector(".obn-control-heading").append(backgroundPicker);
  }

  const logoSection = createSection("03", "Logo 模式");
  logoSection.append(logoControl.fieldset);

  const textSection = createSection("04", "編輯文字＋顏色");
  layout.textOrder.forEach((id) => {
    const field = layout.text[id];
    const row = document.createElement("div");
    row.className = "obn-text-color-row";
    row.append(createTextField(field, state, onChange, onTextChange));
    const colorField = layout.colorFields.find((candidate) => candidate.id === field.colorKey);
    if (colorField) {
      row.append(createColorField(
        colorField,
        state,
        onChange,
        undefined,
        onColorChange,
        pickerGroups,
        { compact: true }
      ));
    }
    textSection.append(row);
  });

  root.append(importControl.section, backgroundSection, logoSection, textSection);
  if (layout.qr !== undefined) {
    const qrSection = createSection("05", "QR Code");
    qrSection.append(createQrUrlField(state, onChange, onQrChange));
    root.append(qrSection);
  }
  root.append(exportControl.section, createResetSection(onReset));
  container.replaceChildren(root);
  return {
    root,
    setImportStatus: importControl.setStatus,
    setExportStatus: exportControl.setStatus,
    setExportBusy: (busy) => {
      exportControl.setBusy(busy);
      if (typeof onExportBusyChange === "function") onExportBusyChange(busy);
    }
  };
}
