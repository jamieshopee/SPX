// SPX 開獎秀 — 線上／電子BN：15_繳費機直式BN-博辰
// ---------------------------------------------------------------------------
// 15 使用既有 layout engine/common contract；本檔是獨立 descriptor，
// 不 import 14 或建立 generic inheritance utility。
// Photoshop pt × 72/96 = Canvas pt；Medium local 2×，Bold subtitle direct。
// QR 白卡與掃碼標語已 baked-in，renderer 只畫 QR image。
// ---------------------------------------------------------------------------

export const LAYOUT_15_PAYMENT_VERTICAL_BOCHEN = Object.freeze({
  id: "15-payment-vertical-bochen",
  name: "15_繳費機直式BN-博辰",
  canvas: Object.freeze({ width: 2700, height: 3380 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 513, y: 276, width: 1674, height: 280 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 2107, y: 65, width: 529, height: 131 }),
    intrinsic: Object.freeze({ width: 1119, height: 275 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮購物_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮購物_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),
  text: Object.freeze({
    title: Object.freeze({
      id: "title", label: "主標",
      box: Object.freeze({ x: 513, y: 609, width: 1674, height: 184 }),
      photoshopPt: 200, canvasPt: 150, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 350, y: 866, width: 2000, height: 259 }),
      photoshopPt: 275, canvasPt: 206.25, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 289, y: 1218, width: 2122, height: 112 }),
      photoshopPt: 120, canvasPt: 90, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 289, y: 1357, width: 2122, height: 112 }),
      photoshopPt: 120, canvasPt: 90, family: "medium", colorKey: "small", limit: 18
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
    box: Object.freeze({ x: 132, y: 2760, width: 430, height: 430 }),
    defaultUrl: "https://shopee.tw/m/spxlottery"
  }),

  styles: Object.freeze({
    "smart-locker": Object.freeze({
      backgroundSrc: new URL("../assets/智取櫃/15_ 繳費機直式BN-博辰.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 1507, width: 2700, height: 1873 }),
      defaultColors: Object.freeze({
        background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8"
      })
    }),
    store: Object.freeze({
      backgroundSrc: new URL("../assets/門市/15_繳費機直式BN-博辰.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 1586, width: 2700, height: 1794 }),
      defaultColors: Object.freeze({
        background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/15_ 繳費機直式BN-博辰.png", import.meta.url)
});
