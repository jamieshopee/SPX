// SPX 開獎秀 — 直播 03：直播時縮圖_指定日 descriptor

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";

export const LIVE_03_LAYOUT = Object.freeze({
  id: "03",
  name: "直播時縮圖_指定日",
  canvas: Object.freeze({ width: 720, height: 720 }),
  outputName: "直播時縮圖_指定日.jpg",
  logo: Object.freeze({
    ...LIVE_01_LAYOUT.logo,
    box: Object.freeze({ x: 203, y: 105, width: 315, height: 52 })
  }),
  textOrder: Object.freeze(["big", "small1", "small2"]),
  defaultText: Object.freeze({
    big: "取件最高抽百萬",
    small1: "10/10-12/30下單，在到貨一天內取件限定",
    small2: "百萬獎金均分，詳情依活動規則為準"
  }),
  text: Object.freeze({
    big: Object.freeze({
      id: "big", label: "大字", box: Object.freeze({ x: 100, y: 166, width: 520, height: 70 }),
      photoshopPt: 14.16, fontSizePx: 59, family: "bold", colorKey: "big", limit: 7,
      align: "center", rendering: "direct"
    }),
    small1: Object.freeze({
      id: "small1", label: "小字第一行", box: Object.freeze({ x: 70, y: 239, width: 580, height: 34 }),
      photoshopPt: 6, fontSizePx: 25, family: "regular", colorKey: "small", limit: 18,
      align: "center", rendering: "direct"
    }),
    small2: Object.freeze({
      id: "small2", label: "小字第二行", box: Object.freeze({ x: 70, y: 274, width: 580, height: 34 }),
      photoshopPt: 6, fontSizePx: 25, family: "regular", colorKey: "small", limit: 18,
      align: "center", rendering: "direct"
    })
  }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "big", label: "大字顏色" }),
    Object.freeze({ id: "small", label: "小字顏色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ big: "#fff000", small: "#fffac8" }),
      backgroundSrc: new URL("../assets/智取櫃/直播時縮圖_指定日.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 314, width: 720, height: 406 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ big: "#eb1717", small: "#472704" }),
      backgroundSrc: new URL("../assets/門市/直播時縮圖_指定日.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 319, width: 720, height: 401 })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/直播時縮圖_指定日.png", import.meta.url)
});

export function getLive03Style(styleId) {
  return LIVE_03_LAYOUT.styles[styleId] ?? null;
}
