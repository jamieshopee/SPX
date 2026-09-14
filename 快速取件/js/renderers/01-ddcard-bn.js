// 01_DDcard BN 正式 renderer（531 × 792、JPG）。
// 文字／Logo geometry 與 rendering pattern 依 Jamie 裁決比照 FSS BN D－01 正式實作；
// 例外（Jamie 最終裁決）：副標不沿用 FSS 的 $／% 較小 symbol font，
// 全字串（含 $／%）一律 45pt Bold，無特殊 baseline alignment。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode FSS 文案與顏色。
// 快速取件 01 沒有固定底圖：背景以 Workspace background color 填滿整張 Canvas。
// 對位圖（assets/對位/01_DDcard BN.png）只供開發／人工驗證，不是 runtime dependency。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 531;
const CANVAS_HEIGHT = 792;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// pt 規則（Jamie 裁決）：字級直接沿用 FSS D－01 的 pt 數值，不得人工換算為 px
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

// 正式 layout（Jamie 裁決）：logo／title／subtitle／small 與 FSS D－01 相同；
// kv 與 cta 為快速取件 01 專屬正式 geometry。顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  logo: Object.freeze({ left: 90, top: 103, width: 351, height: 50 }),
  title: Object.freeze({ left: 90, top: 170, width: 351, height: 37, font: TITLE_FONT }),
  subtitle: Object.freeze({
    left: 43,
    top: 221,
    width: 445,
    height: 57,
    font: SUBTITLE_FONT
  }),
  small: Object.freeze({ left: 43, top: 296, width: 445, height: 22, font: SMALL_FONT }),
  kv: Object.freeze({ left: 25, top: 329, width: 482, height: 333 }),
  cta: Object.freeze({ left: 196, top: 675, width: 139, height: 44 })
});

// --- 字型：renderer module 內以 FontFace API 建立 D－01 所需 family 別名 ---
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
    throw new Error(`01 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 01_DDcard BN render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 01_DDcard BN render。");
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
        () => reject(new Error(`01 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
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

// --- 圖片繪製：contain 等比縮放＋水平垂直置中（D－01 正式 positioning pattern）---
// scale = min(boxW / srcW, boxH / srcH)；不 stretch、不 crop、不 cover；
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

// --- 文字繪製：沿用 FSS D－01 正式 ink-box centering pattern ---

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

// Medium 字重（主標＋小字）採 local 2× supersampling（Jamie 裁決之 D－01 正式 pattern）：
// 於 2× 暫存 canvas 以原 geometry 繪製，再以 high-quality smoothing 縮回正式 Canvas。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 01 Medium 暫存 Canvas 2D context。");
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
// Draw order（Jamie 裁決）：background → KV（若存在）→ Logo →
// Medium layer（主標＋小字）→ Bold layer（副標）→ CTA。

async function renderDdcardBn01({ ctx, state }) {
  await ensureFontsReady();

  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const ctaImage = await loadAsset("cta");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // CTA 為 139 × 44 正式 asset 的 1:1 繪製；尺寸不符即 fail-closed，不縮放、不重畫。
  if (
    ctaImage.naturalWidth !== LAYOUT.cta.width ||
    ctaImage.naturalHeight !== LAYOUT.cta.height
  ) {
    throw new Error(
      `01 CTA 素材必須為 ${LAYOUT.cta.width} × ${LAYOUT.cta.height}px，無法 1:1 繪製。`
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

  // 3. Logo：variant 由 Workspace logoMode ＋ background 經 resolveLogoVariant 決定
  drawContainCentered(ctx, logoImage, LAYOUT.logo);

  // 4. Medium layer：主標＋小字（local 2× supersampling）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 5. Bold layer：副標（全字串含 $／% 一律 45pt Bold，ink-box centering）
  drawCenteredText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );

  // 6. CTA：1:1
  ctx.drawImage(ctaImage, LAYOUT.cta.left, LAYOUT.cta.top);
}

registerRenderer("01-ddcard-bn", renderDdcardBn01);

export const DDCARD_BN_01_LAYOUT = LAYOUT;
