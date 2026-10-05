// 最小 QR 純 encoder 接合：local vendor readiness → PNG data URL → ready Image。
// 只由有 QR 且 URL 有效的 renderer path 動態載入；不持有 geometry 或 QR state。
// Vendor: soldair/node-qrcode browser bundle（SPX AD 已驗證版本，原樣 vendored）。
// MIT license / Copyright (c) 2012 Ryan Day 見 ../vendor/LICENSE.qrcode.txt。
const VENDOR_URL = new URL("../vendor/qrcode.js", import.meta.url);
let vendorPromise = null;

function ensureVendorReady() {
  if (vendorPromise === null) {
    const script = document.createElement("script");
    script.src = VENDOR_URL.href;
    script.async = true;
    vendorPromise = new Promise((resolve, reject) => {
      script.addEventListener("load", () => {
        if (typeof window.QRCode?.toDataURL !== "function") {
          reject(new Error("QR encoder 缺少 QRCode.toDataURL。"));
          return;
        }
        resolve(window.QRCode);
      }, { once: true });
      script.addEventListener("error", () => {
        reject(new Error("本機 QR encoder 載入失敗。"));
      }, { once: true });
      document.head.append(script);
    }).catch((error) => {
      script.remove();
      vendorPromise = null;
      throw error;
    });
  }
  return vendorPromise;
}

// Generated image 不進 static asset cache；intrinsic 由 encoder 決定，非 display box。
async function readyGeneratedImage(dataUrl) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", () => reject(new Error("QR 圖片載入失敗。")), { once: true });
    image.src = dataUrl;
  });
  if (typeof image.decode === "function") await image.decode();
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0 ||
      image.naturalWidth !== image.naturalHeight) {
    throw new Error("QR encoder 圖片必須具有非零正方形 intrinsic dimensions。");
  }
  return image;
}

export async function createQrImage(normalizedUrl) {
  const encoder = await ensureVendorReady();
  const dataUrl = await new Promise((resolve, reject) => {
    encoder.toDataURL(normalizedUrl, {
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" }
    }, (error, value) => error ? reject(error) : resolve(value));
  });
  return readyGeneratedImage(dataUrl);
}
