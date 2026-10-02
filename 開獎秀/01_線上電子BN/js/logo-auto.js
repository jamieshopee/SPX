// SPX 開獎秀 — 線上／電子BN：Logo Mode 解算（純邏輯）
// ---------------------------------------------------------------------------
// 工具邊界（docs/架構說明.md、開獎秀_正式規格.md § 1.1／§ 7.1）：
//   開獎秀的 JS 完全獨立，不 import 快速取件的程式碼，也不讓快速取件依賴本檔。
//   本檔是開獎秀自己的唯一一套 luminance 判斷；開獎秀內不得再建立第二套。
//
// 公式與 threshold 為 Jamie 裁決，不得修改：
//   sRGB relative luminance，threshold 0.498708，
//   L >= threshold → orange，L < threshold → white。
//
// 本檔不碰 DOM、不碰 Canvas、不保存任何 state。
// variant 不保存為第二份 state；每次 render 依 mode ＋ background 當場解算。
// ---------------------------------------------------------------------------

export const LOGO_LUMINANCE_THRESHOLD = 0.498708;

export const LOGO_MODES = Object.freeze(["auto", "orange", "white"]);

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

export function isLogoMode(value) {
  return LOGO_MODES.includes(value);
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

// 非法 HEX 一律 throw（fail-closed）：不猜測、不補零、不 fallback 到預設色。
export function relativeLuminance(hex) {
  const match = HEX_PATTERN.exec(String(hex ?? "").trim());
  if (!match) throw new TypeError("背景色必須是完整的六位 HEX。");
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
