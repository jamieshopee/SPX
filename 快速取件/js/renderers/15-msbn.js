// 15_MSBN 正式 renderer（1200 × 400、JPG）。
// geometry authority（Jamie 裁決）：global origin (6000,5178) 唯一實證；正式 local
// geometry＝圓角矩形 (86,144,1035×245) r=20、主標 (420,19,360×50)、天數 (739,96,20×35)、
// KV (707,153,332×228)、小標 (133,176,492×37)、副標 (133,231,492×59)、
// 小字 line1 (133,309,492×23)、line2 (133,340,492×23)。副標 X 正式＝133（不採
// alignment authoring 誤差 132）。對位圖 15_MSBN1（兩行）／15_MSBN2（一行）只供
// Viewer 人工驗證，不是 renderer dependency。
// Typography（Jamie 核准）：主標 39pt Bold、天數 28.5pt Medium、小標 30pt Medium、
// 副標 47.25pt Bold、小字 18.75pt Medium（pt 原樣，禁止換算 px）。
// 全部文字 ink 水平置中＋垂直置中（參考圖 diff 量測＋FSS MSBN drawCenteredText
// pattern 實證；不得改 left align）。
// Jamie 裁決：
// - 固定底圖 assets/MSBN bg.jpg（1200×400）；decode 失敗或尺寸不符 fail-closed。
//   底圖已烙印黃色 badge、提示 strip、蝦皮店到店 Logo、天數紅色方塊、固定紅底，
//   renderer 不得重畫。
// - 動態圓角矩形填 state.shared.colors.background。
// - 主標固定 #000000、天數固定 #ffffff、小標沿 shared title 色、副標沿 shared
//   subtitle 色；小字依既有 resolveLogoVariant 結果：orange → #6b6b6b、white → #ffffff。
//   15 本身不 render Logo，不建立第二套 resolver。
// - KV 沿 state.shared.kv：contain、center／center、no crop、no stretch；無 KV 時 skip。
// - 小字群組 layout：兩行皆非空＝base 位置不位移；恰一行非空＝唯一非空字串顯示於
//   single small-text slot（smallLine1 位置），小標＋副標＋該小字三行群組於圓角矩形
//   內自動垂直置中；兩行皆空＝小標＋副標兩行群組同樣自動垂直置中（Jamie 最終裁決
//   採 A）。dy 一律由 geometry 動態計算（rect centerY − group centerY），禁止
//   hardcode +12／+12.5；alignment 15_MSBN2 的約 +12 只是驗證結果。
// - Medium（天數／小標／小字）採 renderer-local 2×（temp 2400×800、scale(2,2)、
//   logical geometry 與 logical pt 不二次乘）；Bold（主標／副標）直繪。
// Layer order（z-index evidence 80～86）：bg → 圓角矩形 → 主標(80) → 天數(81) →
// 小標(82) → 副標(83) → 小字1(84) → 小字2(85) → KV(86)。六個文字 box 彼此
// pairwise disjoint（最小垂直間距 18）且皆不與 KV box 重疊，故實作以「Bold 直繪
// ＋單一 Medium 2× layer」合成的像素結果與上述 z-order 完全一致；KV 嚴格最後。
// 文字資料來源：state.excel.items["15"]（Jamie 裁決之 15 專屬欄位）。
// 本檔自含必要 helper，不修改、不 import 01～14 renderer。
import { registerRenderer } from "../renderer.js";
import { resolveLogoVariant } from "../logo-mode.js";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 400;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// 字級（Jamie 核准；pt 原樣，不得改 px）。
const MAIN_TITLE_FONT = `39pt "${BOLD_FAMILY}"`;
const DAYS_FONT = `28.5pt "${MEDIUM_FAMILY}"`;
const SMALL_TITLE_FONT = `30pt "${MEDIUM_FAMILY}"`;
const SUBTITLE_FONT = `47.25pt "${BOLD_FAMILY}"`;
const SMALL_LINE_FONT = `18.75pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([
  MAIN_TITLE_FONT,
  DAYS_FONT,
  SMALL_TITLE_FONT,
  SUBTITLE_FONT,
  SMALL_LINE_FONT
]);

const FONT_TEST_TEXT = "秋季加碼抽8,888蝦幣x1名";
const MEDIUM_RENDER_SCALE = 2;

// 固定文字色（Jamie 裁決）：主標 #000000、天數 #ffffff；
// 小字依 resolveLogoVariant 結果切換。
const MAIN_TITLE_COLOR = "#000000";
const DAYS_COLOR = "#ffffff";
const SMALL_TEXT_COLORS = Object.freeze({ orange: "#6b6b6b", white: "#ffffff" });

// 正式 layout（canvas-local；Jamie 核准）。顏色不在此定義（固定色除外），取自 Workspace。
export const MSBN_15_LAYOUT = Object.freeze({
  roundedRect: Object.freeze({ left: 86, top: 144, width: 1035, height: 245, radius: 20 }),
  mainTitle: Object.freeze({ left: 420, top: 19, width: 360, height: 50, font: MAIN_TITLE_FONT }),
  days: Object.freeze({ left: 739, top: 96, width: 20, height: 35, font: DAYS_FONT }),
  kv: Object.freeze({ left: 707, top: 153, width: 332, height: 228 }),
  smallTitle: Object.freeze({ left: 133, top: 176, width: 492, height: 37, font: SMALL_TITLE_FONT }),
  subtitle: Object.freeze({ left: 133, top: 231, width: 492, height: 59, font: SUBTITLE_FONT }),
  smallLine1: Object.freeze({ left: 133, top: 309, width: 492, height: 23, font: SMALL_LINE_FONT }),
  smallLine2: Object.freeze({ left: 133, top: 340, width: 492, height: 23, font: SMALL_LINE_FONT })
});

// 固定底圖 intrinsic fail-closed 驗證值（正式 asset 為 1200 × 400）。
const BACKGROUND_SOURCE_WIDTH = 1200;
const BACKGROUND_SOURCE_HEIGHT = 400;

// --- 小字群組 layout（Jamie 最終裁決；pure function，Phase D 可獨立驗證）---
// dy 一律由 geometry 動態計算：dy = rect centerY − group centerY。
// 禁止 hardcode +12／+12.5。三種 mode 皆保持 X／width／height／相對 Y 間距。
export function resolveSmallTextLayout(smallLine1, smallLine2) {
  const rect = MSBN_15_LAYOUT.roundedRect;
  const rectCenterY = rect.top + rect.height / 2;

  if (smallLine1 !== "" && smallLine2 !== "") {
    // 兩行模式：base 位置全部不位移。
    return { mode: "two-line", offsetY: 0, singleText: null };
  }

  if (smallLine1 === "" && smallLine2 === "") {
    // 零行模式（Jamie 最終裁決採 A）：小標＋副標兩行群組自動垂直置中。
    const groupTop = MSBN_15_LAYOUT.smallTitle.top;
    const groupBottom = MSBN_15_LAYOUT.subtitle.top + MSBN_15_LAYOUT.subtitle.height;
    return {
      mode: "zero-line",
      offsetY: rectCenterY - (groupTop + groupBottom) / 2,
      singleText: null
    };
  }

  // 一行模式：不論非空的是 line1 或 line2，唯一非空字串都顯示於 single small-text
  // slot（smallLine1 位置）；小標＋副標＋該小字三行群組自動垂直置中。
  const groupTop = MSBN_15_LAYOUT.smallTitle.top;
  const groupBottom = MSBN_15_LAYOUT.smallLine1.top + MSBN_15_LAYOUT.smallLine1.height;
  return {
    mode: "one-line",
    offsetY: rectCenterY - (groupTop + groupBottom) / 2,
    singleText: smallLine1 !== "" ? smallLine1 : smallLine2
  };
}

function shiftBoxDown(box, offsetY) {
  return { ...box, top: box.top + offsetY };
}

// --- 字型：renderer module 內以 FontFace API 建立所需 family 別名 ---
// 使用 SPX 既有正式 WOFF2，載入失敗 fail-closed。

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
    throw new Error(`15 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 15_MSBN render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 15_MSBN render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- 固定底圖：MSBN bg.jpg，載入失敗 fail-closed ---

const BACKGROUND_URL = new URL("../../assets/MSBN bg.jpg", import.meta.url);

let backgroundPromise = null;

function loadBackground() {
  backgroundPromise ||= new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`15 正式底圖載入失敗：${BACKGROUND_URL.pathname}`)),
      { once: true }
    );
    image.src = BACKGROUND_URL.href;
  }).catch((error) => {
    backgroundPromise = null;
    throw error;
  });
  return backgroundPromise;
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

// --- 動態圓角矩形（沿 04 已驗證 moveTo／arcTo pattern，不依賴 ctx.roundRect）---

function drawRoundedRect(context, rect, fillColor) {
  const { left, top, width, height, radius } = rect;
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

// --- KV 繪製：共通 contain 縮放（無 min(1, …) clamp）＋ 水平垂直置中 ---
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

// --- 文字繪製：ink-box 水平置中 ＋ 垂直置中（沿既有 center/center pattern）---

function measureRun(context, text, font) {
  context.font = font;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(text);

  return {
    advanceWidth: metrics.width,
    inkLeft: -metrics.actualBoundingBoxLeft,
    inkRight: metrics.actualBoundingBoxRight,
    inkTop: -metrics.actualBoundingBoxAscent,
    inkBottom: metrics.actualBoundingBoxDescent
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

// Medium 文字層（天數／小標／小字）採 renderer-local 2× supersampling（Jamie 裁決）：
// temp 2400 × 800、scale(2,2)、logical geometry 與 logical pt 不二次乘，
// HQ smoothing downsample 回 1200 × 400。相關文字全空時 early-return。
function drawMediumLayer(context, entries) {
  const visible = entries.filter(({ text }) => text !== "");
  if (visible.length === 0) return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 15 Medium 暫存 Canvas 2D context。");
  }

  mediumContext.scale(MEDIUM_RENDER_SCALE, MEDIUM_RENDER_SCALE);
  visible.forEach(({ text, box, color }) => drawCenteredText(mediumContext, text, box, color));

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

async function renderMsbn15({ ctx, state }) {
  await ensureFontsReady();

  const backgroundImage = await loadBackground();
  // 固定底圖 intrinsic fail-closed 驗證：正式 asset 必須為 1200 × 400。
  if (
    backgroundImage.naturalWidth !== BACKGROUND_SOURCE_WIDTH ||
    backgroundImage.naturalHeight !== BACKGROUND_SOURCE_HEIGHT
  ) {
    throw new Error(
      `15 正式底圖必須為 ${BACKGROUND_SOURCE_WIDTH} × ${BACKGROUND_SOURCE_HEIGHT}px，已停止 render。`
    );
  }
  const kvImage = state.shared.kv ? await loadKvImage(state.shared.kv.dataUrl) : null;

  // variant 只解算一次（既有 resolver），僅用於小字顏色；15 不畫 Logo。
  const variant = resolveLogoVariant(state.shared.logoMode, state.shared.colors.background);
  const smallTextColor = SMALL_TEXT_COLORS[variant];

  const itemData = state.excel.items?.["15"] || {};
  const mainTitle = String(itemData.mainTitle ?? "");
  const days = String(itemData.days ?? "");
  const smallTitle = String(itemData.smallTitle ?? "");
  const subtitle = String(itemData.subtitle ?? "");
  const smallLine1 = String(itemData.smallLine1 ?? "");
  const smallLine2 = String(itemData.smallLine2 ?? "");

  const layout = resolveSmallTextLayout(smallLine1, smallLine2);
  const smallTitleBox = shiftBoxDown(MSBN_15_LAYOUT.smallTitle, layout.offsetY);
  const subtitleBox = shiftBoxDown(MSBN_15_LAYOUT.subtitle, layout.offsetY);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1. 固定底圖（1200 × 400 原尺寸，不縮放）
  ctx.drawImage(backgroundImage, 0, 0);

  // 2. 動態圓角矩形（shared background color）
  drawRoundedRect(ctx, MSBN_15_LAYOUT.roundedRect, state.shared.colors.background);

  // 3. Bold 直繪：主標（z80，固定 #000000）＋ 副標（z83，shared subtitle 色）
  drawCenteredText(ctx, mainTitle, MSBN_15_LAYOUT.mainTitle, MAIN_TITLE_COLOR);
  drawCenteredText(ctx, subtitle, subtitleBox, state.shared.colors.subtitle);

  // 4. Medium 2× layer：天數（z81）＋ 小標（z82）＋ 小字（z84／z85）。
  //    文字 boxes pairwise disjoint，合成結果與 z80～85 順序一致。
  const mediumEntries = [
    { text: days, box: MSBN_15_LAYOUT.days, color: DAYS_COLOR },
    { text: smallTitle, box: smallTitleBox, color: state.shared.colors.title }
  ];
  if (layout.mode === "two-line") {
    mediumEntries.push(
      { text: smallLine1, box: MSBN_15_LAYOUT.smallLine1, color: smallTextColor },
      { text: smallLine2, box: MSBN_15_LAYOUT.smallLine2, color: smallTextColor }
    );
  } else if (layout.mode === "one-line") {
    mediumEntries.push({
      text: layout.singleText,
      box: shiftBoxDown(MSBN_15_LAYOUT.smallLine1, layout.offsetY),
      color: smallTextColor
    });
  }
  drawMediumLayer(ctx, mediumEntries);

  // 5. KV（z86 最高，最後畫）：contain、center／center、no crop／stretch；無 KV skip。
  if (kvImage) {
    drawContainCentered(ctx, kvImage, MSBN_15_LAYOUT.kv);
  }
}

registerRenderer("15-msbn", renderMsbn15);
