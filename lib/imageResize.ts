// Shrinks a picked photo down to something small enough to store as a data
// URL (the API caps logoDataUrl at 500 KB decoded — see
// before-you-dispatch-api's src/lib/logo.ts) without needing any object
// storage for this build. A phone photo can be several MB; this keeps only
// what an avatar-sized circle actually shows.
export function resizeImageToDataUrl(
  file: File,
  maxDim = 256,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read that image"));
    };
    img.src = objectUrl;
  });
}
