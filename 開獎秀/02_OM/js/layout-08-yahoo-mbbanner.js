// SPX 開獎秀 — OM 08：Yahoo_mbbanner descriptor

export const LAYOUT_08_YAHOO_MBBANNER = Object.freeze({
  id: "yahoo-mbbanner",
  name: "Yahoo_mbbanner",
  canvas: Object.freeze({ width: 300, height: 250 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 76, y: 10, width: 148, height: 24 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 264, y: 7, width: 28, height: 39 }),
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
      box: Object.freeze({ x: 47, y: 40, width: 206, height: 20 }),
      photoshopPt: 5, fontSizePx: 20.833333333333332, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 47, y: 67, width: 206, height: 26 }),
      photoshopPt: 6.8, fontSizePx: 28.333333333333332, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 47, y: 100, width: 206, height: 10 }),
      photoshopPt: 2.5, fontSizePx: 10.416666666666666, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 47, y: 112, width: 206, height: 10 }),
      photoshopPt: 2.5, fontSizePx: 10.416666666666666, family: "medium", colorKey: "small", limit: 18
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
      backgroundSrc: new URL("../assets/智取櫃/Yahoo_mbbanner.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 130, width: 300, height: 120 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Yahoo_mbbanner.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 133, width: 300, height: 117 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlayIntrinsic: Object.freeze({ width: 300, height: 250 }),
  alignmentOverlaySrc: new URL("../assets/對位/Yahoo_mbbanner.png", import.meta.url)
});
