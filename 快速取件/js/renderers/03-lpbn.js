// 03_LPBN 正式 renderer（1200 × 550、JPG）。
// 文字／Logo geometry 與 rendering pattern 依 Jamie 裁決比照 FSS BN D－12（12_LPBN）
// 正式實作（FSS 與快速取件版位編號不同；不是 FSS D－03 Coin page BN）：
// 三文字為 ink-box LEFT ＋ 垂直置中；Logo 為 contain 後貼左＋垂直置中。
// Jamie overrides（優先於 FSS）：
// - 副標不沿用 FSS 的 $／% 較小 symbol font（42pt），全字串一律 49pt Bold。
// - Logo 縮放不採 FSS D－12 的 min(1, …) source upscale clamp，用共通 contain。
// - Medium 2× 於 title 與 small 皆空字串時 early-return，不建空 temp canvas。
// - 快速取件 03 沒有固定底圖：背景以 Workspace background color 填滿。
// - 快速取件無 DPI requirement。
// 03 正式規格沒有 CTA：本檔不得載入 CTA asset、不得建立 CTA geometry／繪製／驗證。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode FSS 文案與顏色。
// 對位圖（assets/對位/03_LPBN.png）只供開發／人工驗證，不是 runtime dependency。
// 依 Jamie 裁決本檔自含必要 helper，不修改、不 import 01／02 renderer。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 550;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// pt 規則（Jamie 裁決）：字級直接沿用 FSS D－12 的 pt 數值，不得人工換算為 px，
// 22.5pt 必須精確保留（不取整、不換算）。pt 由瀏覽器原生解析。
const TITLE_FONT = `39pt "${MEDIUM_FAMILY}"`;
// 副標（Jamie 裁決）：所有字元（含 $／%）一律 49pt Bold，無 symbol font。
const SUBTITLE_FONT = `49pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `22.5pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_FONT
]);

const FONT_TEST_TEXT = "商城優選免運$490%";
const MEDIUM_RENDER_SCALE = 2;

// 正式 layout（Jamie 裁決）：logo／title／subtitle／small 與 FSS D－12 相同；
// kv 為快速取件 03 專屬正式 geometry（canvas-local；原設計畫板 global (1160, 490)
// 經 offset X 613／Y 429 換算，不得使用 global 座標）。03 沒有 CTA。
// 顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  logo: Object.freeze({ left: 58, top: 161, width: 365, height: 52 }),
  title: Object.freeze({ left: 58, top: 226, width: 405, height: 49, font: TITLE_FONT }),
  subtitle: Object.freeze({ left: 58, top: 285, width: 475, height: 62, font: SUBTITLE_FONT }),
  small: Object.freeze({ left: 58, top: 360, width: 475, height: 28, font: SMALL_FONT }),
  kv: Object.freeze({ left: 547, top: 61, width: 625, height: 432 })
});

// --- 字型：renderer module 內以 FontFace API 建立 D－12 所需 family 別名 ---
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
    throw new Error(`03 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 03_LPBN render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 03_LPBN render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定 assets：03 只使用 Logo 兩份正式素材（03 沒有 CTA），載入失敗 fail-closed ---

const ASSET_URLS = Object.freeze({
  logoOrange: new URL("../../assets/店到店_橘.png", import.meta.url),
  logoWhite: new URL("../../assets/店到店_白.png", import.meta.url)
});

const assetPromises = new Map();

function loadAsset(assetKey) {
  if (!assetPromises.has(assetKey)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(`03 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
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
// 共通 contain scaling（Jamie 裁決，與 01／02 相同）：
// scale = min(boxW / srcW, boxH / srcH)；03 不採 FSS D－12 的 min(1, …) clamp，
// 無 source upscale 上限。不 stretch、不 crop、不 cover、
// destination 座標不得 round／floor／ceil。

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

// Logo 用（03 專屬 alignment）：共通 contain 縮放後，水平貼左、垂直置中。
// destinationX＝box.left；destinationY＝box.top + (box.height − destH) / 2。
// 不套用 01 的水平置中，也不套用 02 的垂直貼上。
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

// --- 文字繪製：沿用 FSS D－12 正式 ink-box LEFT ＋ 垂直置中 pattern ---

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

// Medium 字重（主標＋小字）採 local 2× supersampling（Jamie 裁決之正式 pattern）：
// 於 2×（2400 × 1100）暫存 canvas 以原始 1200 × 550 geometry 繪製，
// 再以 high-quality smoothing 縮回正式 Canvas。
// title 與 small 皆空字串時 early-return（沿 01／02，不沿 FSS D－12 的空 canvas 行為）。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 03 Medium 暫存 Canvas 2D context。");
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
// Draw order（Jamie 裁決）：background → KV（若存在）→ Logo →
// Medium layer（主標＋小字）→ Bold layer（副標）。03 沒有 CTA，無第六層。

async function renderLpbn03({ ctx, state }) {
  await ensureFontsReady();

  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

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
  //    共通 contain 縮放後貼左＋垂直置中（03 專屬 alignment）
  drawContainLeftVCenter(ctx, logoImage, LAYOUT.logo);

  // 4. Medium layer：主標＋小字（local 2× supersampling、LEFT ＋ 垂直置中）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 5. Bold layer：副標（全字串含 $／% 一律 49pt Bold、ink-box LEFT ＋ 垂直置中）
  drawLeftVCenterText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );
}

registerRenderer("03-lpbn", renderLpbn03);

export const LPBN_03_LAYOUT = LAYOUT;
