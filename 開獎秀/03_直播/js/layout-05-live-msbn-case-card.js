// SPX 開獎秀 — 直播 05：MSBN_案型字卡 descriptor

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";

const cardSafeBox = Object.freeze({ x: 316, y: 639, width: 400, height: 300 });

function stepRows(groupId, values) {
  return Object.freeze(values.map((value, index) => Object.freeze({
    id: `line${index + 1}`,
    label: `第 ${index + 1} 行`,
    group: groupId,
    defaultValue: value,
    limit: 11,
    bigLimit: 7,
    bigFontSizePx: 54.1666667,
    smallFontSizePx: 37.5,
    bigFamily: "bold",
    smallFamily: "medium",
    colorKey: "stepBig"
  })));
}

export const LIVE_05_LAYOUT = Object.freeze({
  id: "05",
  name: "MSBN_案型字卡",
  canvas: Object.freeze({ width: 1920, height: 1080 }),
  outputName: "MSBN_案型字卡.jpg",
  logo: Object.freeze({
    ...LIVE_01_LAYOUT.logo,
    box: Object.freeze({ x: 469, y: 56, width: 990, height: 165 })
  }),
  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 54, y: 45, width: 131, height: 177 }),
    intrinsic: Object.freeze({ width: 83, height: 112 }),
    src: Object.freeze({
      orange: new URL("../../assets/直式蝦皮購物_橘.png", import.meta.url),
      white: new URL("../../assets/直式蝦皮購物_白.png", import.meta.url)
    })
  }),
  textOrder: Object.freeze(["title", "subtitle", "warning"]),
  defaultText: Object.freeze({
    title: "12/12直播開獎",
    subtitle: "取件最高抽百萬",
    warning: "※百萬獎金均分，詳情依活動規則為準",
    steps: Object.freeze({
      step1: Object.freeze({ line1: "12/12、12/18", line2: "下單選擇", line3: "蝦皮店到店取件" }),
      step2: Object.freeze({ line1: "包裹到貨後", line2: "一天內完成取件", line3: "取件後記得完成訂單唷！" }),
      step3: Object.freeze({ line1: "12/12 12:00", line2: "鎖定直播開獎", line3: "" })
    })
  }),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標", box: Object.freeze({ x: 700, y: 263, width: 520, height: 90 }),
      photoshopPt: 19.2, fontSizePx: 80, family: "medium", colorKey: "title", limit: 8,
      maxWidth: 760, align: "center", rendering: "supersampled"
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標", box: Object.freeze({ x: 570, y: 355, width: 780, height: 125 }),
      photoshopPt: 26.4, fontSizePx: 110, family: "bold", colorKey: "subtitle", limit: 7,
      maxWidth: 780, align: "center", rendering: "direct"
    }),
    warning: Object.freeze({
      id: "warning", label: "警語", box: Object.freeze({ x: 560, y: 988, width: 800, height: 60 }),
      photoshopPt: 10.8, fontSizePx: 45, family: "regular", colorKey: "warning", limit: 18,
      maxWidth: 800, align: "center", rendering: "direct"
    })
  }),
  stepGroups: Object.freeze([
    Object.freeze({
      id: "step1", label: "STEP1", safeBox: cardSafeBox,
      rows: stepRows("step1", ["12/12、12/18", "下單選擇", "蝦皮店到店取件"])
    }),
    Object.freeze({
      id: "step2", label: "STEP2", safeBox: Object.freeze({ ...cardSafeBox, x: 760 }),
      rows: stepRows("step2", ["包裹到貨後", "一天內完成取件", "取件後記得完成訂單唷！"])
    }),
    Object.freeze({
      id: "step3", label: "STEP3", safeBox: Object.freeze({ ...cardSafeBox, x: 1204 }),
      rows: stepRows("step3", ["12/12 12:00", "鎖定直播開獎", ""])
    })
  ]),
  cardTypography: Object.freeze({
    bigBaselineInterval: 65,
    inkGaps: Object.freeze({ bigSmall: 28, smallBig: 28, smallSmall: 14 })
  }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "title", label: "主標顏色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" }),
    Object.freeze({ id: "warning", label: "警語顏色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ title: "#fffac8", subtitle: "#fff000", warning: "#ffffff", stepBig: "#b61509", stepSmall: "#ee4d2d" }),
      backgroundSrc: new URL("../assets/智取櫃/MSBN_案型字卡.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1920, height: 1080 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ title: "#472704", subtitle: "#eb1717", warning: "#472704", stepBig: "#472704", stepSmall: "#ee4d2d" }),
      backgroundSrc: new URL("../assets/門市/MSBN_案型字卡.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1920, height: 1080 })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/MSBN_案型字卡.png", import.meta.url)
});

export function getLive05Style(styleId) {
  return LIVE_05_LAYOUT.styles[styleId] ?? null;
}
