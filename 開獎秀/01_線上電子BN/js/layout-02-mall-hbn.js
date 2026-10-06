// SPX 開獎秀 — 線上／電子BN：02_Mall HBN layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 02 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine。
//
// 02 與 01 的版位層差異（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 1200 × 360（01 為 531 × 792）
//   五個對位 box 共用左緣 x=98（01 為共用水平中心），故 horizontalAlign = "left"
//   小字 1／2 為 Regular（01 為 Medium）
//   store 底圖 1153 × 360 小於畫布，右對齊 x = 1200 − 1153 = 47
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 40pt → 30pt、副標 60pt → 45pt、小字 24pt → 18pt。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt，不得寫 px。
//
// limits、default colors 為 online-bn 全版位共通值（Jamie 裁決）。
// 沒有 KV。對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_02_MALL_HBN = Object.freeze({
  id: "02-mall-hbn",
  name: "02_Mall HBN",

  canvas: Object.freeze({ width: 1200, height: 360 }),

  // 02 的五個對位 box 共用左緣 x=98、水平中心各異，因此水平為左對齊。
  // Logo 與四個文字皆以各自 box 的左緣為水平 anchor。
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 98, y: 66, width: 351, height: 50 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),

  text: Object.freeze({
    title: Object.freeze({
      id: "title",
      label: "主標",
      box: Object.freeze({ x: 98, y: 123, width: 351, height: 37 }),
      photoshopPt: 40,
      canvasPt: 30,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 98, y: 170, width: 445, height: 57 }),
      photoshopPt: 60,
      canvasPt: 45,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 98, y: 243, width: 445, height: 22 }),
      photoshopPt: 24,
      canvasPt: 18,
      family: "regular",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 98, y: 272, width: 445, height: 22 }),
      photoshopPt: 24,
      canvasPt: 18,
      family: "regular",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標（Medium）＋小字1／小字2（Regular）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 2400 × 720。
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
      backgroundSrc: new URL("../assets/智取櫃/02_Mall HBN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1200, height: 360 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 1153 × 360 小於畫布寬，右對齊：47 + 1153 = 1200。原尺寸 1:1，不 stretch。
      backgroundSrc: new URL("../assets/門市/02_Mall HBN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 47, y: 0, width: 1153, height: 360 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/02_Mall HBN.png", import.meta.url)
});
