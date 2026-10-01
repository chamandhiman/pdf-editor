import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { PDFDocument } from "@/types/pdf";
import type { PlanId } from "@/lib/pricing-plans";
import {
  saveActiveDocument,
  saveOfflineCloudDoc,
  getOfflineCloudDocs,
  getOfflineCloudDoc,
  deleteOfflineCloudDoc,
} from "@/lib/pdf-storage";

export interface CloudDocument {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
  expiresAt: string;
  planId: PlanId;
  fileUrl: string;
  storagePath: string;
  pageCount: number;
  thumbnailUrl?: string | null;
  editorState: PDFDocument;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  planId: PlanId;
  planStatus: "active" | "pending_payment" | "expired";
  planStartedAt: string;
  planExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 7 days in milliseconds for the Free cloud storage tier */
export const FREE_TIER_EXPIRATION_DAYS = 7;
export const FREE_TIER_EXPIRATION_MS = FREE_TIER_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Calculates remaining days until document expiration.
 */
export function getRemainingDays(expiresAtIso: string): number {
  const expiresAt = new Date(expiresAtIso).getTime();
  const now = Date.now();
  const diffMs = expiresAt - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Deeply sanitizes any JavaScript object for Firestore.
 * Converts undefined values to null or deletes them, preventing Firestore SDK from rejecting writes.
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

let firestoreDisabled = false;
let storageDisabled = false;

export function isFirestoreAvailable(): boolean {
  if (firestoreDisabled) return false;
  try {
    if (typeof window !== "undefined" && localStorage.getItem("pdfstudio_firestore_disabled") === "true") {
      firestoreDisabled = true;
      return false;
    }
  } catch {}
  return true;
}

export function disableFirestore() {
  firestoreDisabled = true;
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("pdfstudio_firestore_disabled", "true");
    }
  } catch {}
}

export function isStorageAvailable(): boolean {
  if (storageDisabled) return false;
  try {
    if (typeof window !== "undefined" && localStorage.getItem("pdfstudio_storage_disabled") === "true") {
      storageDisabled = true;
      return false;
    }
  } catch {}
  return true;
}

export function disableStorage() {
  storageDisabled = true;
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("pdfstudio_storage_disabled", "true");
    }
  } catch {}
}

/**
 * Wraps any promise with a timeout to prevent infinite hanging states.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `${operationName} timed out after ${Math.round(timeoutMs / 1000)}s.`
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retrieves the user profile, checking local storage cache first for instant UX,
 * then refreshing from Firestore if available.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // 1. Instant check from localStorage cache
  try {
    const cached = localStorage.getItem(`user_profile_${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as UserProfile;
      if (parsed && parsed.planId) {
        return parsed;
      }
    }
  } catch {}

  // 2. If firestore is disabled or not configured, return default free profile
  if (!isFirestoreAvailable()) {
    const defaultProfile: UserProfile = {
      uid: userId,
      email: null,
      displayName: null,
      planId: "free",
      planStatus: "active",
      planStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(defaultProfile));
    } catch {}
    return defaultProfile;
  }

  // 3. Fetch from Firestore with fast timeout
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await withTimeout(getDoc(userDocRef), 2000, "Get user profile");
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      try {
        localStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
    return null;
  } catch {
    disableFirestore();
    return null;
  }
}

/**
 * Saves or updates a user profile document in localStorage and Firestore.
 */
export async function saveUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const nowIso = new Date().toISOString();

  // 1. Persist immediately to localStorage
  try {
    const cached = localStorage.getItem(`user_profile_${userId}`);
    const existing = cached ? JSON.parse(cached) : {};
    const updated = {
      ...existing,
      ...data,
      uid: userId,
      updatedAt: nowIso,
    };
    localStorage.setItem(`user_profile_${userId}`, JSON.stringify(updated));
  } catch {}

  // 2. If firestore is disabled, skip remote write completely
  if (!isFirestoreAvailable()) return;

  // 3. Attempt Firestore sync in background
  try {
    const userDocRef = doc(db, "users", userId);
    const cleanData = sanitizeForFirestore({
      ...data,
      uid: userId,
      updatedAt: nowIso,
    });
    await withTimeout(
      setDoc(userDocRef, cleanData, { merge: true }),
      2500,
      "Save user profile"
    );
  } catch {
    disableFirestore();
  }
}

/**
 * Checks whether the user is permitted to save a document based on their plan limits.
 * Excludes the current document (by id or by name) so updates are always allowed.
 */
export async function canUserSaveDocument(
  userId: string,
  currentDocId?: string,
  currentDocName?: string
): Promise<{
  allowed: boolean;
  reason?: "limit_reached" | "expired";
  currentCount: number;
  maxAllowed: number | "unlimited";
  planId: PlanId;
}> {
  const [profile, documents] = await Promise.all([
    getUserProfile(userId),
    getCloudDocuments(userId).catch(() => []),
  ]);

  const planId: PlanId = profile?.planId || "free";

  // If user is editing/updating an existing saved document, allow it without increasing count
  const otherDocs = documents.filter((d) => {
    if (currentDocId && d.id === currentDocId) return false;
    if (currentDocName && d.name.toLowerCase() === currentDocName.toLowerCase()) return false;
    return true;
  });

  if (planId === "free") {
    const currentCount = otherDocs.length;
    if (currentCount >= 1) {
      return {
        allowed: false,
        reason: "limit_reached",
        currentCount,
        maxAllowed: 1,
        planId: "free",
      };
    }
    return {
      allowed: true,
      currentCount,
      maxAllowed: 1,
      planId: "free",
    };
  }

  // Pro Monthly or Pro Annual allows unlimited documents
  return {
    allowed: true,
    currentCount: otherDocs.length,
    maxAllowed: "unlimited",
    planId,
  };
}

/**
 * Saves document PDF binary and editor state to cloud storage with zero data loss.
 * Attempts Firebase Storage + Firestore, and safely falls back to local user account storage.
 */
export async function saveDocumentToCloud(
  userId: string,
  params: {
    name: string;
    bytes: ArrayBuffer;
    pageCount: number;
    editorState: PDFDocument;
    thumbnailUrl?: string | undefined;
    existingId?: string | undefined;
    planId?: PlanId;
    userEmail?: string | null;
    userDisplayName?: string | null;
  }
): Promise<CloudDocument> {
  const now = new Date();
  const nowIso = now.toISOString();
  const docId = params.existingId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `users/${userId}/documents/${docId}.pdf`;
  const planId: PlanId = params.planId || "free";

  // Expiration calculation: Free plan is strictly 7 days; Pro is extended
  const expiresAt =
    planId === "free"
      ? new Date(now.getTime() + FREE_TIER_EXPIRATION_MS).toISOString()
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Always persist to IndexedDB for zero data loss and instant local recovery
  await saveOfflineCloudDoc({
    id: docId,
    userId,
    name: params.name.trim() || "Untitled Document.pdf",
    bytes: params.bytes.slice(0),
    savedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt,
    planId,
    pageCount: params.pageCount || 1,
    thumbnailUrl: params.thumbnailUrl || null,
    editorState: params.editorState,
  });

  // 2. Also keep active document session up-to-date
  await saveActiveDocument(params.name, params.bytes, params.editorState);

  // 3. Try Firebase Storage upload only if storage is available
  let fileUrl = `indexeddb://${docId}`;
  if (isStorageAvailable()) {
    try {
      const fileRef = ref(storage, storagePath);
      const blob = new Blob([params.bytes], { type: "application/pdf" });
      await withTimeout(
        uploadBytes(fileRef, blob, {
          contentType: "application/pdf",
          customMetadata: {
            userId,
            originalName: params.name,
            planId,
          },
        }),
        3000,
        "PDF Storage upload"
      );
      fileUrl = await withTimeout(getDownloadURL(fileRef), 2500, "Get download URL");
    } catch {
      disableStorage();
    }
  }

  // 4. Build CloudDocument record
  const rawCloudDoc: CloudDocument = {
    id: docId,
    userId,
    name: params.name.trim() || "Untitled Document.pdf",
    createdAt: nowIso,
    updatedAt: nowIso,
    savedAt: nowIso,
    expiresAt,
    planId,
    fileUrl,
    storagePath,
    pageCount: params.pageCount || 1,
    thumbnailUrl: params.thumbnailUrl || null,
    editorState: params.editorState,
  };

  const cleanDoc = sanitizeForFirestore(rawCloudDoc);

  // 5. Try Firestore document save only if firestore is available
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(db, "users", userId, "documents", docId);
      await withTimeout(setDoc(docRef, cleanDoc), 2500, "Firestore document save");
    } catch {
      disableFirestore();
    }
  }

  // 6. Update user profile to reflect active plan
  try {
    await saveUserProfile(userId, {
      uid: userId,
      email: params.userEmail || null,
      displayName: params.userDisplayName || null,
      planId,
      planStatus: "active",
      planStartedAt: nowIso,
      planExpiresAt: expiresAt,
      createdAt: nowIso,
    });
  } catch {}

  return cleanDoc;
}

/**
 * Retrieves all saved cloud documents for an authenticated user.
 * Merges Firestore remote documents and IndexedDB offline cloud documents.
 */
export async function getCloudDocuments(userId: string): Promise<CloudDocument[]> {
  const offlineDocs = await getOfflineCloudDocs(userId);
  const offlineCloudDocs: CloudDocument[] = offlineDocs.map((od) => ({
    id: od.id,
    userId: od.userId,
    name: od.name,
    createdAt: od.createdAt,
    updatedAt: od.updatedAt,
    savedAt: od.savedAt,
    expiresAt: od.expiresAt,
    planId: (od.planId as PlanId) || "free",
    fileUrl: `indexeddb://${od.id}`,
    storagePath: `users/${od.userId}/documents/${od.id}.pdf`,
    pageCount: od.pageCount || 1,
    thumbnailUrl: od.thumbnailUrl || null,
    editorState: od.editorState,
  }));

  if (!isFirestoreAvailable()) {
    return offlineCloudDocs;
  }

  try {
    const collRef = collection(db, "users", userId, "documents");
    const q = query(collRef, orderBy("updatedAt", "desc"));
    const snapshot = await withTimeout(getDocs(q), 2500, "Fetch cloud documents");

    const firestoreDocs: CloudDocument[] = [];
    snapshot.forEach((snap) => {
      firestoreDocs.push(snap.data() as CloudDocument);
    });

    const map = new Map<string, CloudDocument>();
    for (const od of offlineCloudDocs) {
      map.set(od.id, od);
    }
    for (const fd of firestoreDocs) {
      map.set(fd.id, fd);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    disableFirestore();
    return offlineCloudDocs;
  }
}

/**
 * Retrieves a single cloud document by ID.
 */
export async function getCloudDocumentById(
  userId: string,
  docId: string
): Promise<CloudDocument | null> {
  const offline = await getOfflineCloudDoc(docId);
  if (offline) {
    return {
      id: offline.id,
      userId: offline.userId,
      name: offline.name,
      createdAt: offline.createdAt,
      updatedAt: offline.updatedAt,
      savedAt: offline.savedAt,
      expiresAt: offline.expiresAt,
      planId: (offline.planId as PlanId) || "free",
      fileUrl: `indexeddb://${offline.id}`,
      storagePath: `users/${offline.userId}/documents/${offline.id}.pdf`,
      pageCount: offline.pageCount || 1,
      thumbnailUrl: offline.thumbnailUrl || null,
      editorState: offline.editorState,
    };
  }

  if (!isFirestoreAvailable()) return null;

  try {
    const docRef = doc(db, "users", userId, "documents", docId);
    const snap = await withTimeout(getDoc(docRef), 2500, "Get document by ID");
    if (!snap.exists()) return null;
    return snap.data() as CloudDocument;
  } catch {
    disableFirestore();
    return null;
  }
}

/**
 * Deletes a document from Firestore, Storage, and IndexedDB.
 */
export async function deleteCloudDocument(
  userId: string,
  docId: string,
  storagePath?: string
): Promise<void> {
  // 1. Delete from IndexedDB offline storage
  await deleteOfflineCloudDoc(docId).catch(() => {});

  // 2. Try delete from Firestore if available
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(db, "users", userId, "documents", docId);
      await withTimeout(deleteDoc(docRef), 2500, "Delete document record");
    } catch {
      disableFirestore();
    }
  }

  // 3. Try delete from Storage if available
  if (isStorageAvailable() && storagePath) {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef).catch(() => {});
    } catch {
      disableStorage();
    }
  }
}

