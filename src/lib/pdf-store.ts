/** In-memory holder for the PDF the user uploaded (never leaves the browser). */
let bytes: ArrayBuffer | null = null;
let fileName: string | null = null;

export function setUploadedPdf(data: ArrayBuffer, name: string) {
  bytes = data;
  fileName = name;
}

export function getUploadedPdf(): { bytes: ArrayBuffer; fileName: string } | null {
  return bytes ? { bytes, fileName: fileName ?? "Document.pdf" } : null;
}

export function clearUploadedPdf() {
  bytes = null;
  fileName = null;
}
