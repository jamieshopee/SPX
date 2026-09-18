export const ITEMS = Object.freeze([
  // 01 encoder policy（Jamie 裁決）：結構性搬用 FSS BN 正式 JPG 壓縮機制 —
  // initial quality 1.0、容量上限 245,000 bytes、quality floor 0.5、7 次 binary search、
  // floor 仍超標 fail-closed。快速取件無 DPI requirement，不設 dpi。
  { id: "01", name: "01_DDcard BN", width: 531, height: 792, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "01-ddcard-bn", encoderOptions: Object.freeze({ quality: 1.0, maxBytes: 245000, qualityFloor: 0.5, searchSteps: 7 }), excelData: Object.freeze({}) },
  // 02 encoder policy（Jamie 裁決）：同 FSS BN D 樣式現行 JPG 壓縮機制 —
  // initial quality 1.0、容量上限 145,000 bytes、quality floor 0.5、7 次 binary search、
  // floor 仍超標 fail-closed。快速取件無 DPI requirement，不設 dpi。
  { id: "02", name: "02_HBN", width: 1200, height: 360, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "02-hbn", encoderOptions: Object.freeze({ quality: 1.0, maxBytes: 145000, qualityFloor: 0.5, searchSteps: 7 }), excelData: Object.freeze({}) },
  // 03 encoder policy（Jamie 裁決）：同 FSS LPBN 現行 JPG 機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "03", name: "03_LPBN", width: 1200, height: 550, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "03-lpbn", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 04 encoder policy（Jamie 裁決）：完整比照 FSS BN D 樣式 POP UP 的 PNG 機制 —
  // native PNG → pHYs 72 dpi patch → 上限 250,000 bytes → 超限以 UPNG 256 色 indexed
  // fallback（再 patch dpi）→ 仍超限 fail-closed。
  { id: "04", name: "04_POP UP", width: 580, height: 720, format: "png", controlsProfile: "shared-01-13", rendererKey: "04-pop-up", encoderOptions: Object.freeze({ maxBytes: 250000, dpi: 72, indexedFallbackColors: 256 }), excelData: Object.freeze({}) },
  // 05 encoder policy（Jamie 裁決）：同 FSS 06_IG 現行 JPG 機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "05", name: "05_IG", width: 900, height: 1600, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "05-ig", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 06 encoder policy（Jamie 裁決）：同 FSS 07_FB POST 現行 JPG 機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "06", name: "06_FB Post", width: 1200, height: 630, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "06-fb-post", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 07 encoder policy（Jamie 裁決）：同 FSS 09_SPX TVBN_2 現行 JPG 機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "07", name: "07_TVBN_有人店", width: 1599, height: 1080, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "07-tvbn-manned", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 08 encoder policy（Jamie 裁決）：同 FSS 08_SPX TVBN_1 現行 JPG 機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "08", name: "08_TVBN_智取店", width: 1080, height: 1920, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "08-tvbn-smart", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 09 encoder policy（Jamie 裁決）：同 FSS 09_SPX TVBN_2 現行 JPG 機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "09", name: "09_TVBN_旗艦店", width: 1920, height: 1080, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "09-tvbn-flagship", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 10（Jamie 裁決）：10 與 08 的 runtime layout contract 完全相同，刻意 reuse
  // 08 renderer（rendererKey "08-tvbn-smart"）與同一 quality-only encoder，不建立第二份 implementation。
  { id: "10", name: "10_繳費機直式BN-立保", width: 1080, height: 1920, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "08-tvbn-smart", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 11 encoder policy（Jamie 裁決）：同快速取件 JPG placements 現行機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "11", name: "11_繳費機直式BN-博辰", width: 2700, height: 3380, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "11-payment-vertical-bochen", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 12 encoder policy（Jamie 裁決）：同快速取件 JPG placements 現行機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "12", name: "12_繳費機下方BN-立保", width: 1040, height: 578, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "12-payment-bottom-libao", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 13 encoder policy（Jamie 裁決）：同快速取件 JPG placements 現行機制 — quality 1.0、
  // 無容量上限、無 quality floor、無 binary search。快速取件無 DPI requirement，不設 dpi。
  { id: "13", name: "13_繳費機下方BN-博辰", width: 984, height: 309, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "13-payment-bottom-bochen", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  // 14 encoder policy（Jamie 裁決）：JPG quality-only 1.0，無容量上限、無 quality floor、
  // 無 binary search、無 DPI。14 文字資料存於 excel.items["14"]（line1／line2）。
  { id: "14", name: "14_AR", width: 100, height: 100, format: "jpg", controlsProfile: "deferred", rendererKey: "14-ar", encoderOptions: Object.freeze({ quality: 1.0 }), excelData: Object.freeze({}) },
  { id: "15", name: "15_MSBN", width: 1200, height: 400, format: "jpg", controlsProfile: "deferred", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) }
]);

const ITEM_BY_ID = new Map(ITEMS.map((item) => [item.id, Object.freeze(item)]));

export function getItem(itemId) {
  return ITEM_BY_ID.get(itemId) || null;
}

export function isItemId(itemId) {
  return ITEM_BY_ID.has(itemId);
}

export function isSharedControlsItem(itemId) {
  return getItem(itemId)?.controlsProfile === "shared-01-13";
}

export function formatItemDisplayName(name) {
  return String(name).replace(/^(\d{2})_/, "$1_\u00a0");
}
