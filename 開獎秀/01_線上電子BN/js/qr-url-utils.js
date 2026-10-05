// SPX 開獎秀自己的純 URL utility，沿用 SPX AD BNQrCodeUrl 的已驗證規則。
// 無 DOM／Canvas／state／network，也沒有跨 repository runtime dependency。
// 空值與非法值的 normalize 都回傳 null；以 isEmpty 區分 UI feedback。
export function normalize(raw) {
  const trimmed = String(raw == null ? "" : raw).trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = /:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function validate(raw) {
  return normalize(raw) !== null;
}

export function isEmpty(raw) {
  return String(raw == null ? "" : raw).trim() === "";
}
