// SPX 開獎秀 — 線上／電子BN：10_SKBN_PC layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 10 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 10 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 400 × 110
//   背景不是 full-canvas fill，而是透明畫布 ＋ 圓角卡片 8,7,384×96、radius 10；
//   卡片外一律保持透明（engine 以 layout.background 的 rounded-card 模式處理）。
//   這是 04 之後第二個使用 rounded-card 的版位，直接沿用既有能力，
//   不修改 layout-engine.js、也不改變 04 的既有行為。
//
//   兩個對位 box 左緣同為 17，水平中心各為 90 與 119，皆不等於畫布中心 200，
//   故 horizontalAlign = "left"（同 02、03、06），不是 08／09 的 "center"。
//
//   兩張底圖都只是右側插圖，皆小於畫布，且兩者 intrinsic 彼此也不同
//   （智取櫃 172 × 96、門市 163 × 96）；兩者皆 1:1，上緣貼卡片頂 7、
//   右緣貼卡片右 392，因此 x 必然不同（220 / 229）。
//   兩 style 的 placement 不得為了共用而強迫統一。
//   人物、智取櫃／門市店面、彩券、紅色播放 icon 與右側其他裝飾已 baked
//   進兩張底圖，renderer 不另繪製、不拆成獨立元素。
//
//   10 與 08、09 同為「非五元素」版位：renderer-owned 的只有
//     1. 主 Lottery Logo
//     2. 副標
//   沒有主標、小字 1、小字 2，也沒有 secondaryLogo、CTA、badge
//   或任何其他 renderer-owned graphic。
//
//   副標字重為 Bold，與 01～09 相同走 directFields；10 沒有 Medium 欄位，
//   因此 supersampledFields 為空陣列（engine 的 2× 層會直接 early-return，
//   不建立 offscreen）。不得為了讓它非空而新增不存在的欄位或改動 engine。
//
//   colorFields 只建立實際會影響 10 畫面的兩項（背景色、副標顏色）；
//   10 沒有主標與小字元素，因此不提供那兩個顏色控制。
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   副標 28.5pt → 21.375pt。21.375 為非整數 pt，必須原值保留，
//   不得取整、不得改用 px、不得直接以 28.5pt 作為 Canvas pt。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// 副標上限與 weighted count 為 online-bn 全版位共通值（第 2.4、2.5 節）。
// 對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_10_SKBN_PC = Object.freeze({
  id: "10-skbn-pc",
  name: "10_SKBN_PC",

  canvas: Object.freeze({ width: 400, height: 110 }),

  // 10 專屬：畫布保持透明，背景色只填這個圓角卡片（與 04 相同能力、不同數值）。
  background: Object.freeze({
    mode: "rounded-card",
    box: Object.freeze({ x: 8, y: 7, width: 384, height: 96 }),
    radius: 10
  }),

  // 兩個對位 box 左緣同為 17，水平中心 90／119 皆不等於畫布中心 200，因此靠左。
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 17, y: 24, width: 146, height: 24 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["subtitle"]),

  text: Object.freeze({
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 17, y: 56, width: 204, height: 29 }),
      photoshopPt: 28.5,
      canvasPt: 21.375,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    })
  }),

  // 10 沒有 Medium 欄位：2× 層成員為空，副標（Bold）直接繪於正式 canvas。
  supersampledFields: Object.freeze([]),
  directFields: Object.freeze(["subtitle"]),

  // 只建立實際會影響 10 畫面的顏色控制；10 無主標與小字元素。
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" })
  ]),

  // backgroundPlacement 的 width／height 同時是底圖 intrinsic size 的期望值，
  // 不另設第二份尺寸常數，避免兩處數值漂移。
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      // 172 × 96，1:1；上緣貼卡片頂 7、右緣貼卡片右 392，故 x = 392 − 172 = 220。
      backgroundSrc: new URL("../assets/智取櫃/10_SKBN_PC.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 220, y: 7, width: 172, height: 96 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        subtitle: "#fff000"
      })
    }),
    "store": Object.freeze({
      // 163 × 96，1:1；同樣貼齊卡片頂 7 與卡片右 392，故 x = 392 − 163 = 229。
      // 門市底圖比智取櫃窄 9px，x 必然不同，不得與智取櫃共用同一個 x。
      backgroundSrc: new URL("../assets/門市/10_SKBN_PC.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 229, y: 7, width: 163, height: 96 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        subtitle: "#eb1717"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/10_SKBN_PC.png", import.meta.url)
});
