/**
 * Lightweight recent-documents store backed by localStorage.
 * No server / Firestore calls here — wire those in later.
 */

import { cleanDocName, isSameDoc } from "./doc-naming";

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
  if (!fileName || fileName.trim().length === 0) {
    return { id: "doc-empty", fileName: "Untitled.pdf", openedAt: new Date().toISOString() };
  }
  const cleanName = cleanDocName(fileName);
  const all = readAll();
  // Remove any existing entry matching same document so we bubble it to top
  const filtered = all.filter((d) => !isSameDoc(d.fileName, cleanName));
  const doc: RecentDoc = {
    id: `doc-${Date.now()}`,
    fileName: cleanName,
    openedAt: new Date().toISOString(),
    ...(pages !== undefined ? { pages } : {}),
  };
  const updated = [doc, ...filtered].slice(0, MAX);
  writeAll(updated);
  return doc;
}

export function removeRecentDoc(idOrName: string) {
  const updated = readAll().filter(
    (d) => d.id !== idOrName && !isSameDoc(d.fileName, idOrName)
  );
  writeAll(updated);
}

export function clearRecentDocs() {
  localStorage.removeItem(KEY);
}
