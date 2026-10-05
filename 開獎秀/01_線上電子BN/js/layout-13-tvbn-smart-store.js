// 13_TVBN_智取店：Phase A geometry + Jamie Phase B/C 正式裁決。
// 所有版位數值只在 descriptor；沿用 full-canvas background 與共用 renderer。
// QR 白卡、掃碼標語、右下蝦皮購物已 baked-in，renderer 只畫 encoder output。
// Photoshop pt × 72/96 = Canvas pt；Medium local2×，Bold subtitle direct。
export const LAYOUT_13_TVBN_SMART_STORE = Object.freeze({
  id: "13-tvbn-smart-store",
  name: "13_TVBN_智取店",
  canvas: Object.freeze({ width: 1080, height: 1920 }),
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 212, y: 220, width: 656, height: 105 }),
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
      box: Object.freeze({ x: 212, y: 356, width: 656, height: 84 }),
      photoshopPt: 89, canvasPt: 66.75, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 115, y: 468, width: 850, height: 115 }),
      photoshopPt: 122, canvasPt: 91.5, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 71, y: 615, width: 939, height: 51 }),
      photoshopPt: 53, canvasPt: 39.75, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 71, y: 681, width: 939, height: 51 }),
      photoshopPt: 53, canvasPt: 39.75, family: "medium", colorKey: "small", limit: 18
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
    box: Object.freeze({ x: 52, y: 1690, width: 160, height: 160 }),
    defaultUrl: "https://shopee.tw/m/spxlottery"
  }),

  styles: Object.freeze({
    "smart-locker": Object.freeze({
      backgroundSrc: new URL("../assets/智取櫃/13_TVBN_智取店.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 820, width: 1080, height: 1100 }),
      defaultColors: Object.freeze({
        background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8"
      })
    }),
    store: Object.freeze({
      // intrinsic 1080×1147，原尺寸平移 y=773；不 stretch、不 crop。
      backgroundSrc: new URL("../assets/門市/13_TVBN_智取店.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 773, width: 1080, height: 1147 }),
      defaultColors: Object.freeze({
        background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704"
      })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/13_TVBN_智取店.png", import.meta.url)
});
