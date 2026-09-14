import { ITEMS, formatItemDisplayName, getItem, isSharedControlsItem } from "./registry.js";
import { createWorkspace } from "./workspace.js";
import { createEditor, EDITOR_FIELDS } from "./editor.js";
import { loadBanwordRules } from "./banwords.js";
import { parseExcelCandidate } from "./excel-import.js";
import { bindKvControls } from "./kv.js";
import { createColorControl } from "./color-control.js";
import { resolveLogoVariant } from "./logo-mode.js";
import { restoreWorkspaceFile } from "./workspace-json.js";
import { createPreviewController } from "./preview.js";
import { exportWorkspace, ExportReadinessError } from "./export.js";

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
  .then((rules) => editorControllers.forEach((controller) => controller.setRules(rules)))
  .catch((error) => editorControllers.forEach((controller) => controller.setLoadError(error)));
