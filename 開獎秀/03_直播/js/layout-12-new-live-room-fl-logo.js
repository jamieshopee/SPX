// SPX 開獎秀 — 直播 12：New直播間FL_LOGO

const placement = (x, y) => Object.freeze({ x, y, width: 319, height: 115 });

export const LIVE_12_LAYOUT = Object.freeze({
  id: "12",
  name: "New直播間FL_LOGO",
  canvas: Object.freeze({ width: 336, height: 120 }),
  outputFormat: "png",
  outputName: "New直播間FL_LOGO.png",
  backgroundShape: Object.freeze({
    type: "roundedRect",
    x: 3,
    y: 10,
    width: 330,
    height: 100,
    radius: 49,
    transparentOutside: true
  }),
  text: Object.freeze({}),
  textOrder: Object.freeze([]),
  defaultText: Object.freeze({}),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" })
  ]),
  logo: Object.freeze({
    box: Object.freeze({ x: 72, y: 24, width: 192, height: 72 }),
    intrinsic: Object.freeze({ width: 727, height: 272 }),
    src: Object.freeze({
      white: new URL("../../assets/百萬開講秀_白.png", import.meta.url),
      orange: new URL("../../assets/百萬開講秀_橘.png", import.meta.url)
    })
  }),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ background: "#2660ad" }),
      backgroundSrc: new URL("../assets/智取櫃/New直播間FL_LOGO.png", import.meta.url),
      backgroundPlacement: placement(8, 5)
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46" }),
      backgroundSrc: new URL("../assets/門市/New直播間FL_LOGO.png", import.meta.url),
      backgroundPlacement: placement(8, 5)
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/New直播間FL_LOGO.png", import.meta.url)
});

export function getLive12Style(styleId) {
  return LIVE_12_LAYOUT.styles[styleId] ?? null;
}
