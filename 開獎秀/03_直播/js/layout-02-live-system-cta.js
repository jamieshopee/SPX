// SPX 開獎秀 — 直播 02：直播大廳 LPBN_系統CTA descriptor

import { LIVE_01_LAYOUT } from "./layout-01-live-lpbn.js";

export const LIVE_02_LAYOUT = Object.freeze({
  id: "02",
  name: "直播大廳 LPBN_系統CTA",
  canvas: LIVE_01_LAYOUT.canvas,
  logo: LIVE_01_LAYOUT.logo,
  textOrder: LIVE_01_LAYOUT.textOrder,
  text: LIVE_01_LAYOUT.text,
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: "#2660ad",
      colors: Object.freeze({ titleTime: "#fffac8", subtitle: "#fff000", warning: "#000000" }),
      backgroundSrc: new URL("../assets/智取櫃/直播大廳 LPBN_系統CTA.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 560, y: 0, width: 565, height: 360 })
    }),
    store: Object.freeze({
      background: "#ffda46",
      colors: Object.freeze({ titleTime: "#472704", subtitle: "#eb1717", warning: "#000000" }),
      backgroundSrc: new URL("../assets/門市/直播大廳 LPBN_系統CTA.png", import.meta.url),
      backgroundPlacement: Object.freeze({ x: 523, y: 0, width: 602, height: 360 })
    })
  }),
  backgroundPlacement: null,
  alignmentOverlaySrc: new URL("../assets/對位/直播大廳 LPBN_系統CTA.png", import.meta.url)
});

export function getLive02Style(styleId) {
  return LIVE_02_LAYOUT.styles[styleId] ?? null;
}
