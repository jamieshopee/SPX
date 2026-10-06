// SPX 開獎秀 — 線上／電子BN：17_繳費機下方BN-博辰
// ---------------------------------------------------------------------------
// 17 使用既有 layout engine/common contract；本檔是獨立 descriptor。
// Photoshop pt × 72/96 = Canvas pt；Medium local 2×，Bold subtitle direct。
// QR 白卡與掃碼標語已 baked-in，renderer 只畫 QR image。
// ---------------------------------------------------------------------------

export const LAYOUT_17_PAYMENT_BOTTOM_BOCHEN = Object.freeze({
  id: "17-payment-bottom-bochen",
  name: "17_繳費機下方BN-博辰",
  canvas: Object.freeze({ width: 984, height: 309 }),
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 46, y: 40, width: 374, height: 62 }),
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
      box: Object.freeze({ x: 46, y: 118, width: 300, height: 41 }),
      photoshopPt: 44, canvasPt: 33, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 46, y: 170, width: 415, height: 56 }),
      photoshopPt: 59, canvasPt: 44.25, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 46, y: 239, width: 415, height: 22 }),
      photoshopPt: 22, canvasPt: 16.5, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 46, y: 268, width: 415, height: 22 }),
      photoshopPt: 22, canvasPt: 16.5, family: "medium", colorKey: "small", limit: 18
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

  qr: Object.freeze({
    box: Object.freeze({ x: 898, y: 207, width: 80, height: 80 }),
    defaultUrl: "https://shopee.tw/m/spxlottery"
  }),

  styles: Object.freeze({
    "smart-locker": Object.freeze({
      backgroundSrc: new URL("../assets/智取櫃/17_繳費機下方BN-博辰.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 984, height: 309 }),
      defaultColors: Object.freeze({
        background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8"
      })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/17_繳費機下方BN-博辰.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 498, y: 0, width: 486, height: 309 }),
      defaultColors: Object.freeze({
        background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/17_繳費機下方BN-博辰.png", import.meta.url)
});
