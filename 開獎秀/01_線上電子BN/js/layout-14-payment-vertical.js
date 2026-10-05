// 14_繳費機直式BN-立保：與 13 共用不變 rendering contract，只保留獨立 identity 與素材 ownership。
// 13 descriptor 為 read-only configuration；14 以局部 shallow composition 建立新的頂層與 style wrappers。
import { LAYOUT_13_TVBN_SMART_STORE } from "./layout-13-tvbn-smart-store.js";

const BASE_STYLES = LAYOUT_13_TVBN_SMART_STORE.styles;

export const LAYOUT_14_PAYMENT_VERTICAL = Object.freeze({
  ...LAYOUT_13_TVBN_SMART_STORE,
  id: "14-payment-vertical",
  name: "14_繳費機直式BN-立保",
  styles: Object.freeze({
    "smart-locker": Object.freeze({
      ...BASE_STYLES["smart-locker"],
      backgroundSrc: new URL("../assets/智取櫃/14_繳費機直式BN-立保.png", import.meta.url)
    }),
    store: Object.freeze({
      ...BASE_STYLES.store,
      backgroundSrc: new URL("../assets/門市/14_繳費機直式BN-立保.png", import.meta.url)
    })
  }),
  alignmentOverlaySrc: new URL("../assets/對位/14_繳費機直式BN-立保.png", import.meta.url)
});
