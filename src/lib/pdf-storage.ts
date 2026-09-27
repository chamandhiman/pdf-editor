/**
 * IndexedDB storage for PDF files and editor document state.
 * Allows persisting the PDF across page refreshes.
 */
import type { PDFDocument } from "@/types/pdf";

const DB_NAME = "pdf_studio_storage";
const DB_VERSION = 1;
const STORE_NAME = "active_document";
const ACTIVE_KEY = "current_session_doc";

export interface StoredDocument {
  id: string;
  fileName: string;
  bytes: ArrayBuffer;
  savedAt: number;
  docState?: PDFDocument;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist the uploaded PDF bytes and optionally its document state.
 */
export async function saveActiveDocument(
  fileName: string,
  bytes: ArrayBuffer,
  docState?: PDFDocument,
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record: StoredDocument = {
        id: ACTIVE_KEY,
        fileName,
        bytes: bytes.slice(0),
        savedAt: Date.now(),
        ...(docState ? { docState } : {}),
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to save active document to IndexedDB:", err);
  }
}

/**
 * Update only the editor document state (pages, text overrides, objects) in IndexedDB.
 */
export async function saveDocumentState(docState: PDFDocument): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const getReq = store.get(ACTIVE_KEY);
      getReq.onsuccess = () => {
        const existing = getReq.result as StoredDocument | undefined;
        if (!existing) {
          resolve();
          return;
        }

        existing.docState = docState;
        existing.savedAt = Date.now();
        const putReq = store.put(existing);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to save document state to IndexedDB:", err);
  }
}

/**
 * Load the active PDF and document state from IndexedDB.
 */
export async function loadActiveDocument(): Promise<StoredDocument | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const req = store.get(ACTIVE_KEY);
      req.onsuccess = () => {
        const result = req.result as StoredDocument | undefined;
        resolve(result ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to load active document from IndexedDB:", err);
    return null;
  }
}

/**
 * Clear the active PDF and document state from IndexedDB.
 */
export async function clearActiveDocument(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const req = store.delete(ACTIVE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to clear active document from IndexedDB:", err);
  }
}
