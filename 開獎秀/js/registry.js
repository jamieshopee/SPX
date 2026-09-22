// SPX 開獎秀 — item registry
// ---------------------------------------------------------------------------
// 層級聲明（docs/架構說明.md L38）：
//   本檔是「開獎秀項目清單」，與 SPX root 的 tools.json「工具清單」屬不同層級，
//   兩者不得互相引用、不得合併為同一個 registry 概念。
//
// 資料驅動（docs/架構說明.md L91）：
//   項目清單由本檔驅動，HTML 不得寫死任何 item card 或 style card。
//
// 範圍限制（Jamie 裁決）：
//   本檔只保存 Interface 1／Interface 2 需要的最小資料。
//   不得加入 Excel schema、renderer key、export 設定、workspace 或控制台 config。
// ---------------------------------------------------------------------------

// 樣式為單一定義來源；ITEMS 只引用 style id，不重複保存 display name。
// previewSrc 是正式縮圖尚未提供時的接縫：未來放入正式 asset 後只需改此欄位，
// card geometry 與 CSS 不需更動。
export const STYLES = Object.freeze({
  "smart-locker": Object.freeze({ id: "smart-locker", name: "智取櫃", previewSrc: null }),
  "store": Object.freeze({ id: "store", name: "門市", previewSrc: null })
});

// styles.length > 0 即代表該項目需要進 Interface 2；不另設 needsStyleSelection，
// 避免兩個欄位表達同一件事而互相矛盾。
// 門市清單目前不經樣式選擇（docs/架構說明.md L105；Jamie 裁決）。
export const ITEMS = Object.freeze([
  Object.freeze({ id: "online-bn", name: "線上／電子BN", styles: Object.freeze(["smart-locker", "store"]) }),
  Object.freeze({ id: "om", name: "OM", styles: Object.freeze(["smart-locker", "store"]) }),
  Object.freeze({ id: "live", name: "直播", styles: Object.freeze(["smart-locker", "store"]) }),
  Object.freeze({ id: "store-list", name: "門市清單", styles: Object.freeze([]) })
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

export function getItem(itemId) {
  if (!isNonEmptyString(itemId)) return null;
  return ITEMS.find((item) => item.id === itemId) ?? null;
}

export function getStyle(styleId) {
  if (!isNonEmptyString(styleId)) return null;
  if (!Object.prototype.hasOwnProperty.call(STYLES, styleId)) return null;
  return STYLES[styleId];
}

export function getItemStyles(item) {
  return item.styles.map((styleId) => getStyle(styleId));
}

// 最小 validation：只檢查會造成 runtime 錯誤的項目。
// 失敗即 throw，由頁面 entry script 接住並 fail-closed，不渲染錯誤資料。
export function validateRegistry() {
  const styleIds = new Set();

  for (const [key, style] of Object.entries(STYLES)) {
    if (!isNonEmptyString(style?.id)) {
      throw new Error(`STYLES["${key}"] 的 id 無效。`);
    }
    if (style.id !== key) {
      throw new Error(`STYLES["${key}"] 的 id 與 key 不一致。`);
    }
    if (!isNonEmptyString(style?.name)) {
      throw new Error(`STYLES["${key}"] 的 name 無效。`);
    }
    if (styleIds.has(style.id)) {
      throw new Error(`樣式 id 重複：${style.id}。`);
    }
    styleIds.add(style.id);
  }

  if (!Array.isArray(ITEMS) || ITEMS.length === 0) {
    throw new Error("ITEMS 必須是非空陣列。");
  }

  const itemIds = new Set();

  for (const item of ITEMS) {
    if (!isNonEmptyString(item?.id)) {
      throw new Error("項目缺少有效的 id。");
    }
    if (itemIds.has(item.id)) {
      throw new Error(`項目 id 重複：${item.id}。`);
    }
    itemIds.add(item.id);

    if (!isNonEmptyString(item?.name)) {
      throw new Error(`項目「${item.id}」的 name 無效。`);
    }
    if (!Array.isArray(item?.styles)) {
      throw new Error(`項目「${item.id}」的 styles 必須是陣列。`);
    }
    for (const styleId of item.styles) {
      if (!styleIds.has(styleId)) {
        throw new Error(`項目「${item.id}」引用不存在的樣式：${styleId}。`);
      }
    }
  }
}
