import { ITEMS, formatItemDisplayName, getItem, isSharedControlsItem } from "./registry.js";
import {
  createWorkspace,
  AR_ITEM_ID,
  AR_TEXT_FIELDS,
  AR_COMBINED_LIMIT,
  countArCombinedUnits
} from "./workspace.js";
import { createEditor, EDITOR_FIELDS, countTextUnits } from "./editor.js";
import { applyBanwords, loadBanwordRules } from "./banwords.js";
import { parseExcelCandidate } from "./excel-import.js";
import { bindKvControls } from "./kv.js";
import { createColorControl } from "./color-control.js";
import { resolveLogoVariant } from "./logo-mode.js";
import { restoreWorkspaceFile } from "./workspace-json.js";
import { createPreviewController } from "./preview.js";
import { exportWorkspace, ExportReadinessError } from "./export.js";
import "./renderers/index.js";

const workspace = createWorkspace();
const itemList = document.querySelector("#item-list");
const previewTitle = document.querySelector("#preview-title");
const previewMeta = document.querySelector("#preview-meta");
const sharedControls = document.querySelector("#shared-controls");
const deferredControls = document.querySelector("#deferred-controls");
const previewController = createPreviewController(document.querySelector("#preview-viewport"));

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

const itemButtons = new Map();
ITEMS.forEach((item) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "item-button";
  button.textContent = formatItemDisplayName(item.name);
  button.dataset.itemId = item.id;
  button.addEventListener("click", () => workspace.dispatch({ type: "SELECT_ITEM", itemId: item.id }));
  itemList.append(button);
  itemButtons.set(item.id, button);
});

const editorControllers = EDITOR_FIELDS.map((field) =>
  createEditor(
    document.querySelector(`#editor-${field.id}`),
    (fieldId, value) => workspace.dispatch({ type: "UPDATE_TEXT", field: fieldId, value }),
    [field]
  )
);

const colorControllers = Object.fromEntries(
  [
    ["background", "背景色"],
    ["title", "主標顏色"],
    ["subtitle", "副標顏色"],
    ["small", "小字顏色"]
  ].map(([field, label]) => [
    field,
    createColorControl(document.querySelector(`#color-${field}`), {
      id: `color-${field}`,
      label,
      value: workspace.getState().shared.colors[field],
      onChange: (value) => workspace.dispatch({ type: "UPDATE_COLOR", field, value })
    })
  ])
);

// --- 14_AR 專屬文字控制（Jamie 裁決）---
// 兩欄共用合計計數（ASCII=0.5／Non-ASCII=1，沿既有 countTextUnits），
// 唯一上限：line1＋line2 合計 <= 5.5；超限 rollback＋inline error，不寫入 Workspace。
// IME composition 期間不 commit（沿 editor.js 既有 pattern）；banwords 沿既有 applyBanwords。
const arControlsElement = document.querySelector("#ar-controls");
const deferredPlaceholder = document.querySelector("#deferred-placeholder");
const arMessage = document.querySelector("#ar-message");
const arCounter = document.querySelector("#ar-counter");
let arRules = null;

function formatArUnits(units) {
  return Number.isInteger(units) ? String(units) : units.toFixed(1);
}

const arControls = new Map(
  AR_TEXT_FIELDS.map((fieldId) => [
    fieldId,
    {
      fieldId,
      input: document.querySelector(`#ar-${fieldId}-input`),
      composing: false,
      lastValidValue: "",
      skipTrailingValue: null
    }
  ])
);

function arStateValues() {
  return workspace.getState().excel.items[AR_ITEM_ID];
}

function updateArCounter() {
  const values = arStateValues();
  const line1 = arControls.get("line1").input.value;
  const line2 = arControls.get("line2").input.value;
  void values;
  arCounter.textContent = `${formatArUnits(countArCombinedUnits(line1, line2))}／${formatArUnits(AR_COMBINED_LIMIT)}`;
}

function setArMessage(text, isError) {
  arMessage.textContent = text;
  arMessage.classList.toggle("is-error", Boolean(isError));
}

function commitArField(control) {
  if (!arRules) return;
  const result = applyBanwords(control.input.value, arRules);
  const otherId = control.fieldId === "line1" ? "line2" : "line1";
  const otherValue = arControls.get(otherId).input.value;
  const combined =
    control.fieldId === "line1"
      ? countArCombinedUnits(result.text, otherValue)
      : countArCombinedUnits(otherValue, result.text);
  if (combined > AR_COMBINED_LIMIT) {
    control.input.value = control.lastValidValue;
    control.input.setAttribute("aria-invalid", "true");
    setArMessage(`兩行合計超過 ${formatArUnits(AR_COMBINED_LIMIT)} 字上限，已回復上一個合法內容。`, true);
    updateArCounter();
    return;
  }
  control.input.value = result.text;
  control.lastValidValue = result.text;
  control.input.removeAttribute("aria-invalid");
  setArMessage(result.messages.length ? `⚠ ${result.messages.join("；")}` : "", false);
  updateArCounter();
  workspace.dispatch({
    type: "UPDATE_ITEM_TEXT",
    itemId: AR_ITEM_ID,
    field: control.fieldId,
    value: result.text
  });
}

arControls.forEach((control) => {
  const { input } = control;
  input.addEventListener("compositionstart", () => {
    control.composing = true;
    control.skipTrailingValue = null;
  });
  input.addEventListener("compositionend", () => {
    control.composing = false;
    commitArField(control);
    control.skipTrailingValue = input.value;
  });
  input.addEventListener("input", (event) => {
    if (control.composing || event.isComposing) return;
    if (control.skipTrailingValue !== null && input.value === control.skipTrailingValue) {
      control.skipTrailingValue = null;
      return;
    }
    control.skipTrailingValue = null;
    commitArField(control);
  });
  input.addEventListener("blur", () => {
    if (!control.composing) commitArField(control);
  });
});

function syncArControls(state) {
  const values = state.excel.items[AR_ITEM_ID];
  arControls.forEach((control) => {
    if (control.composing || document.activeElement === control.input) return;
    const value = String(values[control.fieldId] || "");
    control.input.value = value;
    control.lastValidValue = value;
  });
  const total = countArCombinedUnits(values.line1, values.line2);
  if (total > AR_COMBINED_LIMIT) {
    arControls.forEach((control) => control.input.setAttribute("aria-invalid", "true"));
    setArMessage(`匯入內容超過 ${formatArUnits(AR_COMBINED_LIMIT)} 字上限；後續編輯須符合上限。`, true);
  } else if (!arMessage.classList.contains("is-error")) {
    arControls.forEach((control) => control.input.removeAttribute("aria-invalid"));
  }
  updateArCounter();
}

const excelInput = document.querySelector("#excel-input");
const importStatus = document.querySelector("#import-status");
document.querySelector("#excel-button").addEventListener("click", () => excelInput.click());
excelInput.addEventListener("change", async () => {
  const [file] = excelInput.files || [];
  if (!file) return;
  try {
    const candidate = await parseExcelCandidate(file, workspace.getState());
    workspace.dispatch({ type: "COMMIT_EXCEL_IMPORT", ...candidate });
    setStatus(importStatus, `已匯入：${file.name}`);
  } catch (_error) {
    // Failed imports preserve the last successful import status.
  } finally {
    excelInput.value = "";
  }
});

const jsonInput = document.querySelector("#json-input");
document.querySelector("#json-button").addEventListener("click", () => jsonInput.click());
jsonInput.addEventListener("change", async () => {
  const [file] = jsonInput.files || [];
  if (!file) return;
  try {
    const result = await restoreWorkspaceFile(file, workspace);
    if (!result.cancelled) {
      const restoredState = workspace.getState();
      setStatus(importStatus, `已匯入：${file.name}`);
      setStatus(kvStatus, restoredState.shared.kv ? restoredState.shared.kv.fileName : "尚未上傳");
    }
  } catch (_error) {
    // Failed imports preserve the last successful import status.
  } finally {
    jsonInput.value = "";
  }
});

const kvStatus = document.querySelector("#kv-status");
bindKvControls({
  fileInput: document.querySelector("#kv-input"),
  dropZone: document.querySelector("#kv-drop-zone"),
  removeButton: document.querySelector("#kv-remove"),
  onCandidate: async (kv) => {
    workspace.dispatch(kv ? { type: "SET_KV", kv } : { type: "REMOVE_KV" });
    setStatus(kvStatus, kv ? kv.fileName : "尚未上傳");
  },
  onError: (error) => setStatus(kvStatus, error.message, true)
});

document.addEventListener("dragover", (event) => {
  if (!(event.target instanceof Element) || !event.target.closest("#kv-drop-zone")) event.preventDefault();
});
document.addEventListener("drop", (event) => {
  if (!(event.target instanceof Element) || !event.target.closest("#kv-drop-zone")) event.preventDefault();
});

document.querySelectorAll('input[name="logo-mode"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) workspace.dispatch({ type: "SET_LOGO_MODE", mode: input.value });
  });
});

const exportStatus = document.querySelector("#export-status");
document.querySelector("#export-button").addEventListener("click", async () => {
  setStatus(exportStatus, "正在檢查輸出條件…");
  try {
    await exportWorkspace(workspace.getState());
    setStatus(exportStatus, "完整專案已建立。" );
  } catch (error) {
    if (error instanceof ExportReadinessError) {
      setStatus(exportStatus, `${error.message}。目前不會建立 partial ZIP 或假圖片。`, true);
    } else {
      setStatus(exportStatus, `下載失敗：${error.message}`, true);
    }
  }
});

const RESET_MESSAGE = "確定要重設工作區域嗎？已匯入的工單、KV、文字與顏色設定將回到初始狀態。此操作無法復原。";
document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm(RESET_MESSAGE)) return;
  workspace.dispatch({ type: "RESET" });
  setStatus(importStatus, "尚未匯入檔案");
  setStatus(kvStatus, "尚未上傳");
  setStatus(exportStatus, "");
});

function renderState(state) {
  const item = getItem(state.selectedItemId);
  itemButtons.forEach((button, itemId) => {
    const selected = itemId === state.selectedItemId;
    button.setAttribute("aria-current", selected ? "true" : "false");
    if (selected) button.scrollIntoView({ block: "nearest" });
  });

  previewTitle.textContent = formatItemDisplayName(item.name);
  previewMeta.textContent = `${item.width}×${item.height} · ${item.format.toUpperCase()}`;
  const shared = isSharedControlsItem(item.id);
  sharedControls.hidden = !shared;
  deferredControls.hidden = shared;
  // 14 顯示專屬 AR 控件；15 維持既有 deferred placeholder。
  const isAr = item.id === AR_ITEM_ID;
  arControlsElement.hidden = !isAr;
  deferredPlaceholder.hidden = isAr;
  syncArControls(state);

  editorControllers.forEach((controller) => controller.sync(state.shared.text));
  Object.entries(colorControllers).forEach(([field, controller]) => {
    controller.sync(state.shared.colors[field]);
  });
  document.querySelectorAll('input[name="logo-mode"]').forEach((input) => {
    input.checked = input.value === state.shared.logoMode;
  });
  const resolved = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  document.querySelector("#logo-resolved").textContent =
    state.shared.logoMode === "auto"
      ? `目前自動判斷：${resolved === "orange" ? "橘色" : "白色"}`
      : `目前指定：${resolved === "orange" ? "橘色" : "白色"}`;
  document.querySelector("#kv-remove").disabled = state.shared.kv === null;
  if (state.shared.kv) setStatus(kvStatus, state.shared.kv.fileName);
  else if (!kvStatus.classList.contains("is-error")) setStatus(kvStatus, "尚未上傳");
  previewController.render(state);
}

function shouldIgnoreNavigation(event) {
  if (event.isComposing) return true;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest(".item-button")) return false;
  return Boolean(target.closest("input, textarea, select, button, [contenteditable]:not([contenteditable='false'])"));
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  if (shouldIgnoreNavigation(event)) return;
  const index = ITEMS.findIndex(({ id }) => id === workspace.getState().selectedItemId);
  const offset = event.key === "ArrowUp" ? -1 : 1;
  const nextIndex = Math.max(0, Math.min(ITEMS.length - 1, index + offset));
  if (nextIndex === index) return;
  event.preventDefault();
  workspace.dispatch({ type: "SELECT_ITEM", itemId: ITEMS[nextIndex].id });
  if (event.target instanceof Element && event.target.closest(".item-button")) {
    itemButtons.get(ITEMS[nextIndex].id)?.focus();
  }
});

workspace.subscribe(renderState);
renderState(workspace.getState());

loadBanwordRules()
  .then((rules) => {
    editorControllers.forEach((controller) => controller.setRules(rules));
    arRules = rules;
    arControls.forEach(({ input }) => { input.disabled = false; });
  })
  .catch((error) => {
    editorControllers.forEach((controller) => controller.setLoadError(error));
    arControls.forEach(({ input }) => { input.disabled = true; });
    setArMessage(error.message, true);
  });
