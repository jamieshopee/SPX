// SPX 開獎秀 — 直播 09：案型字卡_下次活動預告
// 背景裝飾及文字框座標均為 Provisional，待 Chrome 人工視覺校正。

const photoshopPtToCanvasPx = (value) => value * 300 / 72;
const box = (x, y, width, height) => Object.freeze({ x, y, width, height });

function textField(id, label, fieldBox, photoshopPt, family, colorKey, limit, rendering = "direct") {
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
    rendering,
    provisional: true
  });
}

const backgroundPlacement = box(232, 35, 1457, 486);

export const LIVE_09_LAYOUT = Object.freeze({
  id: "09",
  name: "案型字卡_下次活動預告",
  canvas: Object.freeze({ width: 1920, height: 543 }),
  outputName: "案型字卡_下次活動預告.jpg",
  textOrder: Object.freeze(["line1", "line2"]),
  defaultText: Object.freeze({
    line1: "下期活動預告",
    line2: "敬請期待下期 蝦皮店到店大樂透"
  }),
  text: Object.freeze({
    line1: textField("line1", "第一行", box(523, 126, 874, 72), 18, "bold", "line1", 10),
    line2: textField("line2", "第二行", box(42.5, 262, 1835, 111), 28.5, "medium", "line2", 15, "supersampled")
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
      backgroundSrc: new URL("../assets/智取櫃/案型字卡_下次活動預告.png", import.meta.url),
      backgroundPlacement
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46", line1: "#472704", line2: "#eb1717" }),
      backgroundSrc: new URL("../assets/門市/案型字卡_下次活動預告.png", import.meta.url),
      backgroundPlacement
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/案型字卡_下次活動預告.png", import.meta.url)
});

export function getLive09Style(styleId) {
  return LIVE_09_LAYOUT.styles[styleId] ?? null;
}
