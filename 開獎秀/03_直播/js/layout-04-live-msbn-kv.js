// SPX 開獎秀 — 直播 04：MSBN_KV descriptor

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";

export const LIVE_04_LAYOUT = Object.freeze({
  id: "04",
  name: "MSBN_KV",
  canvas: Object.freeze({ width: 1200, height: 360 }),
  outputName: "MSBN_KV.jpg",
  logo: Object.freeze({
    ...LIVE_01_LAYOUT.logo,
    box: Object.freeze({ x: 99, y: 66, width: 439, height: 47 })
  }),
  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),
  defaultText: Object.freeze({
    title: "12/12直播開獎",
    subtitle: "取件最高抽百萬",
    small1: "10/10-12/30下單，在到貨一天內取件限定",
    small2: "百萬獎金均分，詳情依活動規則為準"
  }),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標", box: Object.freeze({ x: 99, y: 119, width: 440, height: 42 }),
      photoshopPt: 9.6, fontSizePx: 40, family: "medium", colorKey: "title", limit: 8,
      align: "left", rendering: "supersampled"
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標", box: Object.freeze({ x: 99, y: 171, width: 439, height: 56 }),
      photoshopPt: 14.4, fontSizePx: 60, family: "bold", colorKey: "subtitle", limit: 7,
      align: "left", rendering: "direct"
    }),
    small1: Object.freeze({
      id: "small1", label: "小字第一行", box: Object.freeze({ x: 99, y: 242, width: 439, height: 23 }),
      photoshopPt: 5.76, fontSizePx: 24, family: "regular", colorKey: "small", limit: 18,
      align: "left", rendering: "direct"
    }),
    small2: Object.freeze({
      id: "small2", label: "小字第二行", box: Object.freeze({ x: 99, y: 272, width: 439, height: 23 }),
      photoshopPt: 5.76, fontSizePx: 24, family: "regular", colorKey: "small", limit: 18,
      align: "left", rendering: "direct"
    })
  }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "title", label: "主標顏色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" }),
    Object.freeze({ id: "small", label: "小字顏色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ title: "#fffac8", subtitle: "#fff000", small: "#fffac8" }),
      backgroundSrc: new URL("../assets/智取櫃/MSBN_KV.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 551, y: 0, width: 649, height: 360 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ title: "#472704", subtitle: "#eb1717", small: "#472704" }),
      backgroundSrc: new URL("../assets/門市/MSBN_KV.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1195, height: 360 })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/MSBN_KV.png", import.meta.url)
});

export function getLive04Style(styleId) {
  return LIVE_04_LAYOUT.styles[styleId] ?? null;
}
