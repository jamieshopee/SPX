// 12_TVBN_一般門市：Phase A geometry + Jamie Phase B/C 正式裁決。
// 所有版位數值只在 descriptor；沿用 full-canvas background 與共用 renderer。
// QR 白卡、掃碼標語、卡底蝦皮購物已 baked-in，renderer 只畫 encoder output。
// Photoshop pt × 72/96 = Canvas pt；Medium local2×，Bold subtitle direct。
export const LAYOUT_12_TVBN_STORE = Object.freeze({
  id: "12-tvbn-store",
  name: "12_TVBN_一般門市",
  canvas: Object.freeze({ width: 1599, height: 1080 }),
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 59, y: 242, width: 702, height: 113 }),
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
      box: Object.freeze({ x: 59, y: 396, width: 691, height: 79 }),
      photoshopPt: 83, canvasPt: 62.25, family: "medium", colorKey: "title", limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle", label: "副標",
      box: Object.freeze({ x: 59, y: 499, width: 690, height: 92 }),
      photoshopPt: 97, canvasPt: 72.75, family: "bold", colorKey: "subtitle", limit: 7
    }),
    small1: Object.freeze({
      id: "small1", label: "小字 1",
      box: Object.freeze({ x: 59, y: 615, width: 690, height: 39 }),
      photoshopPt: 38, canvasPt: 28.5, family: "medium", colorKey: "small", limit: 18
    }),
    small2: Object.freeze({
      id: "small2", label: "小字 2",
      box: Object.freeze({ x: 59, y: 660, width: 690, height: 39 }),
      photoshopPt: 38, canvasPt: 28.5, family: "medium", colorKey: "small", limit: 18
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
    box: Object.freeze({ x: 60, y: 785, width: 220, height: 220 }),
    defaultUrl: "https://shopee.tw/m/spxlottery"
  }),

  styles: Object.freeze({
    "smart-locker": Object.freeze({
      backgroundSrc: new URL("../assets/智取櫃/12_TVBN_一般門市.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1599, height: 1080 }),
      defaultColors: Object.freeze({
        background: "#2660ad", title: "#fffac8", subtitle: "#fff000", small: "#fffac8"
      })
    }),
    store: Object.freeze({
      // intrinsic 1539×1080，原尺寸平移 x=60；不 stretch、不 crop。
      backgroundSrc: new URL("../assets/門市/12_TVBN_一般門市.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 60, y: 0, width: 1539, height: 1080 }),
      defaultColors: Object.freeze({
        background: "#ffda46", title: "#472704", subtitle: "#eb1717", small: "#472704"
      })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/12_TVBN_一般門市.png", import.meta.url)
});
