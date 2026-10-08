// SPX 開獎秀 — OM 02：Google Pmax 1200×628 descriptor

export const LAYOUT_02_GOOGLE_PMAX_1200X628 = Object.freeze({
  id: "google-pmax-1200x628",
  name: "Google_Pmax_1200x628",
  canvas: Object.freeze({ width: 1200, height: 628 }),
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 42, y: 192, width: 359, height: 58 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標",
      box: Object.freeze({ x: 42, y: 267, width: 532, height: 54 }),
      photoshopPt: 14, fontSizePx: 58.333333333333336, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 42, y: 339, width: 532, height: 75 }),
      photoshopPt: 19, fontSizePx: 79.16666666666667, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 42, y: 429, width: 532, height: 28 }),
      photoshopPt: 7, fontSizePx: 29.166666666666668, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 42, y: 464, width: 532, height: 28 }),
      photoshopPt: 7, fontSizePx: 29.166666666666668, family: "medium", colorKey: "small", limit: 18
    })
  }),

  supersampledFields: Object.freeze(["title", "small1", "small2"]),
  directFields: Object.freeze(["subtitle"]),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "title", label: "主標顏色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" }),
    Object.freeze({ id: "small", label: "小字顏色" })
  ]),

  styles: Object.freeze({
    "smart-locker": Object.freeze({
      backgroundSrc: new URL("../assets/智取櫃/Google_Pmax_1200x628.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 598, y: 0, width: 602, height: 628 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Google_Pmax_1200x628.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 615, y: 0, width: 585, height: 628 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/Google_Pmax_1200x628.png", import.meta.url)
});
