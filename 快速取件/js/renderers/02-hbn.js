// 02_HBN 正式 renderer（1200 × 360、JPG）。
// 文字／Logo geometry 與 rendering pattern 依 Jamie 裁決比照 FSS BN D－02 正式實作：
// 三文字與 Logo 皆為 ink-box／contain 的 LEFT + TOP 對齊（與 01 的置中不同）。
// 例外（快速取件正式 override）：副標不沿用 FSS 的 $／% 較小 symbol font，
// 全字串（含 $／%）一律 45pt Bold，無特殊 baseline alignment。
// CTA 為 02 per-item override：source 139 × 44 → 正式 destination 140 × 44 貼左（Jamie 裁決）。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode FSS 文案與顏色。
// 快速取件 02 沒有固定底圖：背景以 Workspace background color 填滿整張 Canvas。
// 對位圖（assets/對位/02_HBN.png）只供開發／人工驗證，不是 runtime dependency。
// 依 Jamie 裁決本檔自含必要 helper，不修改、不 import 01 renderer。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 360;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// pt 規則（Jamie 裁決）：字級直接沿用 FSS D－02 的 pt 數值，不得人工換算為 px
//（不做 30pt × 96 / 72 之類的換算）；pt 由瀏覽器原生解析。
const TITLE_FONT = `30pt "${MEDIUM_FAMILY}"`;
// 副標（Jamie 裁決）：所有字元（含 $／%）一律 45pt Bold，無 symbol font。
const SUBTITLE_FONT = `45pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `18pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_FONT
]);

const FONT_TEST_TEXT = "商城優選免運$490%";
const MEDIUM_RENDER_SCALE = 2;

// 正式 layout（Jamie 裁決）：logo／title／subtitle／small 與 FSS D－02 相同；
// kv 與 cta 為快速取件 02 專屬正式 geometry（canvas-local，畫板 offset 613 已扣除，
// 不得使用原設計畫板 global 座標 1179／1651）。顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  logo: Object.freeze({ left: 98, top: 96, width: 351, height: 50 }),
  title: Object.freeze({ left: 98, top: 153, width: 351, height: 37, font: TITLE_FONT }),
  subtitle: Object.freeze({ left: 98, top: 200, width: 445, height: 57, font: SUBTITLE_FONT }),
  small: Object.freeze({ left: 98, top: 273, width: 445, height: 22, font: SMALL_FONT }),
  kv: Object.freeze({ left: 566, top: 20, width: 460, height: 319 }),
  cta: Object.freeze({ left: 1038, top: 290, width: 140, height: 44 })
});

// CTA source intrinsic fail-closed 驗證值（正式 asset 看更多CTA.png 為 139 × 44）。
const CTA_SOURCE_WIDTH = 139;
const CTA_SOURCE_HEIGHT = 44;

// --- 字型：renderer module 內以 FontFace API 建立 D－02 所需 family 別名 ---
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
    throw new Error(`02 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 02_HBN render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 02_HBN render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定 assets：只使用快速取件既有正式素材，載入失敗 fail-closed ---

const ASSET_URLS = Object.freeze({
  logoOrange: new URL("../../assets/店到店_橘.png", import.meta.url),
  logoWhite: new URL("../../assets/店到店_白.png", import.meta.url),
  cta: new URL("../../assets/看更多CTA.png", import.meta.url)
});

const assetPromises = new Map();

function loadAsset(assetKey) {
  if (!assetPromises.has(assetKey)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(`02 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
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
// 共同規則：contain 等比縮放（scale = min(boxW / srcW, boxH / srcH)）、
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

// Logo 用（D－02 正式 positioning）：contain ＋ 貼 box 左上。
// 02 與 01 不同：不套用 01 的水平置中公式，destinationX＝box.left、destinationY＝box.top。
function drawContainLeftTop(context, image, box) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const destinationWidth = sourceWidth * scale;
  const destinationHeight = sourceHeight * scale;
  const destinationX = box.left;
  const destinationY = box.top;

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

// --- 文字繪製：沿用 FSS D－02 正式 ink-box LEFT + TOP pattern（非 01 的置中）---

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

function drawLeftTopText(context, text, box, color) {
  if (text === "") return;

  const run = measureRun(context, text, box.font);
  const x = box.left - run.inkLeft;
  const y = box.top - run.inkTop;

  context.font = box.font;
  context.fillStyle = color;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText(text, x, y);
}

// Medium 字重（主標＋小字）採 local 2× supersampling（Jamie 裁決之正式 pattern）：
// 於 2×（2400 × 720）暫存 canvas 以原始 1200 × 360 geometry 繪製，
// 再以 high-quality smoothing 縮回正式 Canvas。
// title 與 small 皆空字串時 early-return（沿 01，不沿 FSS D－02 的空 canvas 行為）。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 02 Medium 暫存 Canvas 2D context。");
  }

  mediumContext.scale(MEDIUM_RENDER_SCALE, MEDIUM_RENDER_SCALE);
  drawLeftTopText(mediumContext, title, LAYOUT.title, titleColor);
  drawLeftTopText(mediumContext, small, LAYOUT.small, smallColor);

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
// Draw order（Jamie 裁決）：background → KV（若存在）→ Logo →
// Medium layer（主標＋小字）→ Bold layer（副標）→ CTA。

async function renderHbn02({ ctx, state }) {
  await ensureFontsReady();

  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const ctaImage = await loadAsset("cta");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // CTA source intrinsic fail-closed 驗證：正式 asset 必須為 139 × 44。
  // 02 per-item override（Jamie 裁決）：destination 為正式 box 140 × 44 貼左，
  // 允許 139 → 140 的 1px 水平 destination scaling；不得改回 1:1、不得置中、不得移動 x。
  if (
    ctaImage.naturalWidth !== CTA_SOURCE_WIDTH ||
    ctaImage.naturalHeight !== CTA_SOURCE_HEIGHT
  ) {
    throw new Error(
      `02 CTA 素材必須為 ${CTA_SOURCE_WIDTH} × ${CTA_SOURCE_HEIGHT}px，已停止 render。`
    );
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1. Workspace background（無固定底圖）
  ctx.fillStyle = state.shared.colors.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. KV：contain、no crop、水平＋垂直置中；null 時 KV 區維持背景色，不畫 placeholder
  if (kvImage) {
    drawContainCentered(ctx, kvImage, LAYOUT.kv);
  }

  // 3. Logo：variant 由 Workspace logoMode ＋ background 經 resolveLogoVariant 決定；
  //    contain 後貼 box 左上（D－02 正式 positioning，非 01 的水平置中）
  drawContainLeftTop(ctx, logoImage, LAYOUT.logo);

  // 4. Medium layer：主標＋小字（local 2× supersampling、LEFT + TOP）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 5. Bold layer：副標（全字串含 $／% 一律 45pt Bold、ink-box LEFT + TOP）
  drawLeftTopText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );

  // 6. CTA：source 139 × 44 → destination (1038, 290, 140 × 44) 貼左
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    ctaImage,
    0,
    0,
    CTA_SOURCE_WIDTH,
    CTA_SOURCE_HEIGHT,
    LAYOUT.cta.left,
    LAYOUT.cta.top,
    LAYOUT.cta.width,
    LAYOUT.cta.height
  );
  ctx.restore();
}

registerRenderer("02-hbn", renderHbn02);

export const HBN_02_LAYOUT = LAYOUT;
