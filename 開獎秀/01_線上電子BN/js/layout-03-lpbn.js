// SPX 開獎秀 — 線上／電子BN：03_LPBN layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 03 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增 descriptor API。
//
// 03 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 1200 × 550
//   五個對位 box 共用左緣 x=58，故 horizontalAlign = "left"
//   小字為 Medium（與 01 同、與 02 的 Regular 不同），因此 03 只需 Medium ＋ Bold
//   store 底圖 688 × 550 小於畫布，右對齊 x = 1200 − 688 = 512
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 52pt → 39pt、副標 66pt → 49.5pt、小字 23.5pt → 17.625pt。
//   49.5 與 17.625 為非整數 pt，必須原值保留，不得取整、不得改用 px。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// limits、default colors 為 online-bn 全版位共通值（Jamie 裁決）。
// 沒有 KV。對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_03_LPBN = Object.freeze({
  id: "03-lpbn",
  name: "03_LPBN",

  canvas: Object.freeze({ width: 1200, height: 550 }),

  // 03 的五個對位 box 共用左緣 x=58、水平中心各異，因此水平為左對齊。
  // Logo 與四個文字皆以各自 box 的左緣為水平 anchor。
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 58, y: 162, width: 375, height: 61 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),

  text: Object.freeze({
    title: Object.freeze({
      id: "title",
      label: "主標",
      box: Object.freeze({ x: 58, y: 240, width: 405, height: 49 }),
      photoshopPt: 52,
      canvasPt: 39,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 58, y: 300, width: 475, height: 62 }),
      photoshopPt: 66,
      canvasPt: 49.5,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 58, y: 374, width: 475, height: 22 }),
      photoshopPt: 23.5,
      canvasPt: 17.625,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 58, y: 402, width: 475, height: 22 }),
      photoshopPt: 23.5,
      canvasPt: 17.625,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2（皆 Medium）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 2400 × 1100。
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
      backgroundSrc: new URL("../assets/智取櫃/03_LPBN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1200, height: 550 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 688 × 550 小於畫布寬，右對齊：512 + 688 = 1200。原尺寸 1:1，不 stretch。
      backgroundSrc: new URL("../assets/門市/03_LPBN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 512, y: 0, width: 688, height: 550 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/03_LPBN.png", import.meta.url)
});
