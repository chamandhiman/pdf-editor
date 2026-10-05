import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { loadPdfDocument } from "./pdf-loader";

/**
 * Rapidly retrieves page count of an ArrayBuffer PDF using pdf-lib
 */
export async function getPdfPageCount(bytes: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Merges multiple PDF ArrayBuffers into a single unified PDF
 */
export async function mergePdfFiles(
  files: { name: string; buffer: ArrayBuffer }[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error("At least two PDF files are required to merge.");
  }

  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    if (onProgress) onProgress(i + 1, files.length);

    const srcDoc = await PDFDocument.load(file.buffer.slice(0), {
      ignoreEncryption: true,
    });

    // 1. Flatten interactive forms (AcroForm) so fields and values are burned
    // into visual page contents. Otherwise, copying pages drops form dictionaries,
    // resulting in white blank pages where form data was.
    try {
      const form = srcDoc.getForm();
      form.flatten();
    } catch {
      // Safe to ignore if document does not contain an AcroForm or fields
    }

    const pageIndices = srcDoc.getPageIndices();
    if (pageIndices.length === 0) continue;

    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
    for (const page of copiedPages) {
      // 2. Normalize CropBox and MediaBox coordinates. If CropBox is missing,
      // zero-sized, or shifted outside MediaBox, viewers clip to white.
      try {
        const mediaBox = page.getMediaBox();
        const cropBox = page.getCropBox();
        if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
          page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
        }
      } catch {
        // Safe fallback
      }

      mergedDoc.addPage(page);
    }
  }

  // 3. Save without object streams to ensure maximum compatibility across all
  // browser PDF engines, mobile readers, and desktop viewers.
  return mergedDoc.save({ useObjectStreams: false, addDefaultPage: false });
}

export interface SplitFileResult {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  label: string;
}

/**
 * Parses a page range string (e.g., "1-3, 5, 7-10") into an array of range objects
 */
export function parsePageRanges(rangeStr: string, totalPages: number): { start: number; end: number }[] {
  const parts = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);
  const ranges: { start: number; end: number }[] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr = "", endStr = ""] = part.split("-").map((s) => s.trim());
      const start = Math.max(1, Math.min(parseInt(startStr, 10) || 1, totalPages));
      const end = Math.max(start, Math.min(parseInt(endStr, 10) || totalPages, totalPages));
      ranges.push({ start, end });
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        ranges.push({ start: pageNum, end: pageNum });
      }
    }
  }

  return ranges;
}

/**
 * Splits a PDF document by ranges or into individual pages
 */
export async function splitPdfFile(
  bytes: ArrayBuffer,
  baseFileName: string,
  options: {
    mode: "ranges" | "each";
    ranges?: string;
  },
  onProgress?: (current: number, total: number) => void
): Promise<SplitFileResult[]> {
  const srcDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  try {
    srcDoc.getForm().flatten();
  } catch {
    // Safe to ignore if document does not contain an AcroForm
  }

  const totalPages = srcDoc.getPageCount();
  const baseName = baseFileName.replace(/\.pdf$/i, "");
  const results: SplitFileResult[] = [];

  const copyAndNormalize = async (doc: PDFDocument, indices: number[]) => {
    const copied = await doc.copyPages(srcDoc, indices);
    for (const page of copied) {
      try {
        const mediaBox = page.getMediaBox();
        const cropBox = page.getCropBox();
        if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
          page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
        }
      } catch {
        // Safe fallback
      }
      doc.addPage(page);
    }
  };

  if (options.mode === "each") {
    // Extract every single page into its own PDF
    for (let i = 0; i < totalPages; i++) {
      if (onProgress) onProgress(i + 1, totalPages);
      const newDoc = await PDFDocument.create();
      await copyAndNormalize(newDoc, [i]);
      const splitBytes = await newDoc.save({ useObjectStreams: false, addDefaultPage: false });
      results.push({
        name: `${baseName}_page_${i + 1}.pdf`,
        bytes: splitBytes,
        pageCount: 1,
        label: `Page ${i + 1}`,
      });
    }
  } else {
    // Extract by ranges
    const rangeList = parsePageRanges(options.ranges || `1-${totalPages}`, totalPages);
    if (rangeList.length === 0) {
      throw new Error("Please specify at least one valid page range (e.g. 1-3, 5).");
    }

    for (let idx = 0; idx < rangeList.length; idx++) {
      const range = rangeList[idx];
      if (!range) continue;
      const { start, end } = range;
      if (onProgress) onProgress(idx + 1, rangeList.length);

      const pageIndices: number[] = [];
      for (let p = start; p <= end; p++) {
        pageIndices.push(p - 1);
      }

      const newDoc = await PDFDocument.create();
      await copyAndNormalize(newDoc, pageIndices);

      const splitBytes = await newDoc.save({ useObjectStreams: false, addDefaultPage: false });
      const rangeLabel = start === end ? `page_${start}` : `pages_${start}-${end}`;
      results.push({
        name: `${baseName}_${rangeLabel}.pdf`,
        bytes: splitBytes,
        pageCount: pageIndices.length,
        label: start === end ? `Page ${start}` : `Pages ${start}–${end}`,
      });
    }
  }

  return results;
}

/**
 * Bundles multiple files into a downloadable ZIP archive
 */
export async function bundleFilesIntoZip(
  files: { name: string; bytes: Uint8Array }[],
  zipFilename = "split_documents.zip"
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.bytes);
  }

  const content = await zip.generateAsync({ type: "blob" });
  return { blob: content, filename: zipFilename };
}

/**
 * Removes specified 1-indexed page numbers from a PDF document
 */
export async function removePdfPages(
  bytes: ArrayBuffer,
  pageNumbersToRemove: number[]
): Promise<{ bytes: Uint8Array; remainingCount: number }> {
  const srcDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  try {
    srcDoc.getForm().flatten();
  } catch {
    // Safe to ignore if document does not contain an AcroForm
  }

  const totalPages = srcDoc.getPageCount();

  const removeSet = new Set(pageNumbersToRemove);
  const retainedIndices: number[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (!removeSet.has(i)) {
      retainedIndices.push(i - 1);
    }
  }

  if (retainedIndices.length === 0) {
    throw new Error("You cannot remove all pages from the document. At least one page must remain.");
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, retainedIndices);
  for (const page of copiedPages) {
    try {
      const mediaBox = page.getMediaBox();
      const cropBox = page.getCropBox();
      if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
        page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
      }
    } catch {
      // Safe fallback
    }
    newDoc.addPage(page);
  }

  const finalBytes = await newDoc.save({ useObjectStreams: false, addDefaultPage: false });
  return {
    bytes: finalBytes,
    remainingCount: retainedIndices.length,
  };
}

/**
 * Reorders pages of a PDF document based on a 1-indexed order array
 */
export async function reorderPdfPages(
  bytes: ArrayBuffer,
  newPageOrder: number[],
  onProgress?: (current: number, total: number) => void
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (newPageOrder.length === 0) {
    throw new Error("Page order cannot be empty.");
  }

  const srcDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  try {
    srcDoc.getForm().flatten();
  } catch {
    // Safe fallback if document does not have an AcroForm
  }

  const totalPages = srcDoc.getPageCount();
  const pageIndices: number[] = [];

  for (const pageNum of newPageOrder) {
    if (pageNum >= 1 && pageNum <= totalPages) {
      pageIndices.push(pageNum - 1);
    }
  }

  if (pageIndices.length === 0) {
    throw new Error("No valid page numbers found to reorder.");
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i]!;
    if (onProgress) onProgress(i + 1, copiedPages.length);

    try {
      const mediaBox = page.getMediaBox();
      const cropBox = page.getCropBox();
      if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
        page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
      }
    } catch {
      // Safe fallback
    }

    newDoc.addPage(page);
  }

  const finalBytes = await newDoc.save({ useObjectStreams: false, addDefaultPage: false });
  return {
    bytes: finalBytes,
    pageCount: pageIndices.length,
  };
}

/**
 * Client-side thumbnail renderer for previewing pages
 */
export async function renderPageThumbnail(
  bytes: ArrayBuffer,
  pageNumber: number,
  targetWidth = 160
): Promise<string> {
  const doc = await loadPdfDocument(bytes);
  const page = await doc.getPage(pageNumber);

  const initialViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render as any)({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Rapidly and memory-efficiently renders thumbnails for all pages of a PDF document
 */
export async function renderAllDocumentThumbnails(
  bytes: ArrayBuffer,
  onThumbnailReady?: (pageNumber: number, dataUrl: string) => void,
  targetWidth = 180
): Promise<Record<number, string>> {
  const doc = await loadPdfDocument(bytes);
  const totalPages = doc.numPages;
  const results: Record<number, string> = {};

  for (let p = 1; p <= totalPages; p++) {
    try {
      const page = await doc.getPage(p);
      const initialViewport = page.getViewport({ scale: 1 });
      const scale = targetWidth / initialViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await (page.render as any)({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        results[p] = dataUrl;
        onThumbnailReady?.(p, dataUrl);
      }
    } catch (err) {
      console.warn(`Failed to render thumbnail for page ${p}:`, err);
    }
  }

  return results;
}

/**
 * Rotates specific pages or all pages of a PDF document by 90, 180, or 270 degrees
 */
export async function rotatePdfPages(
  bytes: ArrayBuffer,
  rotations: Record<number, number> // pageNumber (1-indexed) -> degrees (e.g. 90, 180, 270)
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  for (let p = 1; p <= totalPages; p++) {
    const additionalDeg = rotations[p] || 0;
    if (additionalDeg !== 0) {
      const page = doc.getPage(p - 1);
      const current = page.getRotation().angle;
      const newAngle = ((current + additionalDeg) % 360 + 360) % 360;
      page.setRotation(degrees(newAngle));
    }
  }

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number;
  color?: { r: number; g: number; b: number };
  angle?: number; // degrees, e.g. 45 for diagonal, 0 for horizontal
}

/**
 * Applies a customizable text or stamp watermark across all pages of a PDF
 */
export async function watermarkPdf(
  bytes: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = doc.getPageCount();

  const fontSize = options.fontSize || 48;
  const opacity = options.opacity !== undefined ? options.opacity : 0.25;
  const angle = options.angle !== undefined ? options.angle : 45;
  const col = options.color || { r: 0.8, g: 0.1, b: 0.1 };
  const text = (options.text || "CONFIDENTIAL").replace(/[^\x20-\x7E]/g, "?");

  for (let i = 0; i < totalPages; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const cx = width / 2;
    const cy = height / 2;

    const x = cx - (textWidth / 2) * cos + (textHeight / 2) * sin;
    const y = cy - (textWidth / 2) * sin - (textHeight / 2) * cos;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(col.r, col.g, col.b),
      opacity,
      rotate: degrees(angle),
    });
  }

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}

export interface PageNumberOptions {
  format?: string; // e.g. "Page {n} of {total}" or "{n}" or "Page {n}"
  position?: "bottom-center" | "bottom-right" | "bottom-left" | "top-right" | "top-center";
  fontSize?: number;
  startPage?: number;
}

/**
 * Inserts formatted page numbers into each page of a PDF document
 */
export async function addPageNumbersToPdf(
  bytes: ArrayBuffer,
  options: PageNumberOptions = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const totalPages = doc.getPageCount();

  const format = options.format || "Page {n} of {total}";
  const position = options.position || "bottom-center";
  const fontSize = options.fontSize || 10;
  const startPage = options.startPage || 1;

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + startPage;
    const page = doc.getPage(i);
    const { width, height } = page.getSize();

    const label = format
      .replace("{n}", String(pageNum))
      .replace("{total}", String(totalPages + startPage - 1));

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    let x = width / 2 - textWidth / 2;
    let y = 30;

    if (position === "bottom-right") {
      x = width - textWidth - 36;
      y = 30;
    } else if (position === "bottom-left") {
      x = 36;
      y = 30;
    } else if (position === "top-right") {
      x = width - textWidth - 36;
      y = height - 36;
    } else if (position === "top-center") {
      x = width / 2 - textWidth / 2;
      y = height - 36;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}

/**
 * Extracts specific 1-indexed page numbers into a standalone PDF document
 */
export async function extractPdfPages(
  bytes: ArrayBuffer,
  pageNumbersToExtract: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
  try {
    srcDoc.getForm().flatten();
  } catch {
    // ignore
  }

  const totalPages = srcDoc.getPageCount();
  const validIndices = pageNumbersToExtract
    .filter((n) => n >= 1 && n <= totalPages)
    .map((n) => n - 1);

  if (validIndices.length === 0) {
    throw new Error("No valid pages selected to extract.");
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);

  for (const page of copiedPages) {
    try {
      const mediaBox = page.getMediaBox();
      const cropBox = page.getCropBox();
      if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
        page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
      }
    } catch {
      // ignore
    }
    newDoc.addPage(page);
  }

  return newDoc.save({ useObjectStreams: false, addDefaultPage: false });
}

