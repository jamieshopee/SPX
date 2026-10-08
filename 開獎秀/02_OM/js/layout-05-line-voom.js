// SPX 開獎秀 — OM 05：Line Voom descriptor

export const LAYOUT_05_LINE_VOOM = Object.freeze({
  id: "line-voom",
  name: "Line Voom",
  canvas: Object.freeze({ width: 1080, height: 1080 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 263, y: 121, width: 554, height: 90 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 929, y: 25, width: 107, height: 146 }),
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
      box: Object.freeze({ x: 171, y: 242, width: 738, height: 69 }),
      photoshopPt: 18, fontSizePx: 75, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 171, y: 329, width: 738, height: 90 }),
      photoshopPt: 23, fontSizePx: 95.83333333333333, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 171, y: 435, width: 738, height: 39 }),
      photoshopPt: 10, fontSizePx: 41.66666666666667, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 171, y: 485, width: 738, height: 39 }),
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
      backgroundSrc: new URL("../assets/智取櫃/Line Voom.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1080, height: 1080 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Line Voom.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 550, width: 1080, height: 530 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlayIntrinsic: Object.freeze({ width: 1080, height: 1080 }),
  alignmentOverlaySrc: new URL("../assets/對位/Line Voom.png", import.meta.url)
});
