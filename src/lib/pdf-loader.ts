/* Browser-only pdf.js loader. Always import this lazily (inside an effect). */
export type PdfJs = typeof import("pdfjs-dist");
export type PdfDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;

let lib: PdfJs | null = null;

export async function getPdfJs(): Promise<PdfJs> {
  if (lib) return lib;
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  lib = pdfjs;
  return lib;
}

export async function loadPdfDocument(bytes: ArrayBuffer): Promise<PdfDocumentProxy> {
  const pdfjs = await getPdfJs();
  // slice() so pdf.js never detaches the stored buffer
  return pdfjs.getDocument({ data: bytes.slice(0) }).promise;
}
