// SPX 開獎秀 — OM 01 renderer
// OM-specific descriptor/assets; typography call pattern follows online-bn.

import { LAYOUT_01_GOOGLE_PMAX_1200X1200 as LAYOUT } from "./layout-01-google-pmax-1200x1200.js";

export const SUPERSAMPLE_SCALE = 2;
export const FONT_FAMILY = Object.freeze({
  regular: "LotteryShowNotoSans Regular",
  medium: "LotteryShowNotoSans Medium",
  bold: "LotteryShowNotoSans Bold"
});

const FONT_SOURCE_URL = Object.freeze({
  regular: new URL("../../../fonts/ShopeeNotoSans(content)-Regular.woff2", import.meta.url),
  medium: new URL("../../../fonts/ShopeeNotoSans(content)-Medium.woff2", import.meta.url),
  bold: new URL("../../../fonts/ShopeeNotoSans(content)-Bold.woff2", import.meta.url)
});
const FONT_TEST_TEXT = "取件最高抽百萬$1,000,000%";
const familyPromises = new Map();
const assetPromises = new Map();

export function fontString(field) {
  return `${field.fontSizePx}px "${FONT_FAMILY[field.family]}"`;
}

export function layoutTextFields(layout) {
  return layout.textOrder.map((id) => layout.text[id]);
}

export function layoutFontFamilies(layout) {
  return [...new Set(layoutTextFields(layout).map((field) => field.family))];
}

function registerFamily(familyKey) {
  if (!familyPromises.has(familyKey)) {
    const promise = (async () => {
      const fontFace = new FontFace(
        FONT_FAMILY[familyKey],
        `url("${FONT_SOURCE_URL[familyKey].href}")`
      );
      await fontFace.load();
      document.fonts.add(fontFace);
    })().catch((error) => {
      familyPromises.delete(familyKey);
      throw new Error(`正式字型載入失敗（${familyKey}）：${error.message}`);
    });
    familyPromises.set(familyKey, promise);
  }
  return familyPromises.get(familyKey);
}

async function ensureFontsReady(layout) {
  if (!document.fonts) {
    throw new Error(`瀏覽器不支援正式字型載入檢查，已停止 ${layout.name} render。`);
  }
  await Promise.all(layoutFontFamilies(layout).map(registerFamily));
  const checks = layoutTextFields(layout).map((field) => fontString(field));
  await Promise.all(checks.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  if (!checks.every((font) => document.fonts.check(font, FONT_TEST_TEXT))) {
    throw new Error(`正式字型尚未就緒，已停止 ${layout.name} render。`);
  }
}

function loadImage(url, expected, label) {
  const href = url.href;
  if (!assetPromises.has(href)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`${label} 載入失敗：${decodeURIComponent(url.pathname)}`)), { once: true });
      image.src = href;
    }).then((image) => {
      if (image.naturalWidth !== expected.width || image.naturalHeight !== expected.height) {
        throw new Error(`${label} 必須為 ${expected.width} × ${expected.height}px，實際為 ${image.naturalWidth} × ${image.naturalHeight}px。`);
      }
      return image;
    }).catch((error) => { assetPromises.delete(href); throw error; });
    assetPromises.set(href, promise);
  }
  return assetPromises.get(href);
}

export function computeContainRect(box, sourceWidth, sourceHeight, align = "center") {
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return {
    x: align === "left" ? box.x : box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height
  };
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!match) throw new TypeError("背景色必須是完整的六位 HEX。");
  const value = match[1];
  const red = channelToLinear(Number.parseInt(value.slice(0, 2), 16));
  const green = channelToLinear(Number.parseInt(value.slice(2, 4), 16));
  const blue = channelToLinear(Number.parseInt(value.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function resolveLogoVariant(mode, background) {
  if (mode === "orange" || mode === "white") return mode;
  if (mode !== "auto") throw new TypeError("未知的 Logo 模式。");
  return relativeLuminance(background) >= 0.498708 ? "orange" : "white";
}

export function drawLayoutText(context, text, field, color, align) {
  if (text === "") return;
  const font = fontString(field);
  context.font = font;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(text);
  const inkLeft = -metrics.actualBoundingBoxLeft;
  const inkRight = metrics.actualBoundingBoxRight;
  const inkTop = -metrics.actualBoundingBoxAscent;
  const inkBottom = metrics.actualBoundingBoxDescent;
  const box = field.box;
  const x = align === "left"
    ? box.x - inkLeft
    : box.x + (box.width - (inkRight - inkLeft)) / 2 - inkLeft;
  const y = box.y + box.height / 2 - (inkTop + inkBottom) / 2;
  context.fillStyle = color;
  context.fillText(text, x, y);
}

function drawSupersampledLayer(context, layout, state) {
  const fields = layout.supersampledFields;
  if (fields.every((id) => state.text[id] === "")) return;
  const offscreen = document.createElement("canvas");
  offscreen.width = layout.canvas.width * SUPERSAMPLE_SCALE;
  offscreen.height = layout.canvas.height * SUPERSAMPLE_SCALE;
  const offscreenContext = offscreen.getContext("2d");
  if (!offscreenContext) throw new Error(`無法建立 ${layout.name} supersampling 暫存 Canvas 2D context。`);
  offscreenContext.scale(SUPERSAMPLE_SCALE, SUPERSAMPLE_SCALE);
  fields.forEach((id) => {
    const field = layout.text[id];
    drawLayoutText(offscreenContext, state.text[id], field, state.colors[field.colorKey], layout.horizontalAlign);
  });
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, 0, 0, layout.canvas.width, layout.canvas.height);
  context.restore();
}

export function createInitialState(styleId) {
  const style = LAYOUT.styles[styleId];
  if (!style) throw new Error(`OM 01 不支援的 style：${styleId}。`);
  return {
    text: {
      title: "12/12直播開獎",
      subtitle: "取件最高抽百萬",
      small1: "10/10-12/30下單，在到貨一天內取件限定",
      small2: "百萬獎金均分，詳情依活動規則為準"
    },
    colors: { ...style.defaultColors },
    logoMode: "auto"
  };
}

export async function renderLayoutToCanvas({ styleId, state }) {
  const style = LAYOUT.styles[styleId];
  if (!style) throw new Error(`OM 01 不支援的 style：${styleId}。`);
  await ensureFontsReady(LAYOUT);
  const variant = resolveLogoVariant(state.logoMode, state.colors.background);
  const [background, logo, secondaryLogo] = await Promise.all([
    loadImage(style.backgroundSrc, style.backgroundPlacement, "OM 01 正式底圖"),
    loadImage(LAYOUT.logo.src[variant], LAYOUT.logo.intrinsic, "OM 01 主 Logo"),
    loadImage(LAYOUT.secondaryLogo.src[variant], LAYOUT.secondaryLogo.intrinsic, "OM 01 第二 Logo")
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = LAYOUT.canvas.width;
  canvas.height = LAYOUT.canvas.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法建立 Canvas 2D context。");
  context.fillStyle = state.colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(background, style.backgroundPlacement.x, style.backgroundPlacement.y, style.backgroundPlacement.width, style.backgroundPlacement.height);

  const logoRect = computeContainRect(LAYOUT.logo.box, logo.naturalWidth, logo.naturalHeight, LAYOUT.horizontalAlign);
  const secondaryLogoRect = computeContainRect(LAYOUT.secondaryLogo.box, secondaryLogo.naturalWidth, secondaryLogo.naturalHeight, LAYOUT.horizontalAlign);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(logo, logoRect.x, logoRect.y, logoRect.width, logoRect.height);
  context.drawImage(secondaryLogo, secondaryLogoRect.x, secondaryLogoRect.y, secondaryLogoRect.width, secondaryLogoRect.height);
  context.restore();

  drawSupersampledLayer(context, LAYOUT, state);
  LAYOUT.directFields.forEach((id) => {
    const field = LAYOUT.text[id];
    drawLayoutText(context, state.text[id], field, state.colors[field.colorKey], LAYOUT.horizontalAlign);
  });
  if (canvas.width !== LAYOUT.canvas.width || canvas.height !== LAYOUT.canvas.height) {
    throw new Error("OM 01 renderer 不得修改正式 Canvas 尺寸。");
  }
  return canvas;
}

export { LAYOUT };
