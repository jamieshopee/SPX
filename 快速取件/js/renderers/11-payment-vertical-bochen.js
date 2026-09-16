// 11_繳費機直式BN-博辰 正式 renderer（2700 × 3380、JPG）。
// geometry authority（Jamie 裁決）：Jamie Photoshop global geometry ＋ 11 對位圖
//（五個未爭議元素以 artboard offset X 1213／Y 4096 唯一互證；副標 box 由對位圖
// 第六個實心矩形解決——Jamie 原貼副標 CSS 與主標重複屬貼錯，正確 global 為
// 1563/4962/2000×259）。
// 原設計畫板 global 座標（1813/4419/4705、1563/4962/5309、1313/5485、1317/7265）
// 僅為溯源記錄，不參與 runtime geometry。
// Typography（Jamie 核准）：Photoshop source sizes 200pt／275pt／125pt（Photoshop
// UI 顯示之 pt，非 px），依既有 FSS Photoshop-to-Canvas mapping（×0.75）得
// Canvas 150pt／206.25pt／93.75pt。
// Jamie 裁決：
// - 三文字 ink 水平置中＋垂直置中（沿 08 已驗證 center/center pattern；
//   Logo/Title/Subtitle/Small/KV 五框中心 x 精確 = 1350 = canvas 中心）。
// - 副標 $／% 不縮小，全字串一律 206.25pt Bold（無 symbol font／tokenizer）。
// - Medium 2× 於 title 與 small 皆空字串時 early-return；副標直繪。
// - Logo：contain 後水平置中＋垂直置中（高度先到，dest ≈ 1115.7×219）；
//   無 Logo runtime intrinsic gate（沿 precedent）。
// - 左下橫式蝦皮購物：contain 後「範圍內靠左＋垂直置中」（左下角落元素，
//   正式語義採 LEFT），runtime intrinsic 1119 × 275 gate；與 Logo 共用同一次
//   resolveLogoVariant 結果同步切換 橘／白。
// - 11 沒有固定底圖（整張填 Workspace background color）、沒有 CTA。
// 文字內容與四色一律來自快速取件 Workspace，不 hardcode 文案與顏色。
// 對位圖（assets/對位/11_繳費機直式BN-博辰.png）只供開發／人工驗證，不是 runtime dependency。
// 本檔自含必要 helper，不修改、不 import 01～10 renderer。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 2700;
const CANVAS_HEIGHT = 3380;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// 字級（Jamie 核准）：Photoshop source 200pt／275pt／125pt ×0.75 →
// Canvas 150pt／206.25pt／93.75pt（pt 原樣，不得改 px）。
const TITLE_FONT = `150pt "${MEDIUM_FAMILY}"`;
// 副標（Jamie 裁決）：所有字元（含 $／%）一律 206.25pt Bold，無 symbol font。
const SUBTITLE_FONT = `206.25pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `93.75pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_FONT
]);

const FONT_TEST_TEXT = "商城優選免運$490%";
const MEDIUM_RENDER_SCALE = 2;

// 正式 layout（canvas-local；Jamie global − offset 1213/4096，與對位圖逐 px 互證）。
// 顏色不在此定義，一律取自 Workspace。
const LAYOUT = Object.freeze({
  logo: Object.freeze({ left: 600, top: 323, width: 1500, height: 219 }),
  title: Object.freeze({ left: 600, top: 609, width: 1500, height: 184, font: TITLE_FONT }),
  subtitle: Object.freeze({ left: 350, top: 866, width: 2000, height: 259, font: SUBTITLE_FONT }),
  small: Object.freeze({ left: 350, top: 1213, width: 2000, height: 117, font: SMALL_FONT }),
  kv: Object.freeze({ left: 100, top: 1389, width: 2500, height: 1730 }),
  hShopee: Object.freeze({ left: 104, top: 3169, width: 529, height: 130 })
});

// 左下橫式蝦皮購物 source intrinsic fail-closed 驗證值（正式 asset 為 1119 × 275）。
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
    throw new Error(`11 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 11_繳費機直式BN-博辰 render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 11_繳費機直式BN-博辰 render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定 assets：店到店 Logo 橘／白＋左下橫式蝦皮購物 橘／白（11 沒有 CTA），
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
        () => reject(new Error(`11 正式素材載入失敗：${ASSET_URLS[assetKey].pathname}`)),
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

// Logo 與 KV 用：contain ＋ 水平垂直置中。
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

// 左下橫式蝦皮購物用（Jamie 裁決）：contain 縮放後，範圍內靠左＋垂直置中。
// destinationX = box.left（不 round）。
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

// --- 文字繪製：ink-box 水平置中 ＋ 垂直置中（沿 08 已驗證 center/center pattern）---

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

// Medium 字重（主標＋小字）採 renderer-local 2× supersampling（Jamie 裁決）：
// 於 2×（5400 × 6760）暫存 canvas 以原始 2700 × 3380 logical geometry 與
// logical pt 字級繪製（2× 完全由 context.scale(2, 2) 處理，不得手動放大字級），
// 再以 high-quality smoothing 縮回正式 Canvas。
// title 與 small 皆空字串時 early-return。
function drawMediumLayer(context, title, titleColor, small, smallColor) {
  if (title === "" && small === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 11 Medium 暫存 Canvas 2D context。");
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
// Medium layer（主標＋小字）→ Bold layer（副標，直繪）→ 左下橫式蝦皮購物。
// 11 沒有 CTA。source-over、globalAlpha = 1、無 clipping／masking。

async function renderPaymentVerticalBochen11({ ctx, state }) {
  await ensureFontsReady();

  // variant 只解算一次：同一結果同時決定店到店 Logo 與左下橫式蝦皮購物。
  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const logoImage = await loadAsset(variant === "orange" ? "logoOrange" : "logoWhite");
  const hShopeeImage = await loadAsset(variant === "orange" ? "hShopeeOrange" : "hShopeeWhite");
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // 左下橫式蝦皮購物 intrinsic fail-closed 驗證：正式 asset 必須為 1119 × 275。
  if (
    hShopeeImage.naturalWidth !== H_SHOPEE_SOURCE_WIDTH ||
    hShopeeImage.naturalHeight !== H_SHOPEE_SOURCE_HEIGHT
  ) {
    throw new Error(
      `11 左下蝦皮購物素材必須為 ${H_SHOPEE_SOURCE_WIDTH} × ${H_SHOPEE_SOURCE_HEIGHT}px，已停止 render。`
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

  // 3. 店到店 Logo：contain 後水平置中＋垂直置中（Jamie 裁決；無 runtime intrinsic gate）
  drawContainCentered(ctx, logoImage, LAYOUT.logo);

  // 4. Medium layer：主標＋小字（local 2× supersampling、ink 水平＋垂直置中）
  drawMediumLayer(
    ctx,
    String(state.shared.text.title),
    state.shared.colors.title,
    String(state.shared.text.small),
    state.shared.colors.small
  );

  // 5. Bold layer：副標（全字串含 $／% 一律 206.25pt Bold、ink 水平＋垂直置中、直繪）
  drawCenteredText(
    ctx,
    String(state.shared.text.subtitle),
    LAYOUT.subtitle,
    state.shared.colors.subtitle
  );

  // 6. 左下橫式蝦皮購物：contain 後範圍內靠左＋垂直置中（Jamie 裁決），
  //    與 Logo 同一 variant
  drawContainLeftVCenter(ctx, hShopeeImage, LAYOUT.hShopee);
}

registerRenderer("11-payment-vertical-bochen", renderPaymentVerticalBochen11);

export const PAYMENT_VERTICAL_BOCHEN_11_LAYOUT = LAYOUT;
