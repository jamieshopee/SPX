// SPX 開獎秀 — OM 03：Google Pmax 960×1200 descriptor

export const LAYOUT_03_GOOGLE_PMAX_960X1200 = Object.freeze({
  id: "google-pmax-960x1200",
  name: "Google_Pmax_960x1200",
  canvas: Object.freeze({ width: 960, height: 1200 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 178, y: 131, width: 607, height: 92 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 829, y: 27, width: 100, height: 136 }),
    intrinsic: Object.freeze({ width: 83, height: 112 }),
    src: Object.freeze({
      orange: new URL("../assets/直式蝦皮購物_橘.png", import.meta.url),
      white: new URL("../assets/直式蝦皮購物_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標",
      box: Object.freeze({ x: 71, y: 245, width: 820, height: 74 }),
      photoshopPt: 19, fontSizePx: 79.16666666666667, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 71, y: 338, width: 820, height: 100 }),
      photoshopPt: 25.5, fontSizePx: 106.25, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 71, y: 464, width: 820, height: 36 }),
      photoshopPt: 9, fontSizePx: 37.5, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 71, y: 511, width: 820, height: 36 }),
      photoshopPt: 9, fontSizePx: 37.5, family: "medium", colorKey: "small", limit: 18
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
      backgroundSrc: new URL("../assets/智取櫃/Google_Pmax_960x1200.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 566, width: 960, height: 634 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Google_Pmax_960x1200.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 569, width: 960, height: 631 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/Google_Pmax_960x1200.png", import.meta.url)
});
