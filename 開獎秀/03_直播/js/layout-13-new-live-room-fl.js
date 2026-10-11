// SPX 開獎秀 — 直播 13：New直播間FL
// 文字框位置為 Provisional，待 Chrome 人工視覺校正。

const photoshopPtToCanvasPx = (value) => value * 300 / 72;
const box = (x, y, width, height) => Object.freeze({ x, y, width, height });
const backgroundPlacement = box(8, 5, 319, 115);
const textBox = box(3, 10, 330, 100);

export const LIVE_13_LAYOUT = Object.freeze({
  id: "13",
  name: "New直播間FL",
  canvas: Object.freeze({ width: 336, height: 120 }),
  outputFormat: "png",
  outputName: "New直播間FL.png",
  backgroundShape: Object.freeze({
    type: "roundedRect",
    x: 3,
    y: 10,
    width: 330,
    height: 100,
    radius: 49,
    transparentOutside: true
  }),
  text: Object.freeze({
    headline: Object.freeze({
      id: "headline",
      label: "文案",
      box: textBox,
      photoshopPt: 11.5,
      fontSizePx: photoshopPtToCanvasPx(11.5),
      family: "medium",
      colorKey: "text",
      limit: 6,
      maxWidth: textBox.width,
      align: "center",
      rendering: "supersampled",
      provisional: true
    })
  }),
  textOrder: Object.freeze(["headline"]),
  defaultText: Object.freeze({ headline: "最高抽百萬" }),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" }),
    Object.freeze({ id: "text", label: "文字顏色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ background: "#2660ad", text: "#fff000" }),
      backgroundSrc: new URL("../assets/智取櫃/New直播間FL.png", import.meta.url),
      backgroundPlacement
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46", text: "#eb1717" }),
      backgroundSrc: new URL("../assets/門市/New直播間FL.png", import.meta.url),
      backgroundPlacement
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/New直播間FL.png", import.meta.url)
});

export function getLive13Style(styleId) {
  return LIVE_13_LAYOUT.styles[styleId] ?? null;
}
