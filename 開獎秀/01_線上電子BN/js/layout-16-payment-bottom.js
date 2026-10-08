// SPX 開獎秀 — 線上／電子BN：16_繳費機下方BN-立保
// ---------------------------------------------------------------------------
// 16 使用既有 layout engine/common contract；本檔是獨立 descriptor，
// 不 import 14、15 或建立 generic inheritance utility。
// Photoshop pt × 72/96 = Canvas pt；Medium local 2×，Bold subtitle direct。
// QR 白卡與掃碼標語已 baked-in，renderer 只畫 QR image。
// ---------------------------------------------------------------------------

export const LAYOUT_16_PAYMENT_BOTTOM = Object.freeze({
  id: "16-payment-bottom",
  name: "16_繳費機下方BN-立保",
  canvas: Object.freeze({ width: 1040, height: 578 }),
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 63, y: 123, width: 445, height: 70 }),
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
      box: Object.freeze({ x: 63, y: 216, width: 400, height: 50 }),
      photoshopPt: 54, canvasPt: 40.5, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 63, y: 282, width: 478, height: 67 }),
      photoshopPt: 71, canvasPt: 53.25, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 63, y: 363, width: 478, height: 21 }),
      photoshopPt: 23, canvasPt: 17.25, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 63, y: 391, width: 478, height: 21 }),
      photoshopPt: 23, canvasPt: 17.25, family: "medium", colorKey: "small", limit: 18
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
    box: Object.freeze({ x: 64, y: 428, width: 110, height: 110 }),
    defaultUrl: "https://shopee.tw/m/spxlottery"
  }),

  styles: Object.freeze({
    "smart-locker": Object.freeze({
      backgroundSrc: new URL("../assets/智取櫃/16_繳費機下方BN-立保.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1040, height: 578 }),
      defaultColors: Object.freeze({
        background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8"
      })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/16_繳費機下方BN-立保.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 64, y: 0, width: 976, height: 578 }),
      defaultColors: Object.freeze({
        background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/16_繳費機下方BN-立保.png", import.meta.url)
});
