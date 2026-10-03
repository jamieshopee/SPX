// SPX 開獎秀 — 線上／電子BN：04_POP UP layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 04 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 04 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 580 × 720
//   背景不是 full-canvas fill，而是透明畫布 ＋ 圓角卡片 53,27,475×658、radius 40；
//   卡片外一律保持透明（engine 以 layout.background 的 rounded-card 模式處理）
//   五個對位 box 水平中心皆為畫布中心 290，故 horizontalAlign = "center"（同 01）
//   小字為 Medium（同 01、03），因此 04 只需 Medium ＋ Bold
//   兩張底圖皆小於畫布且高度不同，左緣貼卡片左緣 53、底緣對齊 y = 699
//   「看更多」CTA 已 baked 進兩張底圖，renderer 不另繪製、不引用 CTA 素材
//   底圖下緣 699 低於卡片底 684，CTA 跨出卡片下緣為正式設計，不裁切
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 40pt → 30pt、副標 55pt → 41.25pt、小字 25pt → 18.75pt。
//   41.25 與 18.75 為非整數 pt，必須原值保留，不得取整、不得改用 px。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// limits、default colors 為 online-bn 全版位共通值（Jamie 裁決）。
// 沒有 KV。對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_04_POP_UP = Object.freeze({
  id: "04-pop-up",
  name: "04_POP UP",

  canvas: Object.freeze({ width: 580, height: 720 }),

  // 04 專屬：畫布保持透明，背景色只填這個圓角卡片。
  background: Object.freeze({
    mode: "rounded-card",
    box: Object.freeze({ x: 53, y: 27, width: 475, height: 658 }),
    radius: 40
  }),

  // 04 的五個對位 box 水平中心皆為 290（＝畫布中心），因此水平為置中。
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 134, y: 103, width: 313, height: 48 }),
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
      box: Object.freeze({ x: 134, y: 172, width: 313, height: 38 }),
      photoshopPt: 40,
      canvasPt: 30,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 85, y: 223, width: 410, height: 52 }),
      photoshopPt: 55,
      canvasPt: 41.25,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 85, y: 286, width: 410, height: 25 }),
      photoshopPt: 25,
      canvasPt: 18.75,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 85, y: 320, width: 410, height: 25 }),
      photoshopPt: 25,
      canvasPt: 18.75,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2（皆 Medium）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 1160 × 1440。
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
      // 475 × 347，左緣貼卡片左緣 53、底緣對齊 699（CTA 跨出卡片底 684 為正式設計）。
      backgroundSrc: new URL("../assets/智取櫃/04_POP UP.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 53, y: 353, width: 475, height: 347 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 475 × 338，左緣貼卡片左緣 53、底緣對齊 699。
      backgroundSrc: new URL("../assets/門市/04_POP UP.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 53, y: 362, width: 475, height: 338 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/04_POP UP.png", import.meta.url)
});
