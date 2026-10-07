// SPX 開獎秀 — OM 06：Pixnet_Side sticker_side image descriptor

export const LAYOUT_06_PIXNET_SIDE_STICKER_SIDE_IMAGE = Object.freeze({
  id: "pixnet-side-sticker-side-image",
  name: "Pixnet_Side sticker_side image",
  canvas: Object.freeze({ width: 260, height: 480 }),
  horizontalAlign: "center",
  backgroundShape: Object.freeze({
    type: "roundedRect",
    x: 8,
    y: 55,
    width: 245,
    height: 409,
    radius: 20,
    transparentOutside: true
  }),

  logo: Object.freeze({
    box: Object.freeze({ x: 49, y: 76, width: 162, height: 26 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標",
      box: Object.freeze({ x: 26, y: 112, width: 206, height: 22 }),
      photoshopPt: 5.7, fontSizePx: 23.75, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 26, y: 140, width: 207, height: 28 }),
      photoshopPt: 7, fontSizePx: 29.166666666666668, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 19, y: 175, width: 221, height: 11 }),
      photoshopPt: 2.8, fontSizePx: 11.666666666666666, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 19, y: 189, width: 221, height: 11 }),
      photoshopPt: 2.8, fontSizePx: 11.666666666666666, family: "medium", colorKey: "small", limit: 18
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
      backgroundSrc: new URL("../assets/智取櫃/Pixnet_Side sticker_side image.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 8, y: 4, width: 245, height: 476 }),
      defaultColors: Object.freeze({ background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8" })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/Pixnet_Side sticker_side image.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 4, y: 4, width: 253, height: 476 }),
      defaultColors: Object.freeze({ background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704" })
    })
  }),

  alignmentOverlayIntrinsic: Object.freeze({ width: 260, height: 480 }),
  alignmentOverlaySrc: new URL("../assets/對位/Pixnet_Side sticker_side image.png", import.meta.url)
});
