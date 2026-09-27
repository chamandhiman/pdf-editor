/**
 * Lightweight recent-documents store backed by localStorage.
 * No server / Firestore calls here — wire those in later.
 */

export interface RecentDoc {
  id: string;
  fileName: string;
  /** ISO-8601 timestamp of last open */
  openedAt: string;
  /** Number of pages (if known) */
  pages?: number;
}

const KEY = "pdfstudio_recent_docs";
const MAX = 20;

function readAll(): RecentDoc[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentDoc[];
  } catch {
    return [];
  }
}

function writeAll(docs: RecentDoc[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(docs));
  } catch {
    // storage full / private mode — ignore
  }
}

export function getRecentDocs(): RecentDoc[] {
  return readAll();
}

export function recordRecentDoc(fileName: string, pages?: number): RecentDoc {
  const all = readAll();
  // Remove any existing entry with same filename so we bubble it to top
  const filtered = all.filter((d) => d.fileName !== fileName);
  const doc: RecentDoc = {
    id: `doc-${Date.now()}`,
    fileName,
    openedAt: new Date().toISOString(),
    ...(pages !== undefined ? { pages } : {}),
  };
  const updated = [doc, ...filtered].slice(0, MAX);
  writeAll(updated);
  return doc;
}

export function removeRecentDoc(id: string) {
  const updated = readAll().filter((d) => d.id !== id);
  writeAll(updated);
}

export function clearRecentDocs() {
  localStorage.removeItem(KEY);
}
