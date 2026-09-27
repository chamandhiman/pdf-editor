/** In-memory holder for the PDF the user uploaded, synced with IndexedDB. */
import { saveActiveDocument, clearActiveDocument } from "@/lib/pdf-storage";

let bytes: ArrayBuffer | null = null;
let fileName: string | null = null;

export function setUploadedPdf(data: ArrayBuffer, name: string) {
  bytes = data;
  fileName = name;
  // Automatically persist to IndexedDB asynchronously
  saveActiveDocument(name, data).catch((e) =>
    console.warn("[pdf-store] Failed to persist PDF to IndexedDB", e),
  );
}

export function getUploadedPdf(): { bytes: ArrayBuffer; fileName: string } | null {
  return bytes ? { bytes, fileName: fileName ?? "Document.pdf" } : null;
}

export function clearUploadedPdf() {
  bytes = null;
  fileName = null;
  clearActiveDocument().catch((e) =>
    console.warn("[pdf-store] Failed to clear IndexedDB", e),
  );
}
