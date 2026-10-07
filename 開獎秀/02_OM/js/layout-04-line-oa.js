// SPX 開獎秀 — OM 04：Line OA descriptor

export const LAYOUT_04_LINE_OA = Object.freeze({
  id: "line-oa",
  name: "Line OA",
  canvas: Object.freeze({ width: 1040, height: 1040 }),
  horizontalAlign: "center",
  backgroundShape: Object.freeze({
    type: "roundedRect",
    x: 12,
    y: 12,
    width: 1016,
    height: 989,
    radius: 30,
    transparentOutside: true
  }),

  logo: Object.freeze({
    box: Object.freeze({ x: 257, y: 131, width: 526, height: 81 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 883, y: 42, width: 102, height: 140 }),
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
      box: Object.freeze({ x: 166, y: 244, width: 711, height: 68 }),
      photoshopPt: 17.5, fontSizePx: 72.91666666666667, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 166, y: 329, width: 711, height: 87 }),
      photoshopPt: 22, fontSizePx: 91.66666666666667, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 166, y: 433, width: 711, height: 37 }),
      photoshopPt: 9.5, fontSizePx: 39.583333333333336, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 166, y: 482, width: 711, height: 37 }),
      photoshopPt: 9.5, fontSizePx: 39.583333333333336, family: "medium", colorKey: "small", limit: 18
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
      backgroundSrc: new URL("../assets/智取櫃/Line OA.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 12, y: 548, width: 1016, height: 471 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Line OA.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 12, y: 197, width: 1016, height: 822 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlayIntrinsic: Object.freeze({ width: 1040, height: 1039 }),
  alignmentOverlaySrc: new URL("../assets/對位/Line OA.png", import.meta.url)
});
