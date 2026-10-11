// SPX 開獎秀 — 直播 14：直播鏡面圖_LOGO

const backgroundPlacement = Object.freeze({ x: 251, y: 299, width: 586, height: 216 });
// Renderer 的 Logo variant resolver 仍要求 HEX 背景值；透明模式會略過填色，且不提供顏色控制。
const resolverFallbackColor = "#000000";

export const LIVE_14_LAYOUT = Object.freeze({
  id: "14",
  name: "直播鏡面圖_LOGO",
  canvas: Object.freeze({ width: 1080, height: 1920 }),
  outputFormat: "png",
  outputName: "直播鏡面圖_LOGO.png",
  transparentCanvas: true,
  text: Object.freeze({}),
  textOrder: Object.freeze([]),
  defaultText: Object.freeze({}),
  colorFields: Object.freeze([]),
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      background: resolverFallbackColor,
      colors: Object.freeze({ background: resolverFallbackColor }),
      backgroundSrc: new URL("../assets/智取櫃/直播鏡面圖_LOGO.png", import.meta.url),
      backgroundPlacement
    }),
    store: Object.freeze({
      background: resolverFallbackColor,
      colors: Object.freeze({ background: resolverFallbackColor }),
      backgroundSrc: new URL("../assets/門市/直播鏡面圖_LOGO.png", import.meta.url),
      backgroundPlacement
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/直播鏡面圖_LOGO.png", import.meta.url)
});

export function getLive14Style(styleId) {
  return LIVE_14_LAYOUT.styles[styleId] ?? null;
}
