// SPX 開獎秀 — 線上／電子BN：11_遊戲大廳 MSBN layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 11 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 11 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 1200 × 380
//   背景不是 full-canvas fill，而是透明畫布 ＋ 圓角卡片 55,7,1090×366、radius 34；
//   卡片外一律保持透明（engine 以 layout.background 的 rounded-card 模式處理）。
//   這是 04、10 之後第三個使用 rounded-card 的版位，直接沿用既有能力，
//   不修改 layout-engine.js，也不改變 04（radius 40）與 10（radius 10）的既有行為。
//
//   五個對位 box 共用左緣 135，水平中心為 337／343、皆不等於畫布中心 600，
//   故 horizontalAlign = "left"（同 02、03、06、10）。
//
//   兩張底圖 intrinsic 皆為 1090 × 366（小於畫布），placement 也完全相同
//   （55, 7、1:1、不 crop、不 stretch）；右緣 1145、下緣 373，
//   左右邊距各 55、上下邊距各 7，即卡片在畫布中水平與垂直皆置中。
//   兩張底圖自身即帶圓角輪廓與白色外框 rim，且框內大面積為透明窗，
//   讓 rounded-card 背景色顯現；人物、智取櫃／門市場景、彩帶、
//   $1,000,000 彩券、紅色播放 icon 與右側其他裝飾皆已 baked 進底圖，
//   renderer 不另繪製、不拆成獨立元素。
//
//   11 回到 01～07 的「五元素」結構：renderer-owned 的對位元素為
//     1. 主 Lottery Logo
//     2. 主標
//     3. 副標
//     4. 小字 1
//     5. 小字 2
//   沒有 secondaryLogo、CTA、badge 或任何其他 renderer-owned graphic。
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 40pt → 30pt、副標 60pt → 45pt、小字 23pt → 17.25pt。
//   主標與副標換算後雖為整數，小字的 17.25 則為非整數 pt，必須原值保留，
//   不得取整為 17／17.5／18，也不得直接以 Photoshop 的 40／60／23
//   作為 Canvas pt、不得改用 px。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// limits、default colors 為 online-bn 全版位共通值（第 2.5、2.6 節）。
// 對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_11_MSBN = Object.freeze({
  id: "11-msbn",
  name: "11_遊戲大廳 MSBN",

  canvas: Object.freeze({ width: 1200, height: 380 }),

  // 11 專屬：畫布保持透明，背景色只填這個圓角卡片（與 04、10 相同能力、不同數值）。
  background: Object.freeze({
    mode: "rounded-card",
    box: Object.freeze({ x: 55, y: 7, width: 1090, height: 366 }),
    radius: 34
  }),

  // 五個對位 box 共用左緣 135，水平中心 337／343 皆不等於畫布中心 600，因此靠左。
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 135, y: 65, width: 404, height: 66 }),
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
      box: Object.freeze({ x: 135, y: 145, width: 404, height: 37 }),
      photoshopPt: 40,
      canvasPt: 30,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 135, y: 197, width: 416, height: 56 }),
      photoshopPt: 60,
      canvasPt: 45,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 135, y: 268, width: 416, height: 23 }),
      photoshopPt: 23,
      canvasPt: 17.25,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 135, y: 296, width: 416, height: 23 }),
      photoshopPt: 23,
      canvasPt: 17.25,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2（皆 Medium）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 2400 × 760。
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
      // 1090 × 366，1:1；與圓角卡片完全重合（55, 7），底圖透明窗露出背景色。
      backgroundSrc: new URL("../assets/智取櫃/11_遊戲大廳 MSBN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 55, y: 7, width: 1090, height: 366 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 1090 × 366，1:1；placement 與智取櫃相同，但兩張底圖內容不同，
      // 仍各自宣告 placement，不因數值相同而抽共用常數。
      backgroundSrc: new URL("../assets/門市/11_遊戲大廳 MSBN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 55, y: 7, width: 1090, height: 366 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/11_遊戲大廳 MSBN.png", import.meta.url)
});
