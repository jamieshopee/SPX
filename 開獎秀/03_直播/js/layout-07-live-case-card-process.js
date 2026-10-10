// SPX 開獎秀 — 直播 07：案型字卡_直播流程介紹 descriptor

const STEP_BIG_FONT_SIZE = 37.5;
const STEP_SMALL_FONT_SIZE = 25;

function stepRow(groupId, id, label, kind, defaultValue, limit, options = {}) {
  return Object.freeze({
    id,
    label,
    group: groupId,
    defaultValue,
    kind,
    limit,
    multiline: Boolean(options.multiline),
    maxLines: options.maxLines ?? 1,
    maxCharsPerLine: options.maxCharsPerLine ?? limit,
    maxWidth: options.maxWidth ?? 265,
    bigFontSizePx: STEP_BIG_FONT_SIZE,
    smallFontSizePx: STEP_SMALL_FONT_SIZE,
    bigFamily: "bold",
    smallFamily: "regular"
  });
}

const step1Box = Object.freeze({ x: 112, y: 752, width: 266, height: 85 });
const step2Box = Object.freeze({ x: 402, y: 752, width: 266, height: 85 });
const step3Box = Object.freeze({ x: 693, y: 752, width: 266, height: 85 });
const step4Box = Object.freeze({ x: 217, y: 938, width: 636, height: 162 });

export const LIVE_07_LAYOUT = Object.freeze({
  id: "07",
  name: "案型字卡_直播流程介紹",
  canvas: Object.freeze({ width: 1080, height: 1920 }),
  outputName: "案型字卡_直播流程介紹.jpg",
  logo: Object.freeze({
    box: Object.freeze({ x: 305, y: 281, width: 470, height: 84 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),
  textOrder: Object.freeze(["title", "subtitle", "small1", "small2", "warning"]),
  defaultText: Object.freeze({
    title: "12/12直播開獎",
    subtitle: "取件最高抽百萬",
    small1: "10/10-12/30下單，在到貨一天內取件限定",
    small2: "百萬獎金均分，詳情依活動規則為準",
    warning: "※百萬獎金均分，詳情依活動規則為準",
    steps: Object.freeze({
      step1: Object.freeze({ big: "抽一間門市", small: "" }),
      step2: Object.freeze({ big: "抽手機後6碼", small: "(不需按順序)" }),
      step3: Object.freeze({ big: "抽特別號", small: "(下單時間)" }),
      step4: Object.freeze({
        big: "直播當下參加互動\n現場抽出一名用戶最高10萬現金",
        small: "（訂單須符合活動條款，詳見活動頁）"
      })
    })
  }),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標", box: Object.freeze({ x: 275, y: 381, width: 530, height: 82 }),
      photoshopPt: 17, fontSizePx: 70.83333333333333, family: "medium", colorKey: "title", limit: 8,
      maxWidth: 530, align: "center", rendering: "direct"
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標", box: Object.freeze({ x: 220, y: 458, width: 640, height: 105 }),
      photoshopPt: 21, fontSizePx: 87.5, family: "bold", colorKey: "subtitle", limit: 7,
      maxWidth: 640, align: "center", rendering: "direct"
    }),
    small1: Object.freeze({
      id: "small1", label: "小字第一行", box: Object.freeze({ x: 240, y: 570, width: 600, height: 40 }),
      photoshopPt: 7.7, fontSizePx: 32.08333333333333, family: "medium", colorKey: "small", limit: 18,
      maxWidth: 600, align: "center", rendering: "direct"
    }),
    small2: Object.freeze({
      id: "small2", label: "小字第二行", box: Object.freeze({ x: 240, y: 610, width: 600, height: 40 }),
      photoshopPt: 7.7, fontSizePx: 32.08333333333333, family: "medium", colorKey: "small", limit: 18,
      maxWidth: 600, align: "center", rendering: "direct"
    }),
    warning: Object.freeze({
      id: "warning", label: "警語", box: Object.freeze({ x: 220, y: 1110, width: 640, height: 55 }),
      photoshopPt: 8.6, fontSizePx: 35.83333333333333, family: "regular", colorKey: "warning", limit: 18,
      maxWidth: 640, align: "center", rendering: "direct"
    })
  }),
  stepGroups: Object.freeze([
    Object.freeze({
      id: "step1", label: "Step.1", safeBox: step1Box, colorKey: "step",
      rows: Object.freeze([
        stepRow("step1", "big", "大字", "big", "抽一間門市", 6, { maxWidth: step1Box.width }),
        stepRow("step1", "small", "小字", "small", "", 9, { maxWidth: step1Box.width })
      ])
    }),
    Object.freeze({
      id: "step2", label: "Step.2", safeBox: step2Box, colorKey: "step",
      rows: Object.freeze([
        stepRow("step2", "big", "大字", "big", "抽手機後6碼", 6, { maxWidth: step2Box.width }),
        stepRow("step2", "small", "小字", "small", "(不需按順序)", 9, { maxWidth: step2Box.width })
      ])
    }),
    Object.freeze({
      id: "step3", label: "Step.3", safeBox: step3Box, colorKey: "step",
      rows: Object.freeze([
        stepRow("step3", "big", "大字", "big", "抽特別號", 6, { maxWidth: step3Box.width }),
        stepRow("step3", "small", "小字", "small", "(下單時間)", 9, { maxWidth: step3Box.width })
      ])
    }),
    Object.freeze({
      id: "step4", label: "Step.4", safeBox: step4Box, colorKey: "step",
      rows: Object.freeze([
        stepRow("step4", "big", "大字", "big", "直播當下參加互動\n現場抽出一名用戶最高10萬現金", 15, {
          multiline: true, maxLines: 2, maxCharsPerLine: 15, maxWidth: step4Box.width
        }),
        stepRow("step4", "small", "小字", "small", "（訂單須符合活動條款，詳見活動頁）", 18, { maxWidth: step4Box.width })
      ])
    })
  ]),
  cardTypography: Object.freeze({
    bigBaselineInterval: 45,
    inkGaps: Object.freeze({ bigSmall: 10, smallBig: 10, smallSmall: 10 })
  }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "title", label: "主標顏色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" }),
    Object.freeze({ id: "small", label: "小字顏色" }),
    Object.freeze({ id: "warning", label: "警語顏色" }),
    Object.freeze({ id: "step", label: "Step 文字顏色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8", warning: "#ffffff", step: "#2f4571" }),
      backgroundSrc: new URL("../assets/智取櫃/案型字卡_直播流程介紹.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 685, width: 1080, height: 1235 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704", warning: "#472704", step: "#472704" }),
      backgroundSrc: new URL("../assets/門市/案型字卡_直播流程介紹.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 685, width: 1080, height: 1235 })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/案型字卡_直播流程介紹.png", import.meta.url)
});

export function getLive07Style(styleId) {
  return LIVE_07_LAYOUT.styles[styleId] ?? null;
}
