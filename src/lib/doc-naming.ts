/**
 * Utility helpers for robust document naming, URL param decoding, and matching.
 */

export function cleanDocName(name?: string | null): string {
  if (!name) return "";
  try {
    return decodeURIComponent(name.replace(/\+/g, " ")).trim();
  } catch {
    return name.replace(/\+/g, " ").trim();
  }
}

export function normalizeDocKey(name?: string | null): string {
  return cleanDocName(name)
    .toLowerCase()
    .replace(/^recent[_-]/i, "")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]/g, "");
}

export function isSameDoc(nameA?: string | null, nameB?: string | null): boolean {
  if (!nameA || !nameB) return false;
  if (nameA === nameB) return true;

  const cleanA = cleanDocName(nameA).toLowerCase();
  const cleanB = cleanDocName(nameB).toLowerCase();
  if (cleanA === cleanB) return true;

  const keyA = normalizeDocKey(nameA);
  const keyB = normalizeDocKey(nameB);
  if (keyA && keyB && keyA === keyB) return true;

  const baseA = cleanA.replace(/^recent[_-]/i, "").replace(/\.pdf$/i, "").trim();
  const baseB = cleanB.replace(/^recent[_-]/i, "").replace(/\.pdf$/i, "").trim();
  if (baseA && baseB && baseA === baseB) return true;

  return false;
}
