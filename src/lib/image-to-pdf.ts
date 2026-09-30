import { PDFDocument, PageSizes } from "pdf-lib";

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
}

export interface ImageToPdfOptions {
  pageSize: "a4" | "letter" | "fit";
  orientation: "portrait" | "landscape" | "auto";
  margin: "none" | "small" | "big"; // none: 0, small: 20, big: 40
}

/**
 * Loads an image file into an HTMLImageElement to read natural dimensions
 */
export function readImageDimensions(file: File): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Normalizes any image (including WebP, SVG, BMP, or rotated images)
 * onto an HTML canvas and returns standard JPEG bytes.
 */
async function rasterizeImageToJpeg(
  imageItem: ImageItem,
  quality = 0.92
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      const rot = (imageItem.rotation % 360 + 360) % 360;
      const isSwapped = rot === 90 || rot === 270;

      canvas.width = isSwapped ? img.naturalHeight : img.naturalWidth;
      canvas.height = isSwapped ? img.naturalWidth : img.naturalHeight;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error("Canvas export failed"));
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to render image canvas"));
    img.src = imageItem.previewUrl;
  });
}

/**
 * Converts a sequence of image items into a standard PDF document
 */
export async function convertImagesToPdf(
  images: ImageItem[],
  options: ImageToPdfOptions,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error("Please select at least one image to convert.");
  }

  const pdfDoc = await PDFDocument.create();

  const marginPoints =
    options.margin === "none" ? 0 : options.margin === "small" ? 20 : 40;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (!item) continue;
    if (onProgress) onProgress(i + 1, images.length);

    // Rasterize image ensuring rotation is baked in
    const jpegBytes = await rasterizeImageToJpeg(item);
    const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

    let imgWidth = embeddedImage.width;
    let imgHeight = embeddedImage.height;

    // Determine target page width and height
    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === "fit") {
      pageWidth = imgWidth + marginPoints * 2;
      pageHeight = imgHeight + marginPoints * 2;
    } else {
      const baseDimensions =
        options.pageSize === "letter" ? PageSizes.Letter : PageSizes.A4;
      let [baseW, baseH] = baseDimensions;

      let targetOrientation = options.orientation;
      if (targetOrientation === "auto") {
        targetOrientation = imgWidth > imgHeight ? "landscape" : "portrait";
      }

      if (targetOrientation === "landscape") {
        pageWidth = Math.max(baseW, baseH);
        pageHeight = Math.min(baseW, baseH);
      } else {
        pageWidth = Math.min(baseW, baseH);
        pageHeight = Math.max(baseW, baseH);
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Available drawing area inside margins
    const availWidth = Math.max(10, pageWidth - marginPoints * 2);
    const availHeight = Math.max(10, pageHeight - marginPoints * 2);

    // Fit image inside available area preserving aspect ratio
    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;

    // Center image on the page
    const drawX = marginPoints + (availWidth - renderWidth) / 2;
    const drawY = marginPoints + (availHeight - renderHeight) / 2;

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: renderWidth,
      height: renderHeight,
    });
  }

  return pdfDoc.save({ useObjectStreams: false });
}
