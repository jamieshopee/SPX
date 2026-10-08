// SPX 開獎秀 — 直播 01：直播大廳 LPBN_立即看 descriptor

export const LIVE_01_LAYOUT = Object.freeze({
  id: "01",
  name: "直播大廳 LPBN_立即看",
  canvas: Object.freeze({ width: 1125, height: 360 }),
  logo: Object.freeze({
    box: Object.freeze({ x: 54, y: 23, width: 485, height: 78 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),
  textOrder: Object.freeze(["titleTime", "subtitle", "warning"]),
  text: Object.freeze({
    titleTime: Object.freeze({
      id: "titleTime", label: "主標＋時間",
      box: Object.freeze({ x: 54, y: 118, width: 485, height: 37 }),
      photoshopPt: 9.6, fontSizePx: 40, family: "medium", colorKey: "titleTime", limit: 13,
      align: "left", rendering: "supersampled"
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 54, y: 169, width: 485, height: 63 }),
      photoshopPt: 16, fontSizePx: 66.66666666666667, family: "bold", colorKey: "subtitle", limit: 7,
      align: "left", rendering: "direct"
    }),
    warning: Object.freeze({
      id: "warning", label: "警語",
      box: Object.freeze({ x: 788, y: 334, width: 320, height: 17 }),
      photoshopPt: 4.3, fontSizePx: 17.916666666666668, family: "regular", colorKey: "warning", limit: 18,
      align: "right", rendering: "direct"
    })
  }),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ titleTime: "#fffac8", subtitle: "#fff000", warning: "#000000" }),
      backgroundSrc: new URL("../assets/智取櫃/直播大廳 LPBN_立即看.png", import.meta.url)
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ titleTime: "#472704", subtitle: "#eb1717", warning: "#000000" }),
      backgroundSrc: new URL("../assets/門市/直播大廳 LPBN_立即看.png", import.meta.url)
    })
  }),
  backgroundPlacement: Object.freeze({ x: 53, y: 0, width: 1072, height: 360 }),
  alignmentOverlaySrc: new URL("../assets/對位/直播大廳 LPBN_立即看.png", import.meta.url)
});

export function getLive01Style(styleId) {
  return LIVE_01_LAYOUT.styles[styleId] ?? null;
}
