// 14_AR 正式 renderer（100 × 100、JPG）。
// geometry authority（Jamie 裁決）：正式對位圖 assets/對位/14_AR.png（文字群組 zone
// = 14,14,72×72）＋ Jamie 參考圖量測 ink centers（line1 35.5／line2 63.5）——
// 正式行框 line1 (14,23,72×25)、line2 (14,51,72×25)。FSS AR 行框 (14,22／14,54)
// 僅為比較證據，不採用。
// Typography（Jamie 裁決）：Photoshop source 兩行皆 24pt（Photoshop UI 顯示之 pt，
// 非 px），依既有 mapping ×0.75 → Canvas 兩種字型皆 18pt；中文（Han）用 Medium、
// 英文／數字／符號（Other）用 Bold。
// Mixed-font（沿 FSS AR 已驗證 pattern）：/\p{Script=Han}/u 逐字元分段 runs、
// 逐 run measureText（left／alphabetic、advanceWidth cursor）、聚合 actualBoundingBox
// ink，再以 ink center 對 box center 置中逐 run fillText。$、% 等符號不縮小。
// Jamie 裁決：
// - 無固定底圖：整張填 state.shared.colors.background。
// - 兩行文字顏色皆讀 state.shared.colors.subtitle。
// - 兩行皆非空 → 各自行框置中；僅一行非空 → 該行置中整個 100×100（target 50,50）；
//   兩行皆空 → 只畫背景。
// - 文字採 renderer-local 2×（temp 200×200、scale(2,2)、logical 18pt 不二次乘）。
// - 無 KV／Logo／Shopee／CTA；不呼叫 logo variant。
// 文字資料來源：state.excel.items["14"].line1／line2（Jamie 裁決之 14 專屬欄位）。
// 對位圖只供 Viewer 人工驗證，不是 renderer 底圖／dependency。
// 本檔自含必要 helper，不修改、不 import 01～13 renderer。
import { registerRenderer } from "../renderer.js";

const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 100;

const MEDIUM_FAMILY = "ShopeeNotoSans Medium";
const BOLD_FAMILY = "ShopeeNotoSans Bold";

// 字級（Jamie 裁決）：source 24pt ×0.75 → 兩種字型皆 18pt（pt 原樣，不得改 px）。
const HAN_FONT = `18pt "${MEDIUM_FAMILY}"`;
const OTHER_FONT = `18pt "${BOLD_FAMILY}"`;

const HAN_PATTERN = /\p{Script=Han}/u;

const FONT_CHECKS = Object.freeze([HAN_FONT, OTHER_FONT]);
// 混排 font test text（沿 FSS AR）：同時覆蓋 Han 與 Other。
const FONT_TEST_TEXT = "宅配滿$490";
const MEDIUM_RENDER_SCALE = 2;

// 雙行模式共同垂直微調（Jamie Manual Verification 視覺裁決）：兩行整組向下
// +0.5 logical unit，使雙行 ink centers 由 35.5／63.5 → 36.0／64.0（平均由
// 49.5 → 50.0 ＝ 72×72 zone 中心）。行距、x／w／h、字級皆不變；單行模式
//（fullCanvas 置中 50,50）不套用此 offset。0.5 logical unit 由 2× temp 精確呈現。
export const TWO_LINE_VERTICAL_OFFSET = 0.5;

function shiftBoxDown(box, offsetY) {
  return { left: box.left, top: box.top + offsetY, width: box.width, height: box.height };
}

// 正式 layout（Jamie 核准）：對位圖 zone (14,14,72×72)；行框中心＝參考圖量測
// ink centers（35.5／63.5）。單行置中 target = 整張 canvas（中心 50,50）。
export const AR_14_LAYOUT = Object.freeze({
  line1: Object.freeze({ left: 14, top: 23, width: 72, height: 25 }),
  line2: Object.freeze({ left: 14, top: 51, width: 72, height: 25 }),
  fullCanvas: Object.freeze({ left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
});

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
    throw new Error(`14 正式字型載入失敗：${error.message}`);
  });
  return fontRegistrationPromise;
}

function assertFontsReady() {
  if (
    !document.fonts ||
    !FONT_CHECKS.every((font) => document.fonts.check(font, FONT_TEST_TEXT))
  ) {
    throw new Error("正式字型尚未載入，已停止 14_AR render。");
  }
}

async function ensureFontsReady() {
  if (!document.fonts) {
    throw new Error("瀏覽器不支援正式字型載入檢查，已停止 14_AR render。");
  }
  await registerFontAliases();
  await Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font, FONT_TEST_TEXT)));
  assertFontsReady();
}

// --- Mixed-font 文字（沿 FSS AR 已驗證 pattern）---

function tokenizeLine(text) {
  const runs = [];
  let currentText = "";
  let currentHan = null;

  const flushRun = () => {
    if (currentText === "") return;
    runs.push({ text: currentText, han: currentHan });
    currentText = "";
  };

  for (const character of text) {
    const han = HAN_PATTERN.test(character);
    if (han !== currentHan) {
      flushRun();
      currentHan = han;
    }
    currentText += character;
  }
  flushRun();
  return runs;
}

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
    x: 0
  };
}

// 整行 mixed-font ink 置中於 box：Han run 用 Medium、Other run 用 Bold；
// advanceWidth cursor 串接、聚合 ink bounds、ink center 對 box center。
function drawCenteredMixedLine(context, text, box, color) {
  if (text === "") return;

  const runs = tokenizeLine(text).map((run) =>
    measureRun(context, run.text, run.han ? HAN_FONT : OTHER_FONT)
  );

  let cursor = 0;
  for (const run of runs) {
    run.x = cursor;
    cursor += run.advanceWidth;
  }

  const inkLeft = Math.min(...runs.map((run) => run.x + run.inkLeft));
  const inkRight = Math.max(...runs.map((run) => run.x + run.inkRight));
  const inkTop = Math.min(...runs.map((run) => run.inkTop));
  const inkBottom = Math.max(...runs.map((run) => run.inkBottom));

  const offsetX = box.left + box.width / 2 - (inkLeft + inkRight) / 2;
  const offsetY = box.top + box.height / 2 - (inkTop + inkBottom) / 2;

  context.fillStyle = color;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  for (const run of runs) {
    context.font = run.font;
    context.fillText(run.text, offsetX + run.x, offsetY);
  }
}

// 文字層採 renderer-local 2× supersampling（Jamie 裁決）：temp 200 × 200、
// scale(2,2)、logical geometry 與 logical 18pt 不二次乘，HQ downsample 回 100×100。
// 兩行皆空時 early-return（只畫背景）。
function drawArTextLayer(context, line1, line2, color) {
  if (line1 === "" && line2 === "") return;

  const textCanvas = document.createElement("canvas");
  textCanvas.width = CANVAS_WIDTH * MEDIUM_RENDER_SCALE;
  textCanvas.height = CANVAS_HEIGHT * MEDIUM_RENDER_SCALE;
  const textContext = textCanvas.getContext("2d");
  if (!textContext) {
    throw new Error("無法建立 14 文字暫存 Canvas 2D context。");
  }

  textContext.scale(MEDIUM_RENDER_SCALE, MEDIUM_RENDER_SCALE);

  if (line1 !== "" && line2 !== "") {
    // 兩行皆非空：各自行框 ink 置中（含雙行模式 +0.5 共同垂直微調）。
    drawCenteredMixedLine(
      textContext,
      line1,
      shiftBoxDown(AR_14_LAYOUT.line1, TWO_LINE_VERTICAL_OFFSET),
      color
    );
    drawCenteredMixedLine(
      textContext,
      line2,
      shiftBoxDown(AR_14_LAYOUT.line2, TWO_LINE_VERTICAL_OFFSET),
      color
    );
  } else {
    // 僅一行非空（Jamie 裁決）：該唯一文字行置中整個 100×100（target 50,50），
    // 不停留在原行框。
    const onlyLine = line1 !== "" ? line1 : line2;
    drawCenteredMixedLine(textContext, onlyLine, AR_14_LAYOUT.fullCanvas, color);
  }

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    textCanvas,
    0,
    0,
    textCanvas.width,
    textCanvas.height,
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  context.restore();
}

// --- 正式 renderer ---
// Draw order（Jamie 裁決）：Workspace background → AR mixed-font text。
// 無其他元素。source-over、globalAlpha = 1、無 clipping／masking。

async function renderAr14({ ctx, state }) {
  await ensureFontsReady();

  const itemData = state.excel.items?.["14"] || {};
  const line1 = String(itemData.line1 ?? "");
  const line2 = String(itemData.line2 ?? "");
  const textColor = state.shared.colors.subtitle;

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 1. Workspace background（無固定底圖，整張填色）
  ctx.fillStyle = state.shared.colors.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. AR mixed-font text（兩行色皆為 subtitle color；兩行皆空時只畫背景）
  drawArTextLayer(ctx, line1, line2, textColor);
}

registerRenderer("14-ar", renderAr14);
