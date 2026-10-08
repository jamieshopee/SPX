// SPX 開獎秀 — 直播 01 renderer

import { LIVE_01_LAYOUT, getLive01Style } from "./layout-01-live-lpbn.js";
import { resolveLogoVariant } from "../../02_OM/js/renderer.js";

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

function fontString(field) {
  return `${field.fontSizePx}px "${FONT_FAMILY[field.family]}"`;
}

function registerFamily(familyKey) {
  if (!familyPromises.has(familyKey)) {
    const promise = (async () => {
      const fontFace = new FontFace(FONT_FAMILY[familyKey], `url("${FONT_SOURCE_URL[familyKey].href}")`);
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
  if (!document.fonts) throw new Error("瀏覽器不支援正式字型載入檢查。");
  const fields = Object.values(layout.text);
  await Promise.all([...new Set(fields.map((field) => field.family))].map(registerFamily));
  const checks = fields.map((field) => fontString(field));
  await Promise.all(checks.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  if (!checks.every((font) => document.fonts.check(font, FONT_TEST_TEXT))) {
    throw new Error("正式字型尚未就緒，已停止直播 01 render。");
  }
}

function loadImage(url, expected, label) {
  const href = url.href;
  if (!assetPromises.has(href)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`${label} 載入失敗。`)), { once: true });
      image.src = href;
    }).then((image) => {
      if (image.naturalWidth !== expected.width || image.naturalHeight !== expected.height) {
        throw new Error(`${label} 尺寸不符。`);
      }
      return image;
    }).catch((error) => {
      assetPromises.delete(href);
      throw error;
    });
    assetPromises.set(href, promise);
  }
  return assetPromises.get(href);
}

function computeContainRect(box, sourceWidth, sourceHeight) {
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return { x: box.x, y: box.y + (box.height - height) / 2, width, height };
}

function drawText(context, text, field, color) {
  if (text === "") return;
  context.font = fontString(field);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(text);
  const inkLeft = -metrics.actualBoundingBoxLeft;
  const inkRight = metrics.actualBoundingBoxRight;
  const inkTop = -metrics.actualBoundingBoxAscent;
  const inkBottom = metrics.actualBoundingBoxDescent;
  const { box } = field;
  const x = field.align === "right" ? box.x + box.width - inkRight : box.x - inkLeft;
  const y = box.y + box.height / 2 - (inkTop + inkBottom) / 2;
  context.fillStyle = color;
  context.fillText(text, x, y);
}

function drawSupersampledTitle(context, layout, text, field, color) {
  if (text === "") return;
  const offscreen = document.createElement("canvas");
  offscreen.width = layout.canvas.width * SUPERSAMPLE_SCALE;
  offscreen.height = layout.canvas.height * SUPERSAMPLE_SCALE;
  const offscreenContext = offscreen.getContext("2d");
  if (!offscreenContext) throw new Error("無法建立直播 01 supersampling Canvas。 ");
  offscreenContext.scale(SUPERSAMPLE_SCALE, SUPERSAMPLE_SCALE);
  drawText(offscreenContext, text, field, color);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, 0, 0, layout.canvas.width, layout.canvas.height);
  context.restore();
}

export function createInitialState(styleId, layout = LIVE_01_LAYOUT) {
  const style = layout.styles[styleId];
  if (!style) throw new Error(`直播 01 不支援的 style：${styleId}。`);
  return {
    text: {
      titleTime: "12/12直播開獎 12:00-12:30",
      subtitle: "取件最高抽百萬",
      warning: "※百萬獎金均分，詳情依活動規則為準"
    },
    colors: { background: style.background, ...style.colors },
    logoMode: "auto"
  };
}

export async function renderLiveToCanvas({ styleId, state, layout = LIVE_01_LAYOUT }) {
  const style = layout.styles[styleId];
  if (!style) throw new Error(`直播 01 不支援的 style：${styleId}。`);
  await ensureFontsReady(layout);
  const placement = style.backgroundPlacement ?? layout.backgroundPlacement;
  const background = await loadImage(style.backgroundSrc, { width: placement.width, height: placement.height }, `${layout.name} 底圖`);
  const logoVariant = resolveLogoVariant(state.logoMode ?? "auto", state.colors.background);
  const logo = await loadImage(LIVE_01_LAYOUT.logo.src[logoVariant], LIVE_01_LAYOUT.logo.intrinsic, `直播 01 ${logoVariant} Logo`);
  const canvas = document.createElement("canvas");
  canvas.width = LIVE_01_LAYOUT.canvas.width;
  canvas.height = LIVE_01_LAYOUT.canvas.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法建立直播 01 Canvas 2D context。");
  context.fillStyle = state.colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(background, placement.x, placement.y, placement.width, placement.height);
  const logoRect = computeContainRect(layout.logo.box, logo.naturalWidth, logo.naturalHeight);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(logo, logoRect.x, logoRect.y, logoRect.width, logoRect.height);
  context.restore();
  drawSupersampledTitle(context, layout, state.text.titleTime, layout.text.titleTime, state.colors.titleTime);
  drawText(context, state.text.subtitle, layout.text.subtitle, state.colors.subtitle);
  drawText(context, state.text.warning, layout.text.warning, state.colors.warning);
  if (canvas.width !== layout.canvas.width || canvas.height !== layout.canvas.height) throw new Error(`${layout.name} Canvas 尺寸不符。`);
  return canvas;
}

export function renderLive01ToCanvas(args) {
  return renderLiveToCanvas({ ...args, layout: LIVE_01_LAYOUT });
}

export function canvasToJpegBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== "image/jpeg") {
        reject(new Error("直播 01 JPG 編碼失敗。"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 1.0);
  });
}
