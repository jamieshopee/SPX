export const LOGO_LUMINANCE_THRESHOLD = 0.498708;

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new TypeError("顏色必須是完整的六位 HEX。");
  const value = match[1];
  const red = channelToLinear(Number.parseInt(value.slice(0, 2), 16));
  const green = channelToLinear(Number.parseInt(value.slice(2, 4), 16));
  const blue = channelToLinear(Number.parseInt(value.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function resolveLogoVariant(mode, backgroundHex) {
  if (mode === "orange" || mode === "white") return mode;
  if (mode !== "auto") throw new TypeError("未知的 Logo 模式。");
  return relativeLuminance(backgroundHex) >= LOGO_LUMINANCE_THRESHOLD
    ? "orange"
    : "white";
}
