// 04_POP UP 正式 renderer（580 × 720、PNG）。
// 文字／Logo geometry 與 rendering pattern 依 Jamie 裁決比照 FSS BN D－10（10_POP UP）
// 正式實作（FSS 與快速取件版位編號不同；不是 FSS D－04）：
// 三文字與 Logo 皆為 ink-box／contain 的 水平置中 ＋ 垂直置中。
// Jamie overrides（優先於 FSS）：
// - 副標不沿用 FSS 的 $／% 較小 symbol font（35pt），全字串一律 40pt Bold。
// - 背景卡片高度採 658（Jamie CSS＋對位圖），不採 FSS 的 673。
// - Medium 2× 於 title 與 small 皆空字串時 early-return，不建空 temp canvas。
// - 快速取件無 DPI renderer requirement（DPI 屬 export encoder metadata）。
// 04 為 PNG 版位：Canvas 初始保持透明，不得全畫布填色；
// 背景為圓角卡片（53, 27, 475 × 658、radius 40px）以 Workspace background color 填色，
// 卡片外一律保持 alpha = 0。不得將整個 renderer clip 到卡片（CTA 跨出卡片下緣為正式設計）。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode FSS 文案與顏色。
// 對位圖（assets/對位/04_POP UP.png）只供開發／人工驗證，不是 runtime dependency。
// 依 Jamie 裁決本檔自含必要 helper，不修改、不 import 01～03 renderer；
// 本檔不依賴 UPNG／pako（那是 Export encoder dependency，不是 renderer dependency）。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 580;
const CANVAS_HEIGHT = 720;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// pt 規則（Jamie 裁決）：字級直接沿用 FSS D－10 的 pt 數值，不得人工換算為 px。
const TITLE_FONT = `30pt "${MEDIUM_FAMILY}"`;
// 副標（Jamie 裁決）：所有字元（含 $／%）一律 40pt Bold，無 symbol font。
const SUBTITLE_FONT = `40pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `20pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_FONT
]);

const FONT_TEST_TEXT = "商城優選免運$490%";
const MEDIUM_RENDER_SCALE = 2;

// 正式 layout（Jamie 裁決）：logo／title／subtitle／small 與 FSS D－10 相同；
// backgroundCard／kv／cta 為快速取件 04 專屬正式 geometry（canvas-local；
// 原設計畫板 global 座標經 offset X 1895／Y 0 換算，不得使用 global 座標）。
// 顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  backgroundCard: Object.freeze({ left: 53, top: 27, width: 475, height: 658, radius: 40 }),
  logo: Object.freeze({ left: 129, top: 109, width: 323, height: 46 }),
  title: Object.freeze({ left: 129, top: 172, width: 323, height: 38, font: TITLE_FONT }),
  subtitle: Object.freeze({ left: 85, top: 225, width: 410, height: 51, font: SUBTITLE_FONT }),
  small: Object.freeze({ left: 85, top: 286, width: 410, height: 25, font: SMALL_FONT }),
  kv: Object.freeze({ left: 69, top: 323, width: 442, height: 305 }),
  cta: Object.freeze({ left: 177, top: 640, width: 226, height: 60 })
});

// CTA source intrinsic fail-closed 驗證值（正式 asset 逛逛去CTA.png 為 226 × 60；1:1 繪製）。
const CTA_SOURCE_WIDTH = 226;
const CTA_SOURCE_HEIGHT = 60;

// --- 字型：renderer module 內以 FontFace API 建立 D－10 所需 family 別名 ---
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
    throw new Error(`04 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 04_POP UP render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 04_POP UP render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定 assets：Logo 兩份＋CTA 一份，載入失敗 fail-closed ---

const ASSET_URLS = Object.freeze({
  logoOrange: new URL("../../assets/店到店_橘.png", import.meta.url),
  logoWhite: new URL("../../assets/店到店_白.png", import.meta.url),
  cta: new URL("../../assets/逛逛去CTA.png", import.meta.url)
});

const assetPromises = new Map();

function loadAsset(assetKey) {
  if (!assetPromises.has(assetKey)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(`04 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
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

// --- 背景卡片：圓角矩形 path（radius 40px，Jamie 正式指定值）---
// 以 moveTo／arcTo 手工建立 path（不依賴 ctx.roundRect），只 fill 卡片區域；
// 卡片外不繪製任何像素，Canvas alpha 保持 0。

function drawRoundedBackgroundCard(context, card, fillColor) {
  const { left, top, width, height, radius } = card;
  const right = left + width;
  const bottom = top + height;

  context.save();
  context.beginPath();
  context.moveTo(left + radius, top);
  context.arcTo(right, top, right, bottom, radius);
  context.arcTo(right, bottom, left, bottom, radius);
  context.arcTo(left, bottom, left, top, radius);
  context.arcTo(left, top, right, top, radius);
  context.closePath();
  context.fillStyle = fillColor;
  context.fill();
  context.restore();
}

// --- 圖片繪製：共通 contain 縮放（無 min(1, …) clamp）＋ 水平垂直置中 ---
// scale = min(boxW / srcW, boxH / srcH)；不 stretch、不 crop、不 cover、
// destination 座標不得 round／floor／ceil。

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

// --- 文字繪製：沿用 FSS D－10 正式 ink-box 水平置中 ＋ 垂直置中 pattern ---

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

function drawCenteredText(context, text, box, color) {
  if (text === "") return;

  const run = measureRun(context, text, box.font);
  const inkWidth = run.inkRight - run.inkLeft;
  const x = box.left + (box.width - inkWidth) / 2 - run.inkLeft;
  const y = box.top + box.height / 2 - (run.inkTop + run.inkBottom) / 2;

  context.font = box.font;
  context.fillStyle = color;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText(text, x, y);
}

// Medium 字重（主標＋小字）採 local 2× supersampling（Jamie 裁決之正式 pattern）：
// 於 2×（1160 × 1440）暫存 canvas 以原始 580 × 720 geometry 繪製，
// 再以 high-quality smoothing 縮回正式 Canvas。
// title 與 small 皆空字串時 early-return（沿 01～03，不沿 FSS D－10 的空 canvas 行為）。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 04 Medium 暫存 Canvas 2D context。");
  }

  mediumContext.scale(MEDIUM_RENDER_SCALE, MEDIUM_RENDER_SCALE);
  drawCenteredText(mediumContext, title, LAYOUT.title, titleColor);
  drawCenteredText(mediumContext, small, LAYOUT.small, smallColor);

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
// Draw order（Jamie 裁決）：transparent canvas → rounded background card →
// KV（若存在）→ Logo → Medium layer（主標＋小字）→ Bold layer（副標）→ CTA。
// 不得全畫布填色；不得把整個 renderer clip 到卡片（CTA 跨出卡片下緣為正式設計）。

async function renderPopUp04({ ctx, state }) {
  await ensureFontsReady();

  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const ctaImage = await loadAsset("cta");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // CTA source intrinsic fail-closed 驗證：正式 asset 必須為 226 × 60，1:1 繪製、不縮放。
  if (
    ctaImage.naturalWidth !== CTA_SOURCE_WIDTH ||
    ctaImage.naturalHeight !== CTA_SOURCE_HEIGHT
  ) {
    throw new Error(
      `04 CTA 素材必須為 ${CTA_SOURCE_WIDTH} × ${CTA_SOURCE_HEIGHT}px，已停止 render。`
    );
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1.（transparent canvas）＋ 2. 圓角背景卡片：只 fill 卡片，卡片外保持透明
  drawRoundedBackgroundCard(ctx, LAYOUT.backgroundCard, state.shared.colors.background);

  // 3. KV：contain、no crop、水平＋垂直置中；null 時 KV 區維持卡片背景色，不畫 placeholder
  if (kvImage) {
    drawContainCentered(ctx, kvImage, LAYOUT.kv);
  }

  // 4. Logo：variant 由 Workspace logoMode ＋ background 經 resolveLogoVariant 決定；
  //    contain 後水平＋垂直置中（D－10 正式 positioning）
  drawContainCentered(ctx, logoImage, LAYOUT.logo);

  // 5. Medium layer：主標＋小字（local 2× supersampling、水平＋垂直置中）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 6. Bold layer：副標（全字串含 $／% 一律 40pt Bold、ink-box 水平＋垂直置中）
  drawCenteredText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );

  // 7. CTA：1:1（226 × 60 @ 177, 640；跨出卡片下緣為正式設計，不裁切）
  ctx.drawImage(ctaImage, LAYOUT.cta.left, LAYOUT.cta.top);
}

registerRenderer("04-pop-up", renderPopUp04);

export const POP_UP_04_LAYOUT = LAYOUT;
