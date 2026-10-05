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
import { normalize as normalizeQrUrl, isEmpty as isQrUrlEmpty } from "./qr-url-utils.js";

const LOGO_MODE_LABELS = Object.freeze({
  auto: "Auto",
  orange: "Orange",
  white: "White"
});

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

// 中文漢字以 Unicode Script=Han 判定，不以「是否 ASCII」判定：
// 全形標點（，。！？（）等）屬 Script=Common，必須算 0.5，不是 1。
const HAN_PATTERN = /\p{Script=Han}/u;

export function countTextUnits(value) {
  let units = 0;
  for (const character of String(value ?? "")) {
    units += HAN_PATTERN.test(character) ? 1 : 0.5;
  }
  return units;
}

export function formatUnits(units) {
  return Number.isInteger(units) ? String(units) : units.toFixed(1);
}

export function normalizeHex(value) {
  const match = HEX_PATTERN.exec(String(value ?? "").trim());
  return match ? `#${match[1].toLowerCase()}` : null;
}

function createSection(title) {
  const section = document.createElement("section");
  section.className = "obn-control-section";
  const heading = document.createElement("h3");
  heading.className = "obn-control-heading";
  heading.textContent = title;
  section.append(heading);
  return section;
}

function createTextField(field, state, onChange) {
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

function createColorField(field, state, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "obn-field obn-color-field";

  const label = document.createElement("label");
  label.className = "obn-field-label";
  label.htmlFor = `obn-color-${field.id}`;
  label.textContent = field.label;

  const input = document.createElement("input");
  input.className = "obn-color-input";
  input.id = `obn-color-${field.id}`;
  input.type = "color";
  input.value = normalizeHex(state.colors[field.id]) ?? "#000000";

  const readout = document.createElement("span");
  readout.className = "obn-color-readout";
  readout.textContent = input.value;

  input.addEventListener("input", () => {
    const next = normalizeHex(input.value);
    if (next === null) return;
    state.colors[field.id] = next;
    readout.textContent = next;
    onChange();
  });

  wrapper.append(label, input, readout);
  return wrapper;
}

function createLogoModeField(state, onChange) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "obn-logo-mode";

  const legend = document.createElement("legend");
  legend.className = "obn-field-label";
  legend.textContent = "Logo";
  fieldset.append(legend);

  const group = document.createElement("div");
  group.className = "obn-radio-group";

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
      onChange();
    });

    label.append(radio, document.createTextNode(LOGO_MODE_LABELS[mode]));
    group.append(label);
  });

  fieldset.append(group);
  return fieldset;
}

function createQrUrlField(state, onChange) {
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

export function mountControls(container, { layout, state, onChange }) {
  const root = document.createElement("div");
  root.className = "obn-controls";

  const textSection = createSection("文字");
  layout.textOrder.forEach((id) => {
    textSection.append(createTextField(layout.text[id], state, onChange));
  });

  const colorSection = createSection("顏色");
  layout.colorFields.forEach((field) => {
    colorSection.append(createColorField(field, state, onChange));
  });

  const logoSection = createSection("Logo");
  logoSection.append(createLogoModeField(state, onChange));

  root.append(textSection, colorSection, logoSection);
  if (layout.qr !== undefined) {
    const qrSection = createSection("QR Code");
    qrSection.append(createQrUrlField(state, onChange));
    root.append(qrSection);
  }
  container.replaceChildren(root);
  return root;
}
