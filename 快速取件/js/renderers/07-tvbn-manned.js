// 07_TVBN_有人店 正式 renderer（1599 × 1080、JPG）。
// geometry authority（Jamie 裁決）：Jamie raw CSS ＋ 07 對位圖（六元素以
// artboard offset X 143／Y 1734 唯一互證換算為 canvas-local）。
// FSS D－09（09_SPX TVBN_2，1599×1080）僅作 rendering pattern／encoder 唯讀
// evidence，其 geometry／字級與 07 不同，不得搬入。
// 原設計畫板 raw 座標（202/2013/2150/2252/2373、931/2007、1490/1781）僅為
// 溯源記錄，不得參與 runtime geometry。
// Jamie 裁決：
// - 三文字 ink LEFT ＋ 垂直置中；Photoshop source sizes 85pt／98pt／50pt，
//   依既有 FSS Photoshop-to-Canvas mapping（×0.75）得 Canvas 63.75pt／73.5pt／37.5pt。
// - 副標不沿用 FSS D－09 的 $／% 較小 symbol font（65pt），全字串一律 73.5pt Bold。
// - Medium 2× 於 title 與 small 皆空字串時 early-return。
// - Logo：contain 後「範圍內靠左＋垂直置中」。
// - 右上蝦皮購物（橫式）：contain 後「範圍內靠右＋垂直置中」，intrinsic
//   1119 × 275 gate；與 Logo 共用同一次 resolveLogoVariant 結果同步切換 橘／白。
// - 07 沒有固定底圖（整張填 Workspace background color）、沒有 CTA。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode FSS 文案與顏色。
// 對位圖（assets/對位/07_TVBN_有人店.png）只供開發／人工驗證，不是 runtime dependency。
// 本檔自含必要 helper（沿 06-fb-post.js 已驗證 pattern），不修改、不 import 01～06 renderer。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 1599;
const CANVAS_HEIGHT = 1080;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// 字級（Jamie 核准之 Text Size Correction）：Photoshop source sizes 為
// 85pt／98pt／50pt；依既有 FSS Photoshop-to-Canvas mapping（×0.75）換算為
// Canvas renderer pt：85×0.75=63.75、98×0.75=73.5、50×0.75=37.5。
const TITLE_FONT = `63.75pt "${MEDIUM_FAMILY}"`;
// 副標（Jamie 裁決）：所有字元（含 $／%）一律 73.5pt Bold，無 symbol font。
const SUBTITLE_FONT = `73.5pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `37.5pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_FONT
]);

const FONT_TEST_TEXT = "商城優選免運$490%";
const MEDIUM_RENDER_SCALE = 2;

// 正式 layout（canvas-local；Jamie raw CSS − offset 143/1734，與對位圖逐 px 互證）。
// 顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  logo: Object.freeze({ left: 59, top: 279, width: 640, height: 101 }),
  title: Object.freeze({ left: 59, top: 416, width: 640, height: 78, font: TITLE_FONT }),
  subtitle: Object.freeze({ left: 59, top: 518, width: 690, height: 92, font: SUBTITLE_FONT }),
  small: Object.freeze({ left: 59, top: 639, width: 690, height: 46, font: SMALL_FONT }),
  kv: Object.freeze({ left: 788, top: 273, width: 772, height: 534 }),
  hShopee: Object.freeze({ left: 1347, top: 47, width: 212, height: 52 })
});

// 右上橫式蝦皮購物 source intrinsic fail-closed 驗證值（正式 asset 為 1119 × 275）。
const H_SHOPEE_SOURCE_WIDTH = 1119;
const H_SHOPEE_SOURCE_HEIGHT = 275;

// --- 字型：renderer module 內以 FontFace API 建立所需 family 別名 ---
// 使用 SPX 既有正式 WOFF2（與共通 styles.css 同一組檔案），不修改共通 CSS。
// 載入失敗 fail-closed，不得默默 fallback 系統字型產出正式圖片。

const FONT_SOURCES = Object.freeze([
  Object.freeze({
    family: MEDIUM_FAMILY,
    url: new URL("../../../fonts/ShopeeNotoSans(content)-Medium.woff2", import.meta.url)
  }),
  Object.freeze({
    family: BOLD_FAMILY,
    url: new URL("../../../fonts/ShopeeNotoSans(content)-Bold.woff2", import.meta.url)
  })
]);

let fontRegistrationPromise = null;

function registerFontAliases() {
  fontRegistrationPromise ||= Promise.all(
    FONT_SOURCES.map(async ({ family, url }) => {
      const fontFace = new FontFace(family, `url("${url.href}")`);
      await fontFace.load();
      document.fonts.add(fontFace);
    })
  ).catch((error) => {
    fontRegistrationPromise = null;
    throw new Error(`07 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 07_TVBN_有人店 render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 07_TVBN_有人店 render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定 assets：店到店 Logo 橘／白＋右上橫式蝦皮購物 橘／白（07 沒有 CTA），
// 載入失敗 fail-closed ---

const ASSET_URLS = Object.freeze({
  logoOrange: new URL("../../assets/店到店_橘.png", import.meta.url),
  logoWhite: new URL("../../assets/店到店_白.png", import.meta.url),
  hShopeeOrange: new URL("../../assets/蝦皮購物_橘.png", import.meta.url),
  hShopeeWhite: new URL("../../assets/蝦皮購物_白.png", import.meta.url)
});

const assetPromises = new Map();

function loadAsset(assetKey) {
  if (!assetPromises.has(assetKey)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(`07 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
        { once: true }
      );
      image.src = ASSET_URLS[assetKey].href;
    }).catch((error) => {
      assetPromises.delete(assetKey);
      throw error;
    });
    assetPromises.set(assetKey, promise);
  }
  return assetPromises.get(assetKey);
}

// KV 來自使用者上傳（state.shared.kv.dataUrl），以單一 entry 依 dataUrl 快取 decode 結果。
let kvCache = null;

function loadKvImage(dataUrl) {
  if (kvCache?.dataUrl !== dataUrl) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error("KV 圖片無法解碼。")), { once: true });
      image.src = dataUrl;
    }).catch((error) => {
      if (kvCache?.dataUrl === dataUrl) kvCache = null;
      throw error;
    });
    kvCache = { dataUrl, promise };
  }
  return kvCache.promise;
}

// --- 圖片繪製 ---
// 共通 contain 縮放：scale = min(boxW / srcW, boxH / srcH)（無 min(1, …) clamp）；
// 不 stretch、不 crop、不 cover、destination 座標不得 round／floor／ceil。

// KV 用：contain ＋ 水平垂直置中（快速取件正式 KV contract）。
function drawContainCentered(context, image, box) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const destinationWidth = sourceWidth * scale;
  const destinationHeight = sourceHeight * scale;
  const destinationX = box.left + (box.width - destinationWidth) / 2;
  const destinationY = box.top + (box.height - destinationHeight) / 2;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    0,
    0,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight
  );
  context.restore();
}

// Logo 用（Jamie 裁決）：contain 縮放後，範圍內靠左＋垂直置中。
function drawContainLeftVCenter(context, image, box) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const destinationWidth = sourceWidth * scale;
  const destinationHeight = sourceHeight * scale;
  const destinationX = box.left;
  const destinationY = box.top + (box.height - destinationHeight) / 2;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    0,
    0,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight
  );
  context.restore();
}

// 右上橫式蝦皮購物用（Jamie 裁決）：contain 縮放後，範圍內靠右＋垂直置中。
// destinationX = box.left + box.width − destinationWidth（不 round）。
function drawContainRightVCenter(context, image, box) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const destinationWidth = sourceWidth * scale;
  const destinationHeight = sourceHeight * scale;
  const destinationX = box.left + box.width - destinationWidth;
  const destinationY = box.top + (box.height - destinationHeight) / 2;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    0,
    0,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight
  );
  context.restore();
}

// --- 文字繪製：ink-box LEFT ＋ 垂直置中（沿 03／06 已驗證 pattern）---

function measureRun(context, text, font) {
  context.font = font;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(text);

  return {
    text,
    font,
    advanceWidth: metrics.width,
    inkLeft: -metrics.actualBoundingBoxLeft,
    inkRight: metrics.actualBoundingBoxRight,
    inkTop: -metrics.actualBoundingBoxAscent,
    inkBottom: metrics.actualBoundingBoxDescent,
    x: 0,
    y: 0
  };
}

function drawLeftVCenterText(context, text, box, color) {
  if (text === "") return;

  const run = measureRun(context, text, box.font);
  const x = box.left - run.inkLeft;
  const y = box.top + box.height / 2 - (run.inkTop + run.inkBottom) / 2;

  context.font = box.font;
  context.fillStyle = color;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText(text, x, y);
}

// Medium 字重（主標＋小字）採 renderer-local 2× supersampling（Jamie 裁決）：
// 於 2×（3198 × 2160）暫存 canvas 以原始 1599 × 1080 logical geometry 與
// 原始 pt 字級繪製（2× 完全由 context.scale(2, 2) 處理，不得手動放大字級），
// 再以 high-quality smoothing 縮回正式 Canvas。
// title 與 small 皆空字串時 early-return。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 07 Medium 暫存 Canvas 2D context。");
  }

  mediumContext.scale(MEDIUM_RENDER_SCALE, MEDIUM_RENDER_SCALE);
  drawLeftVCenterText(mediumContext, title, LAYOUT.title, titleColor);
  drawLeftVCenterText(mediumContext, small, LAYOUT.small, smallColor);

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    mediumCanvas,
    0,
    0,
    mediumCanvas.width,
    mediumCanvas.height,
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  context.restore();
}

// --- 正式 renderer ---
// Draw order（Jamie 裁決）：Workspace background → KV（若存在）→ 店到店 Logo →
// Medium layer（主標＋小字）→ Bold layer（副標，直繪）→ 右上橫式蝦皮購物。
// 07 沒有 CTA。source-over、globalAlpha = 1、無 clipping／masking。

async function renderTvbnManned07({ ctx, state }) {
  await ensureFontsReady();

  // variant 只解算一次：同一結果同時決定店到店 Logo 與右上橫式蝦皮購物。
  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const hShopeeImage = await loadAsset(variant === "orange" ? "hShopeeOrange" : "hShopeeWhite");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // 右上橫式蝦皮購物 intrinsic fail-closed 驗證：正式 asset 必須為 1119 × 275。
  if (
    hShopeeImage.naturalWidth !== H_SHOPEE_SOURCE_WIDTH ||
    hShopeeImage.naturalHeight !== H_SHOPEE_SOURCE_HEIGHT
  ) {
    throw new Error(
      `07 右上蝦皮購物素材必須為 ${H_SHOPEE_SOURCE_WIDTH} × ${H_SHOPEE_SOURCE_HEIGHT}px，已停止 render。`
    );
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1. Workspace background（無固定底圖，整張填色）
  ctx.fillStyle = state.shared.colors.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. KV：contain、no crop、水平＋垂直置中；null 時 KV 區維持背景色，不畫 placeholder
  if (kvImage) {
    drawContainCentered(ctx, kvImage, LAYOUT.kv);
  }

  // 3. 店到店 Logo：contain 後範圍內靠左＋垂直置中（Jamie 裁決）
  drawContainLeftVCenter(ctx, logoImage, LAYOUT.logo);

  // 4. Medium layer：主標＋小字（local 2× supersampling、LEFT ＋ 垂直置中）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 5. Bold layer：副標（全字串含 $／% 一律 73.5pt Bold、ink LEFT ＋ 垂直置中、直繪）
  drawLeftVCenterText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );

  // 6. 右上橫式蝦皮購物：contain 後範圍內靠右＋垂直置中（Jamie 裁決），
  //    與 Logo 同一 variant
  drawContainRightVCenter(ctx, hShopeeImage, LAYOUT.hShopee);
}

registerRenderer("07-tvbn-manned", renderTvbnManned07);

export const TVBN_MANNED_07_LAYOUT = LAYOUT;
