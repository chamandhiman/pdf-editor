import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadPdfDocument } from "./pdf-loader";

export interface SupportedOcrLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const OCR_SUPPORTED_LANGUAGES: SupportedOcrLanguage[] = [
  { code: "eng", name: "English", nativeName: "English" },
  { code: "spa", name: "Spanish", nativeName: "Español" },
  { code: "fra", name: "French", nativeName: "Français" },
  { code: "deu", name: "German", nativeName: "Deutsch" },
  { code: "ita", name: "Italian", nativeName: "Italiano" },
  { code: "por", name: "Portuguese", nativeName: "Português" },
  { code: "hin", name: "Hindi", nativeName: "हिन्दी" },
  { code: "chi_sim", name: "Chinese Simplified", nativeName: "简体中文" },
  { code: "jpn", name: "Japanese", nativeName: "日本語" },
  { code: "rus", name: "Russian", nativeName: "Русский" },
  { code: "ara", name: "Arabic", nativeName: "العربية" },
];

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  wordCount: number;
  lineCount: number;
  thumbnailUrl?: string;
  lines: string[];
}

export interface OcrEngineResult {
  pages: OcrPageResult[];
  fullText: string;
  totalWords: number;
  averageConfidence: number;
  searchablePdfBytes?: Uint8Array | undefined;
}

export interface OcrProgressUpdate {
  stage: "loading" | "rendering" | "recognizing" | "generating" | "completed";
  currentPage: number;
  totalPages: number;
  pageProgress: number; // 0 to 100
  overallProgress: number; // 0 to 100
  message: string;
}

/**
 * Checks if a PDF already contains native vector text streams
 */
export async function inspectPdfNativeText(bytes: ArrayBuffer): Promise<{
  hasNativeText: boolean;
  totalNativeChars: number;
  pageCount: number;
}> {
  try {
    const pdfDoc = await loadPdfDocument(bytes.slice(0));
    let totalChars = 0;
    const samplePages = Math.min(pdfDoc.numPages, 3);

    for (let i = 1; i <= samplePages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      totalChars += pageText.trim().length;
    }

    return {
      hasNativeText: totalChars > 40,
      totalNativeChars: totalChars,
      pageCount: pdfDoc.numPages,
    };
  } catch (err) {
    console.warn("Failed to inspect native text:", err);
    return {
      hasNativeText: false,
      totalNativeChars: 0,
      pageCount: 0,
    };
  }
}

/**
 * Executes high-accuracy OCR on selected pages of a PDF document
 */
export async function runPdfOcr(
  bytes: ArrayBuffer,
  options: {
    language?: string;
    pageIndices?: number[]; // 0-based page indices
    generateSearchablePdf?: boolean;
    onProgress?: (progress: OcrProgressUpdate) => void;
  }
): Promise<OcrEngineResult> {
  const language = options.language || "eng";
  const generateSearchable = options.generateSearchablePdf ?? true;
  const onProgress = options.onProgress;

  onProgress?.({
    stage: "loading",
    currentPage: 0,
    totalPages: 0,
    pageProgress: 0,
    overallProgress: 5,
    message: "Initializing browser OCR engine and loading document...",
  });

  // Dynamically import tesseract.js for optimal bundle splitting
  const { createWorker } = await import("tesseract.js");

  const pdfjsDoc = await loadPdfDocument(bytes.slice(0));
  const totalDocPages = pdfjsDoc.numPages;

  // Determine pages to process
  const pagesToProcess: number[] =
    options.pageIndices && options.pageIndices.length > 0
      ? options.pageIndices.filter((idx) => typeof idx === "number" && idx >= 0 && idx < totalDocPages)
      : Array.from({ length: totalDocPages }, (_, i) => i);

  if (pagesToProcess.length === 0) {
    throw new Error("No valid pages selected for OCR processing.");
  }

  onProgress?.({
    stage: "loading",
    currentPage: 0,
    totalPages: pagesToProcess.length,
    pageProgress: 10,
    overallProgress: 10,
    message: `Preparing neural language model for ${language}...`,
  });

  // Initialize Tesseract worker
  const worker = await createWorker(language, 1, {
    logger: (_m: any) => {
      // Progress logger callback
    },
  });

  const pageResults: OcrPageResult[] = [];
  const renderedThumbnails: Map<number, string> = new Map();
  const pageWordsMap: Map<number, Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>> = new Map();

  try {
    for (let i = 0; i < pagesToProcess.length; i++) {
      const pageIndex = pagesToProcess[i] ?? 0;
      const pageNum = pageIndex + 1;
      const overallBase = 15 + Math.round((i / pagesToProcess.length) * 70);

      onProgress?.({
        stage: "rendering",
        currentPage: i + 1,
        totalPages: pagesToProcess.length,
        pageProgress: 20,
        overallProgress: overallBase,
        message: `Rendering high-resolution scan for page ${pageNum} (${i + 1}/${pagesToProcess.length})...`,
      });

      // 1. Render page to high-res canvas (2.0 scale for crisp OCR)
      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not initialize 2D canvas context for OCR rendering.");

      // Fill white background to ensure optimal contrast
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      } as any).promise;

      // Create thumbnail for UI display
      const thumbDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      renderedThumbnails.set(pageIndex, thumbDataUrl);

      onProgress?.({
        stage: "recognizing",
        currentPage: i + 1,
        totalPages: pagesToProcess.length,
        pageProgress: 50,
        overallProgress: overallBase + Math.round(35 / pagesToProcess.length),
        message: `Recognizing characters on page ${pageNum}...`,
      });

      // 2. Perform OCR recognition with Tesseract.js
      const recogResult = await worker.recognize(canvas);
      const data = recogResult.data as any;

      const recognizedText: string = data.text || "";
      const confidence = Math.round(data.confidence || 0);

      // Split into clean lines
      const lines = recognizedText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const words = recognizedText
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      // Extract words bounding boxes if available for searchable overlay
      const wordBoxes: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> = [];
      if (Array.isArray(data?.words)) {
        for (const w of data.words) {
          if (w.text && w.bbox) {
            wordBoxes.push({
              text: w.text,
              bbox: {
                x0: w.bbox.x0 / 2.0, // Scale down from 2x viewport back to 1x PDF points
                y0: w.bbox.y0 / 2.0,
                x1: w.bbox.x1 / 2.0,
                y1: w.bbox.y1 / 2.0,
              },
            });
          }
        }
      }
      pageWordsMap.set(pageIndex, wordBoxes);

      pageResults.push({
        pageNumber: pageNum,
        text: recognizedText.trim(),
        confidence,
        wordCount: words.length,
        lineCount: lines.length,
        thumbnailUrl: thumbDataUrl,
        lines,
      });

      onProgress?.({
        stage: "recognizing",
        currentPage: i + 1,
        totalPages: pagesToProcess.length,
        pageProgress: 100,
        overallProgress: 15 + Math.round(((i + 1) / pagesToProcess.length) * 70),
        message: `Extracted ${words.length} words with ${confidence}% confidence from page ${pageNum}.`,
      });
    }
  } finally {
    // Terminate worker to free WebAssembly memory
    await worker.terminate();
  }

  // Calculate totals
  const totalWords = pageResults.reduce((acc, p) => acc + p.wordCount, 0);
  const averageConfidence =
    pageResults.length > 0
      ? Math.round(pageResults.reduce((acc, p) => acc + p.confidence, 0) / pageResults.length)
      : 0;

  const fullText = pageResults
    .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
    .join("\n\n");

  let searchablePdfBytes: Uint8Array | undefined;

  // 3. Generate Searchable PDF with invisible text layer
  if (generateSearchable) {
    onProgress?.({
      stage: "generating",
      currentPage: pagesToProcess.length,
      totalPages: pagesToProcess.length,
      pageProgress: 90,
      overallProgress: 90,
      message: "Synthesizing searchable PDF document with embedded text layer...",
    });

    try {
      const pdfLibDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
      const standardFont = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageIndex = pagesToProcess[i];
        if (typeof pageIndex !== "number" || pageIndex >= pdfLibDoc.getPageCount()) continue;

        const pdfPage = pdfLibDoc.getPage(pageIndex);
        const { width: pageWidth, height: pageHeight } = pdfPage.getSize();
        const words = pageWordsMap.get(pageIndex) || [];

        if (words.length > 0) {
          for (const word of words) {
            const wordWidth = Math.max(word.bbox.x1 - word.bbox.x0, 2);
            const wordHeight = Math.max(word.bbox.y1 - word.bbox.y0, 8);
            const fontSize = Math.max(Math.min(wordHeight * 0.85, 24), 6);

            // In PDF coordinates, origin (0,0) is bottom-left, while canvas is top-left
            const pdfX = Math.max(0, Math.min(word.bbox.x0, pageWidth - 10));
            const pdfY = Math.max(0, Math.min(pageHeight - word.bbox.y1, pageHeight - 10));

            try {
              // Draw invisible text (opacity: 0) directly over the scanned word
              pdfPage.drawText(word.text, {
                x: pdfX,
                y: pdfY,
                size: fontSize,
                font: standardFont,
                color: rgb(0, 0, 0),
                opacity: 0, // Fully invisible to preserve original scan visual fidelity
              });
            } catch {
              // Ignore individual character encoding fallback
            }
          }
        } else {
          // Fallback: draw full page text lines invisibly
          const pageRes = pageResults.find((p) => p.pageNumber === pageIndex + 1);
          if (pageRes && pageRes.lines.length > 0) {
            const lineSpacing = Math.min(pageHeight / (pageRes.lines.length + 2), 16);
            let currentY = pageHeight - 30;

            for (const line of pageRes.lines) {
              if (currentY < 20) break;
              try {
                // Strip characters incompatible with WinAnsi
                const cleanLine = line.replace(/[^\x20-\x7E]/g, " ");
                if (cleanLine.trim().length > 0) {
                  pdfPage.drawText(cleanLine, {
                    x: 36,
                    y: currentY,
                    size: 10,
                    font: standardFont,
                    color: rgb(0, 0, 0),
                    opacity: 0,
                  });
                }
              } catch {}
              currentY -= lineSpacing;
            }
          }
        }
      }

      searchablePdfBytes = await pdfLibDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });
    } catch (err) {
      console.warn("Could not embed invisible text layer into searchable PDF:", err);
    }
  }

  onProgress?.({
    stage: "completed",
    currentPage: pagesToProcess.length,
    totalPages: pagesToProcess.length,
    pageProgress: 100,
    overallProgress: 100,
    message: `OCR processing finished! Recognized ${totalWords.toLocaleString()} words across ${pageResults.length} pages.`,
  });

  return {
    pages: pageResults,
    fullText,
    totalWords,
    averageConfidence,
    searchablePdfBytes,
  };
}
