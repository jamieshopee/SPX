import { applyBanwords } from "./banwords.js";

export const EDITOR_FIELDS = Object.freeze([
  { id: "title", label: "主標", limit: 8 },
  { id: "subtitle", label: "副標", limit: 7 },
  { id: "small", label: "小字", limit: 14 }
]);

export function countTextUnits(value) {
  let units = 0;
  for (const character of String(value || "")) {
    units += character.codePointAt(0) <= 0x7f ? 0.5 : 1;
  }
  return units;
}

function formatUnits(units) {
  return Number.isInteger(units) ? String(units) : units.toFixed(1);
}

export function createEditor(container, onValidChange, fields = EDITOR_FIELDS) {
  let rules = null;
  let loadError = null;
  const controls = new Map();
  container.replaceChildren();

  fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "editor-field";

    const label = document.createElement("label");
    label.htmlFor = `editor-input-${field.id}`;
    label.textContent = field.label;

    const input = document.createElement("input");
    input.id = `editor-input-${field.id}`;
    input.type = "text";
    input.autocomplete = "off";
    input.disabled = true;

    const meta = document.createElement("div");
    meta.className = "field-meta";
    const message = document.createElement("span");
    message.className = "field-message";
    message.setAttribute("aria-live", "polite");
    const counter = document.createElement("span");
    counter.className = "field-counter";
    meta.append(message, counter);
    wrapper.append(label, input, meta);
    container.append(wrapper);

    const control = {
      input,
      message,
      counter,
      field,
      composing: false,
      lastValidValue: "",
      skipTrailingValue: null
    };
    controls.set(field.id, control);

    const updateCounter = () => {
      counter.textContent = `${formatUnits(countTextUnits(input.value))}／${field.limit}`;
    };

    const commit = () => {
      if (!rules) return;
      const result = applyBanwords(input.value, rules);
      const units = countTextUnits(result.text);
      if (units > field.limit) {
        input.value = control.lastValidValue;
        input.setAttribute("aria-invalid", "true");
        message.textContent = `超過 ${field.limit} 字上限，已回復上一個合法內容。`;
        message.classList.add("is-error");
        updateCounter();
        return;
      }

      input.value = result.text;
      control.lastValidValue = result.text;
      input.removeAttribute("aria-invalid");
      message.classList.remove("is-error");
      message.textContent = result.messages.length ? `⚠ ${result.messages.join("；")}` : "";
      updateCounter();
      onValidChange(field.id, result.text);
    };

    input.addEventListener("compositionstart", () => {
      control.composing = true;
      control.skipTrailingValue = null;
    });
    input.addEventListener("compositionend", () => {
      control.composing = false;
      commit();
      control.skipTrailingValue = input.value;
    });
    input.addEventListener("input", (event) => {
      if (control.composing || event.isComposing) return;
      if (control.skipTrailingValue !== null && input.value === control.skipTrailingValue) {
        control.skipTrailingValue = null;
        return;
      }
      control.skipTrailingValue = null;
      commit();
    });
    input.addEventListener("blur", () => {
      if (!control.composing) commit();
    });
    updateCounter();
  });

  return {
    setRules(nextRules) {
      rules = nextRules;
      loadError = null;
      controls.forEach(({ input }) => { input.disabled = false; });
    },

    setLoadError(error) {
      rules = null;
      loadError = error.message;
      controls.forEach(({ input, message }) => {
        input.disabled = true;
        message.textContent = loadError;
        message.classList.add("is-error");
      });
    },

    sync(values) {
      controls.forEach((control, fieldId) => {
        if (control.composing || document.activeElement === control.input) return;
        const value = String(values[fieldId] || "");
        control.input.value = value;
        if (countTextUnits(value) <= control.field.limit) {
          control.lastValidValue = value;
          control.input.removeAttribute("aria-invalid");
          if (!loadError) {
            control.message.textContent = "";
            control.message.classList.remove("is-error");
          }
        } else {
          control.lastValidValue = value;
          control.input.setAttribute("aria-invalid", "true");
          control.message.textContent = `匯入內容超過 ${control.field.limit} 字；後續編輯須符合上限。`;
          control.message.classList.add("is-error");
        }
        control.counter.textContent = `${formatUnits(countTextUnits(value))}／${control.field.limit}`;
      });
    }
  };
}
