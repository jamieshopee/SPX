// SPX 開獎秀 — 線上／電子BN：05_IG layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 05 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 05 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 900 × 1600
//   背景為 legacy full-canvas fill：本檔不宣告 layout.background，
//   engine 即以 fillRect(0, 0, 900, 1600) 填滿整張畫布（同 01、02、03）
//   五個對位 box 水平中心皆為畫布中心 450，故 horizontalAlign = "center"（同 01、04）
//   小字為 Medium（同 01、03、04），因此 05 只需 Medium ＋ Bold
//   兩張底圖 intrinsic 同為 900 × 1481，滿版寬、左緣 0、底緣對齊 y = 1600
//   右上「蝦皮購物」徽章已 baked 進兩張底圖（完整含陰影為 canvas 739,119,161×162），
//   renderer 不另繪製、不引用徽章素材；對位圖標示的 753,128,147×134 為白卡
//   ／陰影內緣的對位參考，不是素材界線，兩者不得混用
//   05 沒有 CTA
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 70pt → 52.5pt、副標 88pt → 66pt、小字 40pt → 30pt。
//   52.5 為非整數 pt，必須原值保留，不得取整、不得改用 px。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// limits、default colors 為 online-bn 全版位共通值（Jamie 裁決）。
// 沒有 KV。對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_05_IG = Object.freeze({
  id: "05-ig",
  name: "05_IG",

  canvas: Object.freeze({ width: 900, height: 1600 }),

  // 05 的五個對位 box 水平中心皆為 450（＝畫布中心），因此水平為置中。
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 218, y: 383, width: 464, height: 74 }),
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
      box: Object.freeze({ x: 120, y: 486, width: 660, height: 65 }),
      photoshopPt: 70,
      canvasPt: 52.5,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 120, y: 569, width: 660, height: 85 }),
      photoshopPt: 88,
      canvasPt: 66,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 120, y: 668, width: 660, height: 38 }),
      photoshopPt: 40,
      canvasPt: 30,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 120, y: 716, width: 660, height: 38 }),
      photoshopPt: 40,
      canvasPt: 30,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2（皆 Medium）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 1800 × 3200。
  supersampledFields: Object.freeze(["title", "small1", "small2"]),
  directFields: Object.freeze(["subtitle"]),

  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "title", label: "主標顏色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" }),
    Object.freeze({ id: "small", label: "小字顏色" })
  ]),

  // backgroundPlacement 的 width／height 同時是底圖 intrinsic size 的期望值，
  // 不另設第二份尺寸常數，避免兩處數值漂移。
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      // 900 × 1481，滿版寬、左緣 0、底緣對齊 1600（119 + 1481 = 1600）。
      backgroundSrc: new URL("../assets/智取櫃/05_IG.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 119, width: 900, height: 1481 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 900 × 1481，滿版寬、左緣 0、底緣對齊 1600（119 + 1481 = 1600）。
      backgroundSrc: new URL("../assets/門市/05_IG.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 119, width: 900, height: 1481 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/05_IG.png", import.meta.url)
});
