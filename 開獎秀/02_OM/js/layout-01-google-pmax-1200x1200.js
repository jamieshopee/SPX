// SPX 開獎秀 — OM 01：Google Pmax 1200×1200 descriptor

export const LAYOUT_01_GOOGLE_PMAX_1200X1200 = Object.freeze({
  id: "google-pmax-1200x1200",
  name: "Google_Pmax_1200x1200",
  canvas: Object.freeze({ width: 1200, height: 1200 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 297, y: 123, width: 605, height: 98 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 1073, y: 25, width: 100, height: 136 }),
    intrinsic: Object.freeze({ width: 83, height: 112 }),
    src: Object.freeze({
      orange: new URL("../../assets/直式蝦皮購物_橘.png", import.meta.url),
      white: new URL("../../assets/直式蝦皮購物_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標",
      box: Object.freeze({ x: 191, y: 248, width: 820, height: 82 }),
      photoshopPt: 21.2, fontSizePx: 88.33333333333333, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 191, y: 352, width: 820, height: 111 }),
      photoshopPt: 28.5, fontSizePx: 118.75, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 191, y: 492, width: 820, height: 41 }),
      photoshopPt: 10, fontSizePx: 41.66666666666667, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 191, y: 543, width: 820, height: 41 }),
      photoshopPt: 10, fontSizePx: 41.66666666666667, family: "medium", colorKey: "small", limit: 18
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
      backgroundSrc: new URL("../assets/智取櫃/Google_Pmax_1200x1200.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 9, width: 1200, height: 1191 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Google_Pmax_1200x1200.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 625, width: 1200, height: 575 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/Google_Pmax_1200x1200.png", import.meta.url)
});
