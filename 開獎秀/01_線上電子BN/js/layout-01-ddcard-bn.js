// SPX 開獎秀 — 線上／電子BN：01_DDcard BN 正式 renderer
// ---------------------------------------------------------------------------
// 正式 canvas：531 × 792。
//
// 本檔同時持有（Jamie 已裁決，不得重新開題）：
//   1. layout 固定資料：canvas、Logo box、四個文字 box、字級、字重、上限
//   2. style 差異資料：僅六項（底圖、底圖 placement、四個預設色）
//   3. 正式 renderer：Preview 與未來 Export 的唯一繪製來源
//
// 嚴格邊界：
//   - 只處理 01_DDcard BN。不含 02～17 的任何資料或分支。
//   - smart-locker／store 共用這一個 renderer；renderer 內不得出現 style id 分支，
//     style 差異一律資料化（STYLE_DATA）。
//   - 沒有 KV：無 KV 欄位、無 KV box、無 KV draw step、無 placeholder。
//   - 人物／場景／票券／CTA 皆已 baked into style 底圖，renderer 不重新製作。
//   - 字級沿用快速取件既有換算：Canvas pt = Photoshop pt × 72 / 96（見下方常數）。
//   - 對位圖不是本檔的相依項：它只屬 Manual Verification Viewer 的 DOM overlay。
//
// Draw order（正式語意順序）：
//   1. 背景色  2. style 底圖  3. Logo  4. 主標  5. 副標  6. 小字 1  7. 小字 2
//
//   實作上主標＋小字1＋小字2 同屬 Medium local 2× 層，以單次 drawImage 合批貼回，
//   因此四個文字在程式中的落版順序為 [主標, 小字1, 小字2] → 副標。
//   四個文字 box 垂直範圍 170–207／221–278／296–318／325–347 兩兩不重疊，
//   故合批與正式語意順序在視覺結果上等價（Jamie 已批准）。
//
// fail-closed：字型未就緒、素材載入失敗、素材 intrinsic size 不符、
//   canvas 尺寸遭變更，一律 throw，不輸出 fallback 字型或缺圖半成品。
// ---------------------------------------------------------------------------

import { resolveLogoVariant } from "./logo-auto.js";

export const CANVAS_WIDTH = 531;
export const CANVAS_HEIGHT = 792;

// Medium 層的 supersampling 倍率（Jamie 裁決）：離屏 canvas 1062 × 1584。
const MEDIUM_RENDER_SCALE = 2;

// 開獎秀自己的 FontFace family 別名，不與 console.css 的 "Shopee Noto Sans"
// 共用。別名式註冊才能用 document.fonts.check() 做確定性 readiness gate。
const MEDIUM_FAMILY = "LotteryShowNotoSans Medium";
const BOLD_FAMILY = "LotteryShowNotoSans Bold";

// Photoshop source sizes（設計來源，不變）：主標 40pt／副標 60pt／小字 24pt。
// Canvas renderer 沿用快速取件既有 verified precedent：
//   Canvas pt = Photoshop pt × 72 / 96
// Resolved renderer sizes：30pt / 45pt / 18pt（以下為固定字串，不做 runtime 換算）。
const TITLE_FONT = `30pt "${MEDIUM_FAMILY}"`;
const SUBTITLE_FONT = `45pt "${BOLD_FAMILY}"`;
const SMALL_FONT = `18pt "${MEDIUM_FAMILY}"`;

const FONT_CHECKS = Object.freeze([TITLE_FONT, SUBTITLE_FONT, SMALL_FONT]);
const FONT_TEST_TEXT = "取件最高抽百萬$1,000,000%";

// --- 1. layout 固定資料（不隨 style、不隨使用者變動）-------------------------

export const LAYOUT = Object.freeze({
  logo: Object.freeze({ x: 77, y: 89, width: 377, height: 64 }),
  title: Object.freeze({ x: 90, y: 170, width: 351, height: 37, font: TITLE_FONT }),
  subtitle: Object.freeze({ x: 43, y: 221, width: 445, height: 57, font: SUBTITLE_FONT }),
  small1: Object.freeze({ x: 43, y: 296, width: 445, height: 22, font: SMALL_FONT }),
  small2: Object.freeze({ x: 43, y: 325, width: 445, height: 22, font: SMALL_FONT })
});

// 四個獨立文字欄位（小字 1／小字 2 不是同一欄自動換行）。
// weighted limit：非 ASCII = 1 unit、ASCII = 0.5 unit。
export const TEXT_FIELDS = Object.freeze([
  Object.freeze({ id: "title", label: "主標", limit: 8 }),
  Object.freeze({ id: "subtitle", label: "副標", limit: 7 }),
  Object.freeze({ id: "small1", label: "小字 1", limit: 18 }),
  Object.freeze({ id: "small2", label: "小字 2", limit: 18 })
]);

// 四個顏色控制。小字 1 與小字 2 共用同一個 small 顏色，不新增第二個。
export const COLOR_FIELDS = Object.freeze([
  Object.freeze({ id: "background", label: "背景色" }),
  Object.freeze({ id: "title", label: "主標顏色" }),
  Object.freeze({ id: "subtitle", label: "副標顏色" }),
  Object.freeze({ id: "small", label: "小字顏色" })
]);

const LOGO_INTRINSIC = Object.freeze({ width: 1678, height: 272 });

const LOGO_SOURCES = Object.freeze({
  orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
  white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
});

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

// --- 2. style 差異資料（只有六項）-------------------------------------------
// backgroundPlacement 的 width／height 同時是底圖 intrinsic size 的期望值，
// 不另設第二份尺寸常數，避免兩處數值漂移。

export const STYLE_DATA = Object.freeze({
  "smart-locker": Object.freeze({
    backgroundSrc: new URL("../assets/智取櫃/01_DDcard BN.png", import.meta.url),
    backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 531, height: 792 }),
    defaultColors: Object.freeze({
      background: "#2660ad",
      title: "#fffac8",
      subtitle: "#fff000",
      small: "#fffac8"
    })
  }),
  "store": Object.freeze({
    backgroundSrc: new URL("../assets/門市/01_DDcard BN.png", import.meta.url),
    backgroundPlacement: Object.freeze({ x: 0, y: 354, width: 531, height: 438 }),
    defaultColors: Object.freeze({
      background: "#ffda46",
      title: "#472704",
      subtitle: "#eb1717",
      small: "#472704"
    })
  })
});

export function getStyleData(styleId) {
  if (!Object.prototype.hasOwnProperty.call(STYLE_DATA, styleId)) return null;
  return STYLE_DATA[styleId];
}

// --- 3. 使用者可變資料的初始值（page memory；不使用任何持久化機制）-----------

export function createInitialState(styleId) {
  const styleData = getStyleData(styleId);
  if (styleData === null) throw new Error(`01_DDcard BN 不支援的樣式：${styleId}。`);
  return {
    text: { title: "", subtitle: "", small1: "", small2: "" },
    colors: { ...styleData.defaultColors },
    logoMode: "auto"
  };
}

// --- 字型：FontFace 別名 ＋ readiness gate -----------------------------------

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
    throw new Error(`01_DDcard BN 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 01_DDcard BN render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  if (!FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))) {
    throw new Error("正式字型尚未就緒，已停止 01_DDcard BN render。");
  }
}

// --- 素材載入 ＋ intrinsic size fail-closed -----------------------------------

const assetPromises = new Map();

function loadImage(url, expected, label) {
  const href = url.href;
  if (!assetPromises.has(href)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(`${label} 載入失敗：${decodeURIComponent(url.pathname)}`)),
        { once: true }
      );
      image.src = href;
    }).then((image) => {
      if (
        image.naturalWidth !== expected.width ||
        image.naturalHeight !== expected.height
      ) {
        throw new Error(
          `${label} 必須為 ${expected.width} × ${expected.height}px，` +
          `實際為 ${image.naturalWidth} × ${image.naturalHeight}px。`
        );
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

// --- Logo contain 幾何（純函式，供 renderer 與 self-test 共用）----------------
// scale = min(boxWidth / sourceWidth, boxHeight / sourceHeight)
// 水平置中、垂直置中、不 crop、不 stretch、座標不 round／floor／ceil。

export function computeContainRect(box, sourceWidth, sourceHeight) {
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height
  };
}

// --- 文字：ink-box centering --------------------------------------------------
// textAlign="left"、textBaseline="alphabetic"，以 actualBoundingBox* 量測。
// 不使用 textAlign="center"、不加 baseline magic number、座標不取整。

function drawCenteredText(context, text, box, color) {
  if (text === "") return;

  context.font = box.font;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  const metrics = context.measureText(text);
  const inkLeft = -metrics.actualBoundingBoxLeft;
  const inkRight = metrics.actualBoundingBoxRight;
  const inkTop = -metrics.actualBoundingBoxAscent;
  const inkBottom = metrics.actualBoundingBoxDescent;

  const x = box.x + (box.width - (inkRight - inkLeft)) / 2 - inkLeft;
  const y = box.y + box.height / 2 - (inkTop + inkBottom) / 2;

  context.fillStyle = color;
  context.fillText(text, x, y);
}

// Medium 層（主標＋小字1＋小字2）local 2× supersampling：
// 1062 × 1584 離屏 canvas、scale(2,2)、仍以正式 531×792 geometry 繪製，
// 再以 high-quality smoothing downsample 回正式 canvas。
// 三個 Medium 全為空字串時整層 skip。副標 Bold 不進本層。
function drawMediumLayer(context, state) {
  const { title, small1, small2 } = state.text;
  if (title === "" && small1 === "" && small2 === "") return;

  const mediumCanvas = document.createElement("canvas");
  mediumCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  mediumCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const mediumContext = mediumCanvas.getContext("2d");
  if (!mediumContext) {
    throw new Error("無法建立 01_DDcard BN Medium 暫存 Canvas 2D context。");
  }

  mediumContext.scale(MEDIUM_RENDER_SCALE, MEDIUM_RENDER_SCALE);
  drawCenteredText(mediumContext, title, LAYOUT.title, state.colors.title);
  drawCenteredText(mediumContext, small1, LAYOUT.small1, state.colors.small);
  drawCenteredText(mediumContext, small2, LAYOUT.small2, state.colors.small);

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

// --- 正式 renderer -----------------------------------------------------------

export async function renderDdcardBn01({ ctx, styleId, state }) {
  const styleData = getStyleData(styleId);
  if (styleData === null) throw new Error(`01_DDcard BN 不支援的樣式：${styleId}。`);

  await ensureFontsReady();

  const placement = styleData.backgroundPlacement;
  const variant = resolveLogoVariant(state.logoMode, state.colors.background);

  const [backgroundImage, logoImage] = await Promise.all([
    loadImage(styleData.backgroundSrc, placement, "01_DDcard BN 正式底圖"),
    loadImage(LOGO_SOURCES[variant], LOGO_INTRINSIC, "01_DDcard BN 正式 Logo")
  ]);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1. 背景色填滿整張正式畫布
  ctx.fillStyle = state.colors.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. style 正式底圖：1:1，不 stretch、不 crop
  ctx.drawImage(
    backgroundImage,
    placement.x,
    placement.y,
    placement.width,
    placement.height
  );

  // 3. Logo：contain ＋ 水平垂直置中；orange／white 共用相同 placement
  const logoRect = computeContainRect(
    LAYOUT.logo,
    logoImage.naturalWidth,
    logoImage.naturalHeight
  );
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logoImage, logoRect.x, logoRect.y, logoRect.width, logoRect.height);
  ctx.restore();

  // 4／6／7. Medium 層：主標＋小字 1＋小字 2（local 2×）
  drawMediumLayer(ctx, state);

  // 5. 副標：Bold，直接繪於正式 canvas，不進 Medium 2× 層
  drawCenteredText(ctx, state.text.subtitle, LAYOUT.subtitle, state.colors.subtitle);
}

// Preview 與未來 Export 的唯一入口。本輪不實作 Export；
// 未來 Export 只需對本函式回傳的 canvas 編碼，不得另建第二套繪製路徑。
export async function renderDdcardBn01ToCanvas({ styleId, state }) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("瀏覽器無法建立 Canvas 2D context。");

  await renderDdcardBn01({ ctx, styleId, state });

  if (canvas.width !== CANVAS_WIDTH || canvas.height !== CANVAS_HEIGHT) {
    throw new Error("01_DDcard BN renderer 不得修改正式 Canvas 尺寸。");
  }
  return canvas;
}
