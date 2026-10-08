// SPX 開獎秀 — 線上／電子BN：09_SKBN_APP中 layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 09 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 09 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 484 × 360
//   背景為 legacy full-canvas fill：本檔不宣告 layout.background，
//   engine 即以 fillRect(0, 0, 484, 360) 填滿整張畫布
//   兩張底圖 intrinsic 皆等於畫布，placement 完全相同（0, 0, 484 × 360、1:1）；
//   底圖已 baked 白色圓角外框、人物、智取櫃／門市店面、彩帶、彩券、播放 icon，
//   框內上半為透明，讓背景色與下列兩個 renderer 元素顯現
//   兩個對位 box 水平中心皆為畫布中心 242，故 horizontalAlign = "center"
//
//   09 與 08 同為「非五元素」版位：renderer-owned 的只有
//     1. 主 Lottery Logo
//     2. 副標
//   沒有主標、小字 1、小字 2，也沒有 secondaryLogo、CTA、badge
//   或任何其他 renderer-owned graphic。對位圖的 0,0,484×360 外框是
//   safe-area 標記，不是 renderer box，本檔不為它建立任何欄位。
//
//   副標字重為 Bold，與 01～08 相同走 directFields；09 沒有 Medium 欄位，
//   因此 supersampledFields 為空陣列（engine 的 2× 層會直接 early-return，
//   不建立 offscreen）。不得為了讓它非空而新增不存在的欄位或改動 engine。
//
//   colorFields 只建立實際會影響 09 畫面的兩項（背景色、副標顏色）；
//   09 沒有主標與小字元素，因此不提供那兩個顏色控制。
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   副標 46pt → 34.5pt。34.5 為非整數 pt，必須原值保留，
//   不得取整、不得改用 px、不得直接以 46pt 作為 Canvas pt。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// 副標上限與 weighted count 為 online-bn 全版位共通值（第 2.4、2.5 節）。
// 對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_09_SKBN_APP_MID = Object.freeze({
  id: "09-skbn-app-mid",
  name: "09_SKBN_APP中",

  canvas: Object.freeze({ width: 484, height: 360 }),

  // 兩個對位 box 水平中心皆為 242（＝畫布中心），因此水平為置中。
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 131, y: 33, width: 222, height: 36 }),
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
      box: Object.freeze({ x: 80, y: 81, width: 324, height: 44 }),
      photoshopPt: 46,
      canvasPt: 34.5,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    })
  }),

  // 09 沒有 Medium 欄位：2× 層成員為空，副標（Bold）直接繪於正式 canvas。
  supersampledFields: Object.freeze([]),
  directFields: Object.freeze(["subtitle"]),

  // 只建立實際會影響 09 畫面的顏色控制；09 無主標與小字元素。
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "subtitle", label: "副標顏色" })
  ]),

  // backgroundPlacement 的 width／height 同時是底圖 intrinsic size 的期望值，
  // 不另設第二份尺寸常數，避免兩處數值漂移。
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      // 484 × 360＝整張畫布，1:1 疊在背景色之上；底圖透明窗露出背景色。
      backgroundSrc: new URL("../assets/智取櫃/09_SKBN_APP中.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 484, height: 360 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        subtitle: "#fff000"
      })
    }),
    "store": Object.freeze({
      // 484 × 360＝整張畫布，placement 與智取櫃完全相同。
      backgroundSrc: new URL("../assets/門市/09_SKBN_APP中.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 484, height: 360 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        subtitle: "#eb1717"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/09_SKBN_APP中.png", import.meta.url)
});
