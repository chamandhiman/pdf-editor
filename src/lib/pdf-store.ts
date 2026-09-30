/** In-memory holder for the PDF the user uploaded, synced with IndexedDB. */
import { saveActiveDocument, clearActiveDocument } from "@/lib/pdf-storage";
import type { PDFDocument } from "@/types/pdf";

let bytes: ArrayBuffer | null = null;
let fileName: string | null = null;
let docState: PDFDocument | null = null;

export function setUploadedPdf(data: ArrayBuffer, name: string, state?: PDFDocument) {
  bytes = data;
  fileName = name;
  docState = state ?? null;
  // Automatically persist to IndexedDB asynchronously
  saveActiveDocument(name, data, state).catch((e) =>
    console.warn("[pdf-store] Failed to persist PDF to IndexedDB", e),
  );
}

export function getUploadedPdf(): { bytes: ArrayBuffer; fileName: string; docState?: PDFDocument } | null {
  return bytes
    ? {
        bytes,
        fileName: fileName ?? "Document.pdf",
        ...(docState ? { docState } : {}),
      }
    : null;
}

export function clearUploadedPdf() {
  bytes = null;
  fileName = null;
  docState = null;
  clearActiveDocument().catch((e) =>
    console.warn("[pdf-store] Failed to clear IndexedDB", e),
  );
}

