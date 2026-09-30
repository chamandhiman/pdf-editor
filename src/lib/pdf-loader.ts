/* Browser-only pdf.js loader. Always import this lazily (inside an effect). */
export type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
export type PdfDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;

let lib: PdfJs | null = null;

export async function getPdfJs(): Promise<PdfJs> {
  if (lib) return lib;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  } catch (err) {
    console.warn("Failed to load local worker URL, falling back to CDN:", err);
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/legacy/build/pdf.worker.min.mjs`;
  }
  lib = pdfjs;
  return lib;
}

export async function loadPdfDocument(bytes: ArrayBuffer): Promise<PdfDocumentProxy> {
  const pdfjs = await getPdfJs();
  try {
    // slice() so pdf.js never detaches the stored buffer
    return await pdfjs.getDocument({
      data: bytes.slice(0),
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/cmaps/`,
      cMapPacked: true,
    }).promise;
  } catch (err) {
    console.warn("Primary PDF load failed, attempting fallback worker...", err);
    const cdnWorker = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/legacy/build/pdf.worker.min.mjs`;
    if (pdfjs.GlobalWorkerOptions.workerSrc !== cdnWorker) {
      pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
      return pdfjs.getDocument({
        data: bytes.slice(0),
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/cmaps/`,
        cMapPacked: true,
      }).promise;
    }
    throw err;
  }
}
