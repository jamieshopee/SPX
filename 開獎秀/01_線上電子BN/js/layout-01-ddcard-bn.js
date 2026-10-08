// SPX 開獎秀 — 線上／電子BN：01_DDcard BN layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 01 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯。
//
// 01 的全部正式數值未因共用化而改變（Jamie Manual Verification PASS、
// Code Commit 3c022a9）：
//   canvas 531 × 792
//   Logo box 77,89,377×64，contain ＋ 水平置中 ＋ 垂直置中
//   主標 30pt Medium／副標 45pt Bold／小字 1、2 皆 18pt Medium
//   文字水平 ink-box center、垂直 ink-box center
//   supersampled：主標＋小字1＋小字2；direct：副標
//   limits 8 / 7 / 18 / 18
//   smart-locker 底圖 0,0,531,792；store 底圖 0,354,531,438
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt，不得寫 px。
//
// 沒有 KV。對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_01_DDCARD_BN = Object.freeze({
  id: "01-ddcard-bn",
  name: "01_DDcard BN",

  canvas: Object.freeze({ width: 531, height: 792 }),

  // 01 的五個對位 box 共用同一水平中心（265.5），因此水平為 ink-box center。
  horizontalAlign: "center",

  logo: Object.freeze({
    box: Object.freeze({ x: 77, y: 89, width: 377, height: 64 }),
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
      box: Object.freeze({ x: 90, y: 170, width: 351, height: 37 }),
      photoshopPt: 40,
      canvasPt: 30,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 43, y: 221, width: 445, height: 57 }),
      photoshopPt: 60,
      canvasPt: 45,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 43, y: 296, width: 445, height: 22 }),
      photoshopPt: 24,
      canvasPt: 18,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 43, y: 325, width: 445, height: 22 }),
      photoshopPt: 24,
      canvasPt: 18,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2；副標 Bold 直接繪於正式 canvas。
  supersampledFields: Object.freeze(["title", "small1", "small2"]),
  directFields: Object.freeze(["subtitle"]),

  // 四個顏色控制。小字 1 與小字 2 共用同一個 small 顏色，不新增第二個。
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
      backgroundSrc: new URL("../assets/智取櫃/01_DDcard BN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 531, height: 792 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      backgroundSrc: new URL("../assets/門市/01_DDcard BN.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 354, width: 531, height: 438 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  // Manual Verification Viewer 專用對位 overlay，不進 renderer、不進未來 Export。
  alignmentOverlaySrc: new URL("../assets/對位/01_DDcard BN.png", import.meta.url)
});
