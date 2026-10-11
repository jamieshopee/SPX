// SPX 開獎秀 — 直播 10：案型字卡_本次活動
// 裝飾圖及兩行文字框座標均為 Provisional，待 Chrome 人工視覺校正。

const photoshopPtToCanvasPx = (value) => value * 300 / 72;
const box = (x, y, width, height) => Object.freeze({ x, y, width, height });

function textField(id, label, fieldBox, photoshopPt, family, colorKey, limit) {
  return Object.freeze({
    id,
    label,
    box: fieldBox,
    photoshopPt,
    fontSizePx: photoshopPtToCanvasPx(photoshopPt),
    family,
    colorKey,
    limit,
    maxWidth: fieldBox.width,
    align: "center",
    rendering: "direct",
    provisional: true
  });
}

const backgroundPlacement = box(182, 18, 1516, 492);

export const LIVE_10_LAYOUT = Object.freeze({
  id: "10",
  name: "案型字卡_本次活動",
  canvas: Object.freeze({ width: 1920, height: 543 }),
  outputName: "案型字卡_本次活動.jpg",
  textOrder: Object.freeze(["line1", "line2"]),
  defaultText: Object.freeze({
    line1: "12/12直播開獎 取件最高抽百萬",
    line2: "12/12、12/18包裹到貨1天內取件限定"
  }),
  text: Object.freeze({
    line1: textField("line1", "第一行", box(42, 125, 1836, 139), 28.8, "bold", "line1", 15),
    line2: textField("line2", "第二行", box(42, 303, 1836, 120), 24, "regular", "line2", 18)
  }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "line1", label: "第一行文字色" }),
    Object.freeze({ id: "line2", label: "第二行文字色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ background: "#2660ad", line1: "#ffffff", line2: "#fff000" }),
      backgroundSrc: new URL("../assets/智取櫃/案型字卡_本次活動.png", import.meta.url),
      backgroundPlacement
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46", line1: "#472704", line2: "#eb1717" }),
      backgroundSrc: new URL("../assets/門市/案型字卡_本次活動.png", import.meta.url),
      backgroundPlacement
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/案型字卡_本次活動.png", import.meta.url)
});

export function getLive10Style(styleId) {
  return LIVE_10_LAYOUT.styles[styleId] ?? null;
}
