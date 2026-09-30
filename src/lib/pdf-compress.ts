import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadPdfDocument } from "./pdf-loader";

export type CompressionPreset = "extreme" | "recommended" | "low";

export interface CompressionPresetConfig {
  id: CompressionPreset;
  name: string;
  badge: string;
  description: string;
  estimatedReduction: string;
  renderScale: number;
  jpegQuality: number;
}

export const COMPRESSION_PRESETS: Record<CompressionPreset, CompressionPresetConfig> = {
  extreme: {
    id: "extreme",
    name: "Extreme Compression",
    badge: "Smallest Size",
    description: "Maximum reduction with standard screen resolution. Best for strict email and portal caps (< 2 MB).",
    estimatedReduction: "Up to 75% reduction",
    renderScale: 1.05,
    jpegQuality: 0.52,
  },
  recommended: {
    id: "recommended",
    name: "Recommended Compression",
    badge: "Most Popular",
    description: "Balanced file size reduction with crisp typography and clean images. Ideal for everyday documents.",
    estimatedReduction: "40% – 60% reduction",
    renderScale: 1.35,
    jpegQuality: 0.72,
  },
  low: {
    id: "low",
    name: "Low Compression",
    badge: "High Quality",
    description: "Preserves sharp fine print and high-res photography while pruning stream bloat and redundant data.",
    estimatedReduction: "20% – 35% reduction",
    renderScale: 1.75,
    jpegQuality: 0.86,
  },
};

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  savingsBytes: number;
  savingsPercent: number;
  pageCount: number;
  compressedBytes: Uint8Array;
  preset: CompressionPreset;
  previewThumbnailUrl?: string | undefined;
}

export interface CompressProgressUpdate {
  stage: "analyzing" | "compressing" | "assembling" | "completed";
  currentPage: number;
  totalPages: number;
  percent: number;
  message: string;
}

/**
 * Compresses a PDF file using client-side canvas re-sampling and stream optimization
 */
export async function compressPdfFile(
  bytes: ArrayBuffer,
  preset: CompressionPreset = "recommended",
  onProgress?: (progress: CompressProgressUpdate) => void
): Promise<CompressionResult> {
  const originalSize = bytes.byteLength;
  const config = COMPRESSION_PRESETS[preset] || COMPRESSION_PRESETS.recommended;

  onProgress?.({
    stage: "analyzing",
    currentPage: 0,
    totalPages: 0,
    percent: 5,
    message: "Analyzing document structures and raster elements...",
  });

  const pdfjsDoc = await loadPdfDocument(bytes.slice(0));
  const totalPages = pdfjsDoc.numPages;

  if (totalPages === 0) {
    throw new Error("The selected document contains no pages to compress.");
  }

  const newDoc = await PDFDocument.create();
  const standardFont = await newDoc.embedFont(StandardFonts.Helvetica);
  let previewThumbnailUrl: string | undefined;

  for (let i = 1; i <= totalPages; i++) {
    const currentPercent = 10 + Math.round(((i - 1) / totalPages) * 75);

    onProgress?.({
      stage: "compressing",
      currentPage: i,
      totalPages,
      percent: currentPercent,
      message: `Optimizing page ${i} of ${totalPages} (${Math.round((i / totalPages) * 100)}%)...`,
    });

    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale: config.renderScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not initialize 2D canvas context for PDF compression.");

    // Fill white background for clean rendering
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    if (i === 1) {
      previewThumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
    }

    // Convert canvas to optimized JPEG binary
    const jpegBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", config.jpegQuality);
    });

    if (!jpegBlob) {
      throw new Error(`Failed to encode compressed raster image for page ${i}.`);
    }

    const jpegBuffer = await jpegBlob.arrayBuffer();
    const embeddedImage = await newDoc.embedJpg(jpegBuffer);

    // Get original unscaled page dimensions
    const originalViewport = page.getViewport({ scale: 1.0 });
    const newPage = newDoc.addPage([originalViewport.width, originalViewport.height]);

    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    // Preserve text layer so compressed PDF remains searchable, selectable, and editable in PDF Studio
    try {
      const textContent = await page.getTextContent();
      if (textContent && Array.isArray(textContent.items)) {
        for (const item of textContent.items as any[]) {
          if (!item.str || !item.str.trim() || !item.transform) continue;
          const cleanStr = item.str.replace(/[^\x20-\x7E]/g, " ");
          if (!cleanStr.trim()) continue;

          // item.transform: [scaleX, skewY, skewX, scaleY, tx, ty]
          const tx = item.transform[4];
          const ty = item.transform[5];
          const rawSize = item.height || Math.hypot(item.transform[0], item.transform[1]) || 12;
          const fontSize = Math.max(Math.min(rawSize, 72), 4);

          // Draw invisible text layer over the compressed page
          newPage.drawText(cleanStr, {
            x: Math.max(0, Math.min(tx, originalViewport.width - 5)),
            y: Math.max(0, Math.min(ty, originalViewport.height - 5)),
            size: fontSize,
            font: standardFont,
            color: rgb(0, 0, 0),
            opacity: 0,
          });
        }
      }
    } catch (textErr) {
      console.warn("Could not preserve text stream for page", i, textErr);
    }
  }

  onProgress?.({
    stage: "assembling",
    currentPage: totalPages,
    totalPages,
    percent: 90,
    message: "Finalizing stream dictionaries and writing optimized PDF binary...",
  });

  const compressedBytes = await newDoc.save({
    useObjectStreams: false,
    addDefaultPage: false,
  });

  const compressedSize = compressedBytes.byteLength;
  const savingsBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = originalSize > 0 ? Math.round((savingsBytes / originalSize) * 100) : 0;

  onProgress?.({
    stage: "completed",
    currentPage: totalPages,
    totalPages,
    percent: 100,
    message: `Compression complete! Reduced file by ${savingsPercent}%.`,
  });

  return {
    originalSize,
    compressedSize,
    savingsBytes,
    savingsPercent,
    pageCount: totalPages,
    compressedBytes,
    preset,
    previewThumbnailUrl,
  };
}
