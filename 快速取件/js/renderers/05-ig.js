// 05_IG 正式 renderer（900 × 1600、JPG）。
// 文字／Logo geometry 與 rendering pattern 依 Jamie 裁決比照 FSS BN D－06（06_IG）
// 正式實作（FSS 與快速取件版位編號不同；不是 FSS D－05）：
// 三文字與 Logo 皆為 ink-box／contain 的 水平置中 ＋ 垂直置中。
// Group shift（Jamie 裁決之正式 geometry evidence）：Logo／Title／Subtitle／Small
// 相對 FSS D－06 整組 ΔX = 0、ΔY = +96、w/h 不變（282→378、387→483、472→568、573→669）。
// Jamie overrides（優先於 FSS）：
// - 副標不沿用 FSS 的 $／% 較小 symbol font（55pt），全字串一律 65pt Bold。
// - Medium 2× 於 title 與 small 皆空字串時 early-return。
// - 快速取件 05 沒有固定底圖：整張 canvas 以 Workspace background color 填滿。
// - 05 沒有 CTA。
// 右上「IG 蝦皮購物.png」為固定 renderer asset：永遠原圖 1:1，
// 不受 Logo mode／background luminance 影響，無 Workspace state、無 Viewer control。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode FSS 文案與顏色。
// 對位圖（assets/對位/05_IG.png）只供開發／人工驗證，不是 runtime dependency。
// 依 Jamie 裁決本檔自含必要 helper，不修改、不 import 01～04 renderer。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1600;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// pt 規則（Jamie 裁決）：字級直接沿用 FSS D－06 的 pt 數值，不得人工換算為 px，
// 52.5pt 必須精確保留（不取整、不換算）。pt 由瀏覽器原生解析。
const TITLE_FONT = `52.5pt "${MEDIUM_FAMILY}"`;
// 副標（Jamie 裁決）：所有字元（含 $／%）一律 65pt Bold，無 symbol font。
const SUBTITLE_FONT = `65pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `30pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_FONT
]);

const FONT_TEST_TEXT = "商城優選免運$490%";
const MEDIUM_RENDER_SCALE = 2;

// 正式 layout（Jamie 裁決）：logo／title／subtitle／small ＝ FSS D－06 ＋ ΔY 96；
// kv 與 igShopee 為快速取件 05 專屬正式 geometry（canvas-local；原設計畫板
// global 座標經 artboard offset X 2700／Y 0 換算，不得使用 global 座標）。
// 顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  logo: Object.freeze({ left: 161, top: 378, width: 580, height: 82 }),
  title: Object.freeze({ left: 175, top: 483, width: 550, height: 65, font: TITLE_FONT }),
  subtitle: Object.freeze({ left: 136, top: 568, width: 630, height: 82, font: SUBTITLE_FONT }),
  small: Object.freeze({ left: 136, top: 669, width: 630, height: 37, font: SMALL_FONT }),
  kv: Object.freeze({ left: 24, top: 783, width: 851, height: 588 }),
  igShopee: Object.freeze({ left: 739, top: 119, width: 161, height: 162 })
});

// 右上 IG 蝦皮購物 source intrinsic fail-closed 驗證值（正式 asset 為 161 × 162；1:1 繪製）。
const IG_SHOPEE_SOURCE_WIDTH = 161;
const IG_SHOPEE_SOURCE_HEIGHT = 162;

// --- 字型：renderer module 內以 FontFace API 建立 D－06 所需 family 別名 ---
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
    throw new Error(`05 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 05_IG render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 05_IG render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定 assets：店到店 Logo 兩份＋右上 IG 蝦皮購物一份（05 沒有 CTA），
// 載入失敗 fail-closed ---

const ASSET_URLS = Object.freeze({
  logoOrange: new URL("../../assets/店到店_橘.png", import.meta.url),
  logoWhite: new URL("../../assets/店到店_白.png", import.meta.url),
  igShopee: new URL("../../assets/IG 蝦皮購物.png", import.meta.url)
});

const assetPromises = new Map();

function loadAsset(assetKey) {
  if (!assetPromises.has(assetKey)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(`05 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
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

// --- 圖片繪製：共通 contain 縮放（無 min(1, …) clamp）＋ 水平垂直置中 ---
// scale = min(boxW / srcW, boxH / srcH)；不 stretch、不 crop、不 cover、
// destination 座標不得 round／floor／ceil。Logo 與 KV 共用。

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

// --- 文字繪製：沿用 FSS D－06 正式 ink-box 水平置中 ＋ 垂直置中 pattern ---

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
// 於 2×（1800 × 3200）暫存 canvas 以原始 900 × 1600 geometry 繪製，
// 再以 high-quality smoothing 縮回正式 Canvas。
// title 與 small 皆空字串時 early-return（沿 01～04，不沿 FSS D－06 的空 canvas 行為）。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 05 Medium 暫存 Canvas 2D context。");
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
// Draw order（Jamie 裁決）：Workspace background → KV（若存在）→ 店到店 Logo →
// Medium layer（主標＋小字）→ Bold layer（副標）→ 右上 IG 蝦皮購物（1:1）。
// 05 沒有 CTA。不建立 clipping region。

async function renderIg05({ ctx, state }) {
  await ensureFontsReady();

  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const igShopeeImage = await loadAsset("igShopee");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // 右上 IG 蝦皮購物 intrinsic fail-closed 驗證：正式 asset 必須為 161 × 162，1:1 繪製。
  if (
    igShopeeImage.naturalWidth !== IG_SHOPEE_SOURCE_WIDTH ||
    igShopeeImage.naturalHeight !== IG_SHOPEE_SOURCE_HEIGHT
  ) {
    throw new Error(
      `05 右上蝦皮購物素材必須為 ${IG_SHOPEE_SOURCE_WIDTH} × ${IG_SHOPEE_SOURCE_HEIGHT}px，已停止 render。`
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

  // 3. 店到店 Logo：variant 由 Workspace logoMode ＋ background 經 resolveLogoVariant 決定；
  //    contain 後水平＋垂直置中（D－06 正式 positioning）
  drawContainCentered(ctx, logoImage, LAYOUT.logo);

  // 4. Medium layer：主標＋小字（local 2× supersampling、水平＋垂直置中）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 5. Bold layer：副標（全字串含 $／% 一律 65pt Bold、ink-box 水平＋垂直置中）
  drawCenteredText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );

  // 6. 右上 IG 蝦皮購物：固定原圖 1:1（161 × 162 @ 739, 119），
  //    不受 Logo mode／background luminance 影響
  ctx.drawImage(
    igShopeeImage,
    LAYOUT.igShopee.left,
    LAYOUT.igShopee.top,
    LAYOUT.igShopee.width,
    LAYOUT.igShopee.height
  );
}

registerRenderer("05-ig", renderIg05);

export const IG_05_LAYOUT = LAYOUT;
