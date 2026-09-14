function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
    reader.addEventListener("error", () => reject(new Error("無法讀取圖片檔案。")), { once: true });
    reader.readAsDataURL(file);
  });
}

function decodeWithImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener(
      "load",
      () => resolve({ width: image.naturalWidth, height: image.naturalHeight }),
      { once: true }
    );
    image.addEventListener("error", () => reject(new Error("瀏覽器無法解碼此圖片。")), {
      once: true
    });
    image.src = source;
  });
}

export async function decodeImageSource(source) {
  if (typeof source !== "string" || !source.startsWith("data:image/")) {
    throw new Error("圖片資料格式無效。");
  }
  return decodeWithImage(source);
}

export async function fileToKv(file) {
  if (!(file instanceof File)) throw new Error("沒有可讀取的圖片檔案。");

  let dimensions;
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
    } catch (_error) {
      dimensions = null;
    }
  }

  const dataUrl = await readAsDataUrl(file);
  dimensions ||= await decodeWithImage(dataUrl);

  if (dimensions.width <= 0 || dimensions.height <= 0) {
    throw new Error("圖片尺寸無效。");
  }

  return {
    dataUrl,
    mimeType: file.type || dataUrl.slice(5, dataUrl.indexOf(";")),
    fileName: file.name,
    width: dimensions.width,
    height: dimensions.height
  };
}

export function bindKvControls({ fileInput, dropZone, removeButton, onCandidate, onError }) {
  async function consume(file) {
    try {
      await onCandidate(await fileToKv(file));
    } catch (error) {
      onError(error);
    } finally {
      fileInput.value = "";
    }
  }

  fileInput.addEventListener("change", () => {
    const [file] = fileInput.files || [];
    if (file) consume(file);
  });

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });
  dropZone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer?.files || [];
    if (file) consume(file);
  });
  removeButton.addEventListener("click", () => onCandidate(null));
}
