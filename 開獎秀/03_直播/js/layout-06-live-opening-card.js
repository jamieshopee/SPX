// SPX 開獎秀 — 直播 06：開播字卡 descriptor

export const LIVE_06_LAYOUT = Object.freeze({
  id: "06",
  name: "開播字卡",
  canvas: Object.freeze({ width: 1080, height: 1920 }),
  outputName: "開播字卡.jpg",
  logo: Object.freeze({
    box: Object.freeze({ x: 340, y: 345, width: 400, height: 150 }),
    intrinsic: Object.freeze({ width: 727, height: 272 }),
    src: Object.freeze({
      orange: new URL("../../assets/百萬開講秀_橘.png", import.meta.url),
      white: new URL("../../assets/百萬開講秀_白.png", import.meta.url)
    })
  }),
  textOrder: Object.freeze(["block1", "block2", "warning"]),
  defaultText: Object.freeze({
    block1: "10/10、12/12下單選蝦皮店到店\n＋到貨後一天內完成取件\n（別忘了完成訂單）",
    block2: "即可獲得最高抽百萬大獎機會！\n12/12 12:00直播開獎\n再抽直播限定獎最高十萬！",
    warning: "※百萬獎金均分，詳情依活動規則為準"
  }),
  text: Object.freeze({
    block1: Object.freeze({
      id: "block1", label: "區塊一", multiline: true, maxLines: 3, maxCharsPerLine: 14,
      box: Object.freeze({ x: 145, y: 635, width: 790, height: 215 }),
      lineGapPx: 10, photoshopPt: 12.5, fontSizePx: 52.083333333333336,
      family: "bold", colorKey: "normal", maxWidth: 790, align: "center"
    }),
    block2: Object.freeze({
      id: "block2", label: "區塊二", multiline: true, maxLines: 3, maxCharsPerLine: 14,
      box: Object.freeze({ x: 145, y: 865, width: 790, height: 205 }),
      lineGapPx: 10, photoshopPt: 12.5, fontSizePx: 52.083333333333336,
      family: "bold", colorKey: "normal", maxWidth: 790, align: "center"
    }),
    warning: Object.freeze({
      id: "warning", label: "警語", box: Object.freeze({ x: 150, y: 1100, width: 780, height: 48 }),
      photoshopPt: 7.2, fontSizePx: 30, family: "regular", colorKey: "warning", limit: 18,
      maxWidth: 780, align: "center", rendering: "direct"
    })
  }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "normal", label: "一般文字色" }),
    Object.freeze({ id: "highlight", label: "反選文字色" }),
    Object.freeze({ id: "warning", label: "警語文字色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ background: "#2660ad", normal: "#0e274b", highlight: "#bd0f23", warning: "#ffffff" }),
      backgroundSrc: new URL("../assets/智取櫃/開播字卡.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 527, width: 1080, height: 1393 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46", normal: "#472704", highlight: "#ee4d2d", warning: "#472704" }),
      backgroundSrc: new URL("../assets/門市/開播字卡.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 0, y: 527, width: 1080, height: 1393 })
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/開播字卡.png", import.meta.url)
});

export function getLive06Style(styleId) {
  return LIVE_06_LAYOUT.styles[styleId] ?? null;
}
