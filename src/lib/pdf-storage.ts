/**
 * IndexedDB storage for PDF files and editor document state.
 * Allows persisting the PDF across page refreshes.
 */
import type { PDFDocument } from "@/types/pdf";

const DB_NAME = "pdf_studio_storage";
const DB_VERSION = 2;
const STORE_NAME = "active_document";
const SAVED_DOCS_STORE = "saved_documents";
const ACTIVE_KEY = "current_session_doc";

export interface StoredDocument {
  id: string;
  fileName: string;
  bytes: ArrayBuffer;
  savedAt: number;
  docState?: PDFDocument;
}

export interface OfflineCloudDoc {
  id: string;
  userId: string;
  name: string;
  bytes: ArrayBuffer;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  planId: string;
  pageCount: number;
  thumbnailUrl?: string | null;
  editorState: PDFDocument;
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
      if (!db.objectStoreNames.contains(SAVED_DOCS_STORE)) {
        db.createObjectStore(SAVED_DOCS_STORE, { keyPath: "id" });
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

    // 1. Persist to active document session
    await new Promise<void>((resolve, reject) => {
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

    // 2. Also persist a named copy to SAVED_DOCS_STORE so it can be restored from history/recent documents
    const sanitizedId = `recent_${fileName.toLowerCase().replace(/[^a-z0-9_.-]/g, "_")}`;
    const nowIso = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SAVED_DOCS_STORE, "readwrite");
      const store = tx.objectStore(SAVED_DOCS_STORE);

      const savedDoc: OfflineCloudDoc = {
        id: sanitizedId,
        userId: "local",
        name: fileName,
        bytes: bytes.slice(0),
        savedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        planId: "free",
        pageCount: docState?.pages?.length || 1,
        thumbnailUrl: null,
        editorState: docState || {
          id: "doc-1",
          fileName,
          pageSize: "A4",
          orientation: "Portrait",
          pages: [],
          textOverrides: {},
          textColorOverrides: {},
          textBgOverrides: {},
          textStyleOverrides: {},
        },
      };

      const req = store.put(savedDoc);
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

    const existing = await new Promise<StoredDocument | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const getReq = store.get(ACTIVE_KEY);
      getReq.onsuccess = () => {
        const current = getReq.result as StoredDocument | undefined;
        if (!current) {
          resolve(undefined);
          return;
        }

        current.docState = docState;
        current.savedAt = Date.now();
        const putReq = store.put(current);
        putReq.onsuccess = () => resolve(current);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });

    if (existing && existing.fileName) {
      const sanitizedId = `recent_${existing.fileName.toLowerCase().replace(/[^a-z0-9_.-]/g, "_")}`;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SAVED_DOCS_STORE, "readwrite");
        const store = tx.objectStore(SAVED_DOCS_STORE);
        const getReq = store.get(sanitizedId);
        getReq.onsuccess = () => {
          const item = getReq.result as OfflineCloudDoc | undefined;
          if (item) {
            item.editorState = docState;
            item.updatedAt = new Date().toISOString();
            const putReq = store.put(item);
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
          } else {
            resolve();
          }
        };
        getReq.onerror = () => reject(getReq.error);
      });
    }
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

/**
 * Save a cloud document to IndexedDB for resilience and instant access.
 */
export async function saveOfflineCloudDoc(doc: OfflineCloudDoc): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_DOCS_STORE, "readwrite");
      const store = tx.objectStore(SAVED_DOCS_STORE);
      const req = store.put(doc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to save offline cloud doc:", err);
  }
}

/**
 * Retrieve all saved cloud documents for a specific user from IndexedDB.
 */
export async function getOfflineCloudDocs(userId?: string): Promise<OfflineCloudDoc[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_DOCS_STORE, "readonly");
      const store = tx.objectStore(SAVED_DOCS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result as OfflineCloudDoc[]) || [];
        if (!userId) {
          resolve(all);
        } else {
          resolve(all.filter((d) => d.userId === userId));
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to get offline cloud docs:", err);
    return [];
  }
}

/**
 * Retrieve a specific saved cloud document by ID from IndexedDB.
 */
export async function getOfflineCloudDoc(id: string): Promise<OfflineCloudDoc | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_DOCS_STORE, "readonly");
      const store = tx.objectStore(SAVED_DOCS_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as OfflineCloudDoc) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to get offline cloud doc:", err);
    return null;
  }
}

/**
 * Delete a saved cloud document from IndexedDB by ID.
 */
export async function deleteOfflineCloudDoc(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_DOCS_STORE, "readwrite");
      const store = tx.objectStore(SAVED_DOCS_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-storage] Failed to delete offline cloud doc:", err);
  }
}
