export const ITEMS = Object.freeze([
  // 01 encoder policy（Jamie 裁決）：結構性搬用 FSS BN 正式 JPG 壓縮機制 —
  // initial quality 1.0、容量上限 245,000 bytes、quality floor 0.5、7 次 binary search、
  // floor 仍超標 fail-closed。快速取件無 DPI requirement，不設 dpi。
  { id: "01", name: "01_DDcard BN", width: 531, height: 792, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "01-ddcard-bn", encoderOptions: Object.freeze({ quality: 1.0, maxBytes: 245000, qualityFloor: 0.5, searchSteps: 7 }), excelData: Object.freeze({}) },
  // 02 encoder policy（Jamie 裁決）：同 FSS BN D 樣式現行 JPG 壓縮機制 —
  // initial quality 1.0、容量上限 145,000 bytes、quality floor 0.5、7 次 binary search、
  // floor 仍超標 fail-closed。快速取件無 DPI requirement，不設 dpi。
  { id: "02", name: "02_HBN", width: 1200, height: 360, format: "jpg", controlsProfile: "shared-01-13", rendererKey: "02-hbn", encoderOptions: Object.freeze({ quality: 1.0, maxBytes: 145000, qualityFloor: 0.5, searchSteps: 7 }), excelData: Object.freeze({}) },
  { id: "03", name: "03_LPBN", width: 1200, height: 550, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "04", name: "04_POP UP", width: 580, height: 720, format: "png", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "05", name: "05_IG", width: 900, height: 1600, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "06", name: "06_FB Post", width: 1200, height: 630, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "07", name: "07_TVBN_有人店", width: 1599, height: 1080, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "08", name: "08_TVBN_智取店", width: 1080, height: 1920, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "09", name: "09_TVBN_旗艦店", width: 1920, height: 1080, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "10", name: "10_繳費機直式BN-立保", width: 1080, height: 1920, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "11", name: "11_繳費機直式BN-博辰", width: 2700, height: 3380, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "12", name: "12_繳費機下方BN-立保", width: 1040, height: 578, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "13", name: "13_繳費機下方BN-博辰", width: 984, height: 309, format: "jpg", controlsProfile: "shared-01-13", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
  { id: "14", name: "14_AR", width: 100, height: 100, format: "jpg", controlsProfile: "deferred", rendererKey: null, encoderOptions: null, excelData: Object.freeze({}) },
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
