import { PDFDocument } from "pdf-lib";
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

