// SPX 開獎秀 — 線上／電子BN：06_FB Post layout descriptor
// ---------------------------------------------------------------------------
// 本檔只描述 06 的正式 layout 資料；renderer pipeline 一律由 js/layout-engine.js
// 共用提供，本檔不含繪製邏輯、不複製 engine、不新增第二套 contract。
//
// 06 的版位層特徵（Phase A 調查 ＋ Jamie 裁決）：
//   canvas 1200 × 630
//   背景為 legacy full-canvas fill：本檔不宣告 layout.background，
//   engine 即以 fillRect(0, 0, 1200, 630) 填滿整張畫布（同 01、02、03、05）
//   主 Logo ＋ 四個文字共用左緣 x = 51、水平中心各異，故 horizontalAlign = "left"
//   （同 02、03）
//   小字為 Medium（同 01、03、04、05），因此 06 只需 Medium ＋ Bold
//   智取櫃底圖滿版 1200 × 630（左半透明，背景色透出）；
//   門市底圖 654 × 630，右對齊貼齊畫布右緣（546 + 654 = 1200）
//   左下有第二個 Logo：直式蝦皮購物。它不是獨立控制項，必須與主 Logo
//   使用「完全相同的 resolved variant」（Auto／White／Orange 一律同步），
//   因此以 engine 的 optional layout.secondaryLogo 表達，共用同一次
//   resolveLogoVariant() 結果；不新增第二組控制、state、luminance 或 threshold
//   06 沒有 KV、沒有 CTA、沒有 badge
//
// Typography 換算（online-bn 共通）：Canvas pt = Photoshop pt × 72 / 96。
//   主標 52pt → 39pt、副標 65pt → 48.75pt、小字 28pt → 21pt。
//   48.75 為非整數 pt，必須原值保留，不得取整、不得改用 px。
// photoshopPt 僅為設計來源記錄，renderer 一律使用 canvasPt。
//
// limits、default colors 為 online-bn 全版位共通值（Jamie 裁決）。
// 對位圖只屬 Manual Verification Viewer 的 DOM overlay，不進 renderer。
// ---------------------------------------------------------------------------

export const LAYOUT_06_FB_POST = Object.freeze({
  id: "06-fb-post",
  name: "06_FB Post",

  canvas: Object.freeze({ width: 1200, height: 630 }),

  // 主 Logo 與四個文字共用左緣 51，水平中心各異，因此水平為左對齊。
  horizontalAlign: "left",

  logo: Object.freeze({
    box: Object.freeze({ x: 51, y: 170, width: 452, height: 75 }),
    intrinsic: Object.freeze({ width: 1678, height: 272 }),
    src: Object.freeze({
      orange: new URL("../assets/蝦皮大樂透_橘.png", import.meta.url),
      white: new URL("../assets/蝦皮大樂透_白.png", import.meta.url)
    })
  }),

  // 左下直式蝦皮購物：engine 的 optional 第二 Logo。
  // 兩個 style 共用同一組橘／白素材；variant 由主 Logo 的同一次解算決定，
  // 本檔不持有 mode、threshold、state、顏色或任何獨立 variant。
  // 素材 intrinsic 83 × 112 置入 box 82 × 112 為寬度受限的 contain：
  // dest ≈ 82 × 110.6506 @ (28, 502.6747)；不 stretch、不 crop、座標不取整。
  secondaryLogo: Object.freeze({
    box: Object.freeze({ x: 28, y: 502, width: 82, height: 112 }),
    intrinsic: Object.freeze({ width: 83, height: 112 }),
    src: Object.freeze({
      orange: new URL("../assets/直式蝦皮購物_橘.png", import.meta.url),
      white: new URL("../assets/直式蝦皮購物_白.png", import.meta.url)
    })
  }),

  textOrder: Object.freeze(["title", "subtitle", "small1", "small2"]),

  text: Object.freeze({
    title: Object.freeze({
      id: "title",
      label: "主標",
      box: Object.freeze({ x: 51, y: 261, width: 405, height: 49 }),
      photoshopPt: 52,
      canvasPt: 39,
      family: "medium",
      colorKey: "title",
      limit: 8
    }),
    subtitle: Object.freeze({
      id: "subtitle",
      label: "副標",
      box: Object.freeze({ x: 51, y: 323, width: 475, height: 62 }),
      photoshopPt: 65,
      canvasPt: 48.75,
      family: "bold",
      colorKey: "subtitle",
      limit: 7
    }),
    small1: Object.freeze({
      id: "small1",
      label: "小字 1",
      box: Object.freeze({ x: 51, y: 396, width: 475, height: 28 }),
      photoshopPt: 28,
      canvasPt: 21,
      family: "medium",
      colorKey: "small",
      limit: 18
    }),
    small2: Object.freeze({
      id: "small2",
      label: "小字 2",
      box: Object.freeze({ x: 51, y: 431, width: 475, height: 28 }),
      photoshopPt: 28,
      canvasPt: 21,
      family: "medium",
      colorKey: "small",
      limit: 18
    })
  }),

  // local 2×：主標＋小字1＋小字2（皆 Medium）；副標 Bold 直接繪於正式 canvas。
  // offscreen 由 engine 以 canvas × 2 計算，即 2400 × 1260。
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
      // 1200 × 630，滿版 1:1（底圖左半透明，由背景色呈現）。
      backgroundSrc: new URL("../assets/智取櫃/06_FB Post.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 0, width: 1200, height: 630 }),
      defaultColors: Object.freeze({
        background: "#2660ad",
        title: "#fffac8",
        subtitle: "#fff000",
        small: "#fffac8"
      })
    }),
    "store": Object.freeze({
      // 654 × 630，右對齊貼齊畫布右緣（546 + 654 = 1200），畫布左側由背景色呈現。
      backgroundSrc: new URL("../assets/門市/06_FB Post.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 546, y: 0, width: 654, height: 630 }),
      defaultColors: Object.freeze({
        background: "#ffda46",
        title: "#472704",
        subtitle: "#eb1717",
        small: "#472704"
      })
    })
  }),

  alignmentOverlaySrc: new URL("../assets/對位/06_FB Post.png", import.meta.url)
});
