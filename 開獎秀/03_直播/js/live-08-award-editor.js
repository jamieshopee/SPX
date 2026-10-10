// SPX 開獎秀 — 直播 08 獎項編輯 modal

import { clearLive08TextRangesForField } from "./live-08-text-selection.js";
import { validateLiveTextState } from "./renderer-01.js";

function countTextUnits(value) {
  return [...String(value ?? "")].reduce((sum, character) => sum + (/\p{Script=Han}/u.test(character) ? 1 : 0.5), 0);
}

function formatUnits(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getPath(root, path) {
  return path.split(".").reduce((value, key) => value?.[key], root);
}

function setPath(root, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((current, key) => current[key], root);
  parent[last] = value;
}

function lineLimitExceeded(value, field) {
  const lines = String(value).split("\n");
  if (field.maxLines && lines.length > field.maxLines) return true;
  if (field.maxCharsPerLine && lines.some((line) => countTextUnits(line) > field.maxCharsPerLine)) return true;
  if (field.limit != null && countTextUnits(value) > field.limit) return true;
  return false;
}

export function mountLive08AwardEditor({ container, layout, getState, onChange }) {
  if (layout.id !== "08" || !layout.awardTable) return () => {};

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "live-01-button live-08-editor-open";
  openButton.textContent = "編輯獎項表格";
  container.append(openButton);

  const dialog = document.createElement("dialog");
  dialog.className = "live-08-award-dialog";
  dialog.setAttribute("aria-label", "編輯獎項表格");
  const shell = document.createElement("div");
  shell.className = "live-08-award-dialog-shell";
  const header = document.createElement("header");
  header.className = "live-08-award-dialog-header";
  const title = document.createElement("h2");
  title.textContent = "編輯獎項表格";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "live-08-award-close";
  closeButton.textContent = "關閉";
  closeButton.addEventListener("click", () => dialog.close());
  header.append(title, closeButton);

  const body = document.createElement("div");
  body.className = "live-08-award-dialog-body";
  const navigation = document.createElement("nav");
  navigation.className = "live-08-award-nav";
  navigation.setAttribute("aria-label", "獎項項目");
  const editor = document.createElement("section");
  editor.className = "live-08-award-fields";
  editor.setAttribute("aria-live", "polite");
  body.append(navigation, editor);
  shell.append(header, body);
  dialog.append(shell);
  document.body.append(dialog);

  const sectionButtons = new Map();
  let activeSectionId = layout.awardTable.editorSections[0]?.id;

  function renderSection() {
    const section = layout.awardTable.editorSections.find((item) => item.id === activeSectionId);
    if (!section) return;
    sectionButtons.forEach((button, id) => button.setAttribute("aria-current", String(id === section.id)));
    editor.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = section.label;
    editor.append(heading);

    section.fields.forEach((fieldConfig) => {
      const renderField = layout.awardTable.fields.find((field) => field.id === fieldConfig.id);
      if (!renderField) return;
      const label = document.createElement("label");
      label.className = "live-08-award-field";
      const head = document.createElement("span");
      head.className = "live-08-award-field-head";
      const fieldLabel = document.createElement("span");
      fieldLabel.textContent = fieldConfig.label;
      const counter = document.createElement("span");
      counter.className = "live-08-award-counter";
      head.append(fieldLabel, counter);
      const input = renderField.multiline ? document.createElement("textarea") : document.createElement("input");
      if (input instanceof HTMLInputElement) input.type = "text";
      if (input instanceof HTMLTextAreaElement) {
        input.rows = renderField.maxLines ?? 2;
        input.spellcheck = false;
      }
      input.autocomplete = "off";
      let lastValid = String(getPath(getState().text, fieldConfig.path) ?? "");
      input.value = lastValid;
      let composing = false;

      const paintCounter = () => {
        const lines = String(input.value).split("\n");
        if (renderField.maxCharsPerLine) {
          counter.textContent = lines.length + "/" + renderField.maxLines + " 行 · " +
            lines.map((line) => formatUnits(countTextUnits(line))).join("/") + " / " + renderField.maxCharsPerLine;
        } else if (renderField.limit != null) {
          counter.textContent = formatUnits(countTextUnits(input.value)) + " / " + renderField.limit;
        } else if (renderField.maxLines) {
          counter.textContent = lines.length + "/" + renderField.maxLines + " 行";
        } else {
          counter.textContent = formatUnits(countTextUnits(input.value));
        }
      };
      const rollback = () => {
        input.value = lastValid;
        setPath(getState().text, fieldConfig.path, lastValid);
        paintCounter();
      };
      const commit = () => {
        const state = getState();
        const previous = lastValid;
        const next = input.value;
        setPath(state.text, fieldConfig.path, next);
        try {
          validateLiveTextState(layout, state);
        } catch {
          rollback();
          return;
        }
        if (next !== previous && renderField.selectable) {
          clearLive08TextRangesForField(state, renderField.id, renderField.maxLines);
        }
        lastValid = next;
        paintCounter();
        onChange();
      };

      input.addEventListener("compositionstart", () => { composing = true; });
      input.addEventListener("compositionend", () => {
        composing = false;
        if (lineLimitExceeded(input.value, renderField)) { rollback(); return; }
        commit();
      });
      input.addEventListener("input", () => {
        if (composing) {
          setPath(getState().text, fieldConfig.path, input.value);
          paintCounter();
          onChange();
          return;
        }
        if (lineLimitExceeded(input.value, renderField)) { rollback(); return; }
        commit();
      });
      paintCounter();
      label.append(head, input);
      editor.append(label);
    });
  }

  layout.awardTable.editorSections.forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "live-08-award-nav-button";
    button.textContent = section.label;
    button.addEventListener("click", () => {
      activeSectionId = section.id;
      renderSection();
    });
    sectionButtons.set(section.id, button);
    navigation.append(button);
  });
  renderSection();
  openButton.addEventListener("click", () => dialog.showModal());

  return () => {
    if (dialog.open) dialog.close();
    dialog.remove();
    openButton.remove();
  };
}
