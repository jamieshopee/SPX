// SPX 開獎秀 — 直播 01 renderer

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";
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
  const inkWidth = inkRight - inkLeft;
  const x = field.align === "right"
    ? box.x + box.width - inkRight
    : field.align === "center"
      ? box.x + (box.width - inkWidth) / 2 - inkLeft
      : box.x - inkLeft;
  const y = box.y + box.height / 2 - (inkTop + inkBottom) / 2;
  context.fillStyle = color;
  context.fillText(text, x, y);
}

function getTextMetrics(context, text, field) {
  context.font = fontString(field);
  return context.measureText(text);
}

function getInkWidth(metrics) {
  return metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft;
}

function validateTextWidth(context, text, field, maxWidth) {
  if (text === "" || !maxWidth) return;
  const width = getInkWidth(getTextMetrics(context, text, field));
  if (width > maxWidth) {
    throw new Error(`${field.label} 寬度超過可用範圍。`);
  }
}

function getStepField(row, kind) {
  return {
    fontSizePx: kind === "big" ? row.bigFontSizePx : row.smallFontSizePx,
    family: kind === "big" ? row.bigFamily : row.smallFamily,
    label: row.label
  };
}

function getStepKind(row, text) {
  let units = 0;
  for (const character of String(text ?? "")) {
    units += /\p{Script=Han}/u.test(character) ? 1 : 0.5;
  }
  if (units > row.limit) throw new Error(`${row.label}超過 ${row.limit} 字限制。`);
  return units <= row.bigLimit ? "big" : "small";
}

function drawStepGroup(context, layout, state, group) {
  const active = group.rows
    .map((row) => ({ row, text: state.text.steps[group.id][row.id] ?? "" }))
    .filter(({ text }) => text !== "")
    .map(({ row, text }) => ({ row, text, kind: getStepKind(row, text) }));
  if (active.length === 0) return;

  const lines = active.map(({ row, text, kind }) => {
    const field = getStepField(row, kind);
    const metrics = getTextMetrics(context, text, field);
    const inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    return { row, text, kind, field, metrics, inkHeight };
  });
  const gaps = lines.slice(0, -1).map((line, index) => {
    const next = lines[index + 1];
    if (group.id === "step2" && index === 0 && line.kind === "big" && next.kind === "big") {
      return 7;
    }
    if (line.kind === "big" && next.kind === "big") {
      return Math.max(0, layout.cardTypography.bigBaselineInterval - line.metrics.actualBoundingBoxDescent - next.metrics.actualBoundingBoxAscent);
    }
    const gapKey = `${line.kind}${next.kind === "big" ? "Big" : "Small"}`;
    const gap = layout.cardTypography.inkGaps[gapKey] ?? layout.cardTypography.inkGaps.smallSmall;
    return group.id === "step2" && index === 1 && line.kind === "big" && next.kind === "small" ? 14 : gap;
  });
  const groupHeight = lines.reduce((sum, line) => sum + line.inkHeight, 0) + gaps.reduce((sum, gap) => sum + gap, 0);
  const top = group.safeBox.y + (group.safeBox.height - groupHeight) / 2;
  const drawLine = (line, baseline) => {
    context.font = fontString(line.field);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    const inkLeft = -line.metrics.actualBoundingBoxLeft;
    const inkWidth = getInkWidth(line.metrics);
    const x = group.safeBox.x + (group.safeBox.width - inkWidth) / 2 - inkLeft;
    context.fillStyle = state.colors[line.kind === "big" ? "stepBig" : "stepSmall"];
    context.fillText(line.text, x, baseline);
  };

  let cursor = top;
  lines.forEach((line, index) => {
    drawLine(line, cursor + line.metrics.actualBoundingBoxAscent);
    cursor += line.inkHeight + (gaps[index] ?? 0);
  });
}

function validateStepGroups(context, layout, state) {
  if (!layout.stepGroups) return;
  layout.stepGroups.forEach((group) => {
    group.rows.forEach((row) => {
      const text = state.text.steps[group.id][row.id] ?? "";
      if (text === "") return;
      const kind = getStepKind(row, text);
      validateTextWidth(context, text, getStepField(row, kind), group.safeBox.width);
    });
  });
}

export function validateLiveTextState(layout, state) {
  const measureCanvas = document.createElement("canvas");
  const context = measureCanvas.getContext("2d");
  if (!context) throw new Error("無法建立文字寬度檢查 Canvas。");
  Object.values(layout.text).forEach((field) => validateTextWidth(context, state.text[field.id] ?? "", field, field.maxWidth));
  validateStepGroups(context, layout, state);
  return true;
}

function drawSupersampledField(context, layout, text, field, color) {
  if (text === "") return;
  const offscreen = document.createElement("canvas");
  offscreen.width = layout.canvas.width * SUPERSAMPLE_SCALE;
  offscreen.height = layout.canvas.height * SUPERSAMPLE_SCALE;
  const offscreenContext = offscreen.getContext("2d");
  if (!offscreenContext) throw new Error(`無法建立 ${layout.name} supersampling Canvas。`);
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
  if (!style) throw new Error(`${layout.name} 不支援的 style：${styleId}。`);
  const defaultText = layout.defaultText ?? {
    titleTime: "12/12直播開獎 12:00-12:30",
    subtitle: "取件最高抽百萬",
    warning: "※百萬獎金均分，詳情依活動規則為準"
  };
  const defaultColors = style.defaultColors ?? { background: style.background, ...style.colors };
  const text = Object.fromEntries(Object.entries(defaultText).map(([key, value]) => [
    key,
    value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([nestedKey, nestedValue]) => [nestedKey, { ...nestedValue }])) : value
  ]));
  return {
    text,
    colors: { ...defaultColors },
    logoMode: "auto"
  };
}

export async function renderLiveToCanvas({ styleId, state, layout = LIVE_01_LAYOUT }) {
  const style = layout.styles[styleId];
  if (!style) throw new Error(`${layout.name} 不支援的 style：${styleId}。`);
  await ensureFontsReady(layout);
  const placement = style.backgroundPlacement ?? layout.backgroundPlacement;
  const background = await loadImage(style.backgroundSrc, { width: placement.width, height: placement.height }, `${layout.name} 底圖`);
  const logoVariant = resolveLogoVariant(state.logoMode ?? "auto", state.colors.background);
  const logo = await loadImage(layout.logo.src[logoVariant], layout.logo.intrinsic, `${layout.name} ${logoVariant} Logo`);
  const secondaryLogo = layout.secondaryLogo
    ? await loadImage(layout.secondaryLogo.src[logoVariant], layout.secondaryLogo.intrinsic, `${layout.name} ${logoVariant} 次 Logo`)
    : null;
  const canvas = document.createElement("canvas");
  canvas.width = layout.canvas.width;
  canvas.height = layout.canvas.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`瀏覽器無法建立 ${layout.name} Canvas 2D context。`);
  validateLiveTextState(layout, state);
  context.fillStyle = state.colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(background, placement.x, placement.y, placement.width, placement.height);
  const logoRect = computeContainRect(layout.logo.box, logo.naturalWidth, logo.naturalHeight);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(logo, logoRect.x, logoRect.y, logoRect.width, logoRect.height);
  if (secondaryLogo) {
    const secondaryLogoRect = computeContainRect(layout.secondaryLogo.box, secondaryLogo.naturalWidth, secondaryLogo.naturalHeight);
    context.drawImage(secondaryLogo, secondaryLogoRect.x, secondaryLogoRect.y, secondaryLogoRect.width, secondaryLogoRect.height);
  }
  context.restore();
  layout.textOrder.forEach((id) => {
    const field = layout.text[id];
    const color = state.colors[field.colorKey];
    if (field.rendering === "supersampled") {
      drawSupersampledField(context, layout, state.text[id], field, color);
    } else {
      drawText(context, state.text[id], field, color);
    }
  });
  layout.stepGroups?.forEach((group) => drawStepGroup(context, layout, state, group));
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
