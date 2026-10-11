// SPX 開獎秀 — 直播 11：TVBN_即時開講資訊

const placement = (y, height) => Object.freeze({ x: 0, y, width: 1080, height });

export const LIVE_11_LAYOUT = Object.freeze({
  id: "11",
  name: "TVBN_即時開講資訊",
  canvas: Object.freeze({ width: 1080, height: 1920 }),
  outputName: "TVBN_即時開講資訊.jpg",
  text: Object.freeze({}),
  textOrder: Object.freeze([]),
  defaultText: Object.freeze({}),
  colorFields: Object.freeze([
    Object.freeze({ id: "background", label: "背景色" })
  ]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ background: "#2660ad" }),
      backgroundSrc: new URL("../assets/智取櫃/TVBN_即時開講資訊.png", import.meta.url),
      backgroundPlacement: placement(107, 1813)
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ background: "#ffda46" }),
      backgroundSrc: new URL("../assets/門市/TVBN_即時開講資訊.png", import.meta.url),
      backgroundPlacement: placement(120, 1800)
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/TVBN_即時開講資訊.png", import.meta.url)
});

export function getLive11Style(styleId) {
  return LIVE_11_LAYOUT.styles[styleId] ?? null;
}
