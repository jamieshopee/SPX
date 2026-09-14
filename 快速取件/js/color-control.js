export function normalizeHex(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value || "").trim());
  return match ? `#${match[1].toLowerCase()}` : null;
}

export function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

export function rgbToHex(red, green, blue) {
  const channels = [red, green, blue].map((value) => Number(value));
  if (channels.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return null;
  }
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function createColorControl(container, { id, label, value, onChange }) {
  container.replaceChildren();
  const picker = document.createElement("input");
  picker.id = `${id}-picker`;
  picker.type = "color";
  picker.className = "round-color-input";
  picker.setAttribute("aria-label", `${label}選色`);
  picker.title = `${label}選色`;
  container.append(picker);

  let authoritativeValue = normalizeHex(value) || "#000000";

  function sync(nextValue) {
    authoritativeValue = normalizeHex(nextValue) || authoritativeValue;
    picker.value = authoritativeValue;
  }

  picker.addEventListener("input", () => {
    const nextValue = normalizeHex(picker.value);
    if (!nextValue) return;
    authoritativeValue = nextValue;
    onChange(authoritativeValue);
  });

  sync(authoritativeValue);
  return { sync };
}
