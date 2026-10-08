// SPX 開獎秀 — OM 07：Pixnet_Side sticker_Banner descriptor

export const LAYOUT_07_PIXNET_SIDE_STICKER_BANNER = Object.freeze({
  id: "pixnet-side-sticker-banner",
  name: "Pixnet_Side sticker_Banner",
  canvas: Object.freeze({ width: 672, height: 560 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 166, y: 20, width: 340, height: 43 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 594, y: 17, width: 59, height: 81 }),
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
      box: Object.freeze({ x: 106, y: 76, width: 459, height: 35 }),
      photoshopPt: 9, fontSizePx: 37.5, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 106, y: 122, width: 459, height: 51 }),
      photoshopPt: 12.4, fontSizePx: 51.666666666666664, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 106, y: 185, width: 459, height: 18 }),
      photoshopPt: 4.5, fontSizePx: 18.75, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 106, y: 207, width: 459, height: 18 }),
      photoshopPt: 4.5, fontSizePx: 18.75, family: "medium", colorKey: "small", limit: 18
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
      backgroundSrc: new URL("../assets/智取櫃/Pixnet_Side sticker_Banner.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 232, width: 672, height: 328 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Pixnet_Side sticker_Banner.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 237, width: 672, height: 323 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlayIntrinsic: Object.freeze({ width: 672, height: 560 }),
  alignmentOverlaySrc: new URL("../assets/對位/Pixnet_Side sticker_Banner.png", import.meta.url)
});
