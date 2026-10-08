// SPX 開獎秀 — 線上／電子BN：07_OM與FEED layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 07 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 07 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 1000 × 1000（online-bn 第一個正方形版位）
//   背景為 legacy full-canvas fill：本檔不宣告 layout.background，
//   engine 即以 fillRect(0, 0, 1000, 1000) 填滿整張畫布（同 01、02、03、05、06）
//   主 Logo ＋ 四個文字的對位 box 水平中心皆為畫布中心 500，
//   故 horizontalAlign = "center"（同 01、04、05）
//   小字為 Medium（同 01、03、04、05、06），因此 07 只需 Medium ＋ Bold
//   兩張底圖皆滿版寬 1000、貼齊畫布底緣，但高度不同（501 / 499），
//   因此兩個 style 的 placement y 不同（499 / 501），不得寫成同一值
//   07 沒有 KV、沒有 CTA、沒有 badge，也不使用 06 導入的 optional
//   secondaryLogo —— 人物、置物櫃、店面、彩帶、彩券等一律 baked into style 底圖
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 70pt → 52.5pt、副標 88pt → 66pt、小字 35pt → 26.25pt。
//   52.5 與 26.25 為非整數 pt，必須原值保留，不得取整、不得改用 px。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// limits、default colors 為 online-bn 全版位共通值（Jamie 裁決）。
// 對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_07_OM_FEED = Object.freeze({
  id: "07-om-feed",
  name: "07_OM與FEED",

  canvas: Object.freeze({ width: 1000, height: 1000 }),

  // 07 的五個對位 box 水平中心皆為 500（＝畫布中心），因此水平為置中。
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 249, y: 119, width: 502, height: 81 }),
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
      box: Object.freeze({ x: 170, y: 221, width: 660, height: 65 }),
      photoshopPt: 70,
      canvasPt: 52.5,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 170, y: 304, width: 660, height: 84 }),
      photoshopPt: 88,
      canvasPt: 66,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 170, y: 403, width: 660, height: 34 }),
      photoshopPt: 35,
      canvasPt: 26.25,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 170, y: 446, width: 660, height: 34 }),
      photoshopPt: 35,
      canvasPt: 26.25,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2（皆 Medium）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 2000 × 2000。
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
      // 1000 × 501，滿版寬、左緣 0、底緣對齊 1000（499 + 501 = 1000）。
      backgroundSrc: new URL("../assets/智取櫃/07_OM與FEED.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 499, width: 1000, height: 501 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 1000 × 499，滿版寬、左緣 0、底緣對齊 1000（501 + 499 = 1000）。
      // 高度比智取櫃少 2px，因此 y 為 501，與智取櫃的 499 不同。
      backgroundSrc: new URL("../assets/門市/07_OM與FEED.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 501, width: 1000, height: 499 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/07_OM與FEED.png", import.meta.url)
});
