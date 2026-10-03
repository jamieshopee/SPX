// SPX 開獎秀 — 線上／電子BN：共用 layout renderer engine
// ---------------------------------------------------------------------------
// 本檔只承接 01 與 02 真正共用的能力，不做 speculative abstraction：
//   - Regular／Medium／Bold FontFace 別名與來源，依 layout 實際字重「按需註冊」
//   - document.fonts.load() ＋ check() 的 fail-closed readiness gate
//   - 背景繪製：未宣告 layout.background 時為 full-canvas fill（既有行為）；
//     宣告 rounded-card 時畫布保持透明、只填圓角卡片
//   - 素材載入快取 ＋ intrinsic size 驗證
//   - contain 幾何計算
//   - ink-box 量測與繪製（水平 center／left 由 layout 決定，垂直恆為 ink-box center）
//   - local 2× supersampling layer（成員由 layout 的 supersampledFields 決定）
//   - 正式 renderer pipeline（Preview 與未來 Export 的唯一繪製來源）
//   - createInitialState(layout, styleId)
//
// 嚴格邊界：
//   - 不建立 registry／plugin system，不為 03～17 預先抽象。
//   - 不持有任何版位數值；所有 geometry、字級、顏色、素材一律來自 layout descriptor。
//   - pt 維持 pt：font string 由 descriptor 的 canvasPt 直接組成，禁止 px 換算。
//   - 沒有 KV。對位圖不是本檔的相依項（僅屬 Manual Verification Viewer 的 DOM overlay）。
// ---------------------------------------------------------------------------

import { resolveLogoVariant } from "./logo-auto.js";

// local 2× supersampling 倍率（Jamie 裁決）。offscreen = layout canvas × 此倍率，
// 不得硬編任何單一版位的 offscreen 尺寸。
export const SUPERSAMPLE_SCALE = 2;

// 開獎秀自己的 FontFace family 別名，不與 console.css 的 "Shopee Noto Sans" 共用。
// 別名式註冊才能用 document.fonts.check() 做確定性 readiness gate。
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

// --- font string ------------------------------------------------------------
// pt 維持 pt：直接以 descriptor 的 canvasPt 組字串，交給瀏覽器原生解析。
export function fontString(field) {
  return `${field.canvasPt}pt "${FONT_FAMILY[field.family]}"`;
}

export function layoutTextFields(layout) {
  return layout.textOrder.map((id) => layout.text[id]);
}

// 該 layout 實際用到的字重（去重），用於按需註冊，避免載入不需要的 WOFF2。
export function layoutFontFamilies(layout) {
  return [...new Set(layoutTextFields(layout).map((field) => field.family))];
}

// --- 字型：按需註冊 ＋ readiness gate ----------------------------------------

const familyPromises = new Map();

function registerFamily(familyKey) {
  if (!familyPromises.has(familyKey)) {
    const promise = (async () => {
      const fontFace = new FontFace(
        FONT_FAMILY[familyKey],
        `url("${FONT_SOURCE_URL[familyKey].href}")`
      );
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
  if (!document.fonts) {
    throw new Error(`瀏覽器不支援正式字型載入檢查，已停止 ${layout.name} render。`);
  }
  await Promise.all(layoutFontFamilies(layout).map(registerFamily));

  const checks = layoutTextFields(layout).map((field) => fontString(field));
  await Promise.all(checks.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  if (!checks.every((font) => document.fonts.check(font, FONT_TEST_TEXT))) {
    throw new Error(`正式字型尚未就緒，已停止 ${layout.name} render。`);
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

// --- contain 幾何（純函式）----------------------------------------------------
// scale = min(boxWidth / sourceWidth, boxHeight / sourceHeight)
// 垂直恆置中；水平由 align 決定（"center" 置中、"left" 貼齊 box 左緣）。
// 不 crop、不 stretch、座標不 round／floor／ceil。

export function computeContainRect(box, sourceWidth, sourceHeight, align = "center") {
  const scale = Math.min(box.width / sourceWidth, box.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return {
    x: align === "left" ? box.x : box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height
  };
}

// --- 文字：ink-box 量測 --------------------------------------------------------
// textAlign="left"、textBaseline="alphabetic"，以 actualBoundingBox* 量測。
// 不使用 textAlign="center"、不加 baseline magic number、座標不取整。
//   align "center"：ink 置中於 box
//   align "left"  ：ink 左緣落在 box.x（以 actualBoundingBoxLeft 補償）

export function drawLayoutText(context, text, field, color, align) {
  if (text === "") return;

  const font = fontString(field);
  context.font = font;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  const metrics = context.measureText(text);
  const inkLeft = -metrics.actualBoundingBoxLeft;
  const inkRight = metrics.actualBoundingBoxRight;
  const inkTop = -metrics.actualBoundingBoxAscent;
  const inkBottom = metrics.actualBoundingBoxDescent;

  const box = field.box;
  const x = align === "left"
    ? box.x - inkLeft
    : box.x + (box.width - (inkRight - inkLeft)) / 2 - inkLeft;
  const y = box.y + box.height / 2 - (inkTop + inkBottom) / 2;

  context.fillStyle = color;
  context.fillText(text, x, y);
}

// local 2× supersampling layer：
// offscreen = layout canvas × SUPERSAMPLE_SCALE、scale(2,2)、仍以正式 geometry 繪製，
// 再以 high-quality smoothing downsample 回正式 canvas。
// 成員由 layout.supersampledFields 決定，與字重無關；全為空字串時整層 skip。
function drawSupersampledLayer(context, layout, state) {
  const fields = layout.supersampledFields;
  if (fields.every((id) => state.text[id] === "")) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = layout.canvas.width * SUPERSAMPLE_SCALE;
  offscreen.height = layout.canvas.height * SUPERSAMPLE_SCALE;
  const offscreenContext = offscreen.getContext("2d");
  if (!offscreenContext) {
    throw new Error(`無法建立 ${layout.name} supersampling 暫存 Canvas 2D context。`);
  }

  offscreenContext.scale(SUPERSAMPLE_SCALE, SUPERSAMPLE_SCALE);
  fields.forEach((id) => {
    const field = layout.text[id];
    drawLayoutText(
      offscreenContext,
      state.text[id],
      field,
      state.colors[field.colorKey],
      layout.horizontalAlign
    );
  });

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    offscreen,
    0,
    0,
    offscreen.width,
    offscreen.height,
    0,
    0,
    layout.canvas.width,
    layout.canvas.height
  );
  context.restore();
}

// --- 背景繪製：backward-compatible 兩種模式 ------------------------------------
// layout.background 未宣告（01／02／03）→ legacy full-canvas fill，行為與既有逐行相同。
// layout.background.mode === "rounded-card" → 畫布保持透明，只填 descriptor 指定的圓角卡片。
// 判斷依據只有 descriptor；engine 不依 layout.id 分支、不含任何版位 id。

const BACKGROUND_MODE_ROUNDED_CARD = "rounded-card";

// 最小 validation：只在 layout.background 存在時執行，任一不合法即 fail-closed throw。
export function validateBackground(layout) {
  const background = layout.background;
  if (background === undefined) return;

  if (background.mode !== BACKGROUND_MODE_ROUNDED_CARD) {
    throw new Error(`${layout.name} 不支援的背景模式：${background.mode}。`);
  }

  const box = background.box;
  if (!box) throw new Error(`${layout.name} 背景缺少 box。`);

  const { x, y, width, height } = box;
  const radius = background.radius;
  if (![x, y, width, height, radius].every((value) => Number.isFinite(value))) {
    throw new Error(`${layout.name} 背景 geometry 必須為有限數值。`);
  }
  if (width <= 0 || height <= 0) {
    throw new Error(`${layout.name} 背景 box 的 width／height 必須大於 0。`);
  }
  if (radius < 0 || radius > Math.min(width, height) / 2) {
    throw new Error(
      `${layout.name} 背景 radius 必須介於 0 與 ${Math.min(width, height) / 2} 之間。`
    );
  }
  if (
    x < 0 ||
    y < 0 ||
    x + width > layout.canvas.width ||
    y + height > layout.canvas.height
  ) {
    throw new Error(`${layout.name} 背景 box 超出正式畫布範圍。`);
  }
}

// 圓角矩形以 moveTo ＋ 四個 arcTo 手工建 path（不依賴 ctx.roundRect）。
// 只 fill，不 stroke、不 shadow、不 clip 整體 renderer。
function fillRoundedCard(ctx, box, radius, color) {
  const { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(right, y, right, bottom, radius);
  ctx.arcTo(right, bottom, x, bottom, radius);
  ctx.arcTo(x, bottom, x, y, radius);
  ctx.arcTo(x, y, right, y, radius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawBackground(ctx, layout, color) {
  // legacy 分支：與擴充前完全相同的兩行，不加 save／restore／clearRect／clip／transform。
  if (layout.background === undefined) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, layout.canvas.width, layout.canvas.height);
    return;
  }

  validateBackground(layout);
  // rounded-card：不做 full-canvas 繪製，卡片外維持 canvas 原始透明。
  fillRoundedCard(ctx, layout.background.box, layout.background.radius, color);
}

// --- style 資料 ＋ 初始 state ---------------------------------------------------

export function getStyleData(layout, styleId) {
  if (!Object.prototype.hasOwnProperty.call(layout.styles, styleId)) return null;
  return layout.styles[styleId];
}

// 使用者可變資料只存在 page memory：不使用 localStorage／sessionStorage／history.state。
export function createInitialState(layout, styleId) {
  const styleData = getStyleData(layout, styleId);
  if (styleData === null) throw new Error(`${layout.name} 不支援的樣式：${styleId}。`);
  return {
    text: Object.fromEntries(layout.textOrder.map((id) => [id, ""])),
    colors: { ...styleData.defaultColors },
    logoMode: "auto"
  };
}

// --- 正式 renderer -------------------------------------------------------------
// 語意 draw order：background → style base → Logo → main → subtitle → small1 → small2
// 實際 sequence：supersampledFields 以單次 drawImage 合批貼回，directFields 之後直繪。
// 各 layout 的文字 box 兩兩不重疊，故兩者算繪結果等價。

export async function renderLayout({ ctx, layout, styleId, state }) {
  const styleData = getStyleData(layout, styleId);
  if (styleData === null) throw new Error(`${layout.name} 不支援的樣式：${styleId}。`);

  await ensureFontsReady(layout);

  const placement = styleData.backgroundPlacement;
  const variant = resolveLogoVariant(state.logoMode, state.colors.background);

  const [backgroundImage, logoImage] = await Promise.all([
    loadImage(styleData.backgroundSrc, placement, `${layout.name} 正式底圖`),
    loadImage(layout.logo.src[variant], layout.logo.intrinsic, `${layout.name} 正式 Logo`)
  ]);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1. 背景：未宣告 layout.background 時為 full-canvas fill（01／02／03）；
  //    宣告 rounded-card 時畫布保持透明，只填圓角卡片。
  drawBackground(ctx, layout, state.colors.background);

  // 2. style 正式底圖：1:1，不 stretch、不 crop
  ctx.drawImage(
    backgroundImage,
    placement.x,
    placement.y,
    placement.width,
    placement.height
  );

  // 3. Logo：contain；水平依 layout.horizontalAlign，垂直恆置中
  const logoRect = computeContainRect(
    layout.logo.box,
    logoImage.naturalWidth,
    logoImage.naturalHeight,
    layout.horizontalAlign
  );
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logoImage, logoRect.x, logoRect.y, logoRect.width, logoRect.height);
  ctx.restore();

  // 4. supersampled 文字層（local 2×）
  drawSupersampledLayer(ctx, layout, state);

  // 5. direct 文字（不進 supersampling layer）
  layout.directFields.forEach((id) => {
    const field = layout.text[id];
    drawLayoutText(
      ctx,
      state.text[id],
      field,
      state.colors[field.colorKey],
      layout.horizontalAlign
    );
  });
}

// Preview 與未來 Export 的唯一入口。本輪不實作 Export；
// 未來 Export 只需對本函式回傳的 canvas 編碼，不得另建第二套繪製路徑。
export async function renderLayoutToCanvas({ layout, styleId, state }) {
  const canvas = document.createElement("canvas");
  canvas.width = layout.canvas.width;
  canvas.height = layout.canvas.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("瀏覽器無法建立 Canvas 2D context。");

  await renderLayout({ ctx, layout, styleId, state });

  if (canvas.width !== layout.canvas.width || canvas.height !== layout.canvas.height) {
    throw new Error(`${layout.name} renderer 不得修改正式 Canvas 尺寸。`);
  }
  return canvas;
}
