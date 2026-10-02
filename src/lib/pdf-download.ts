/**
 * PDF download helper.
 *
 * When an AppDocument is provided the PDF is first flattened (text overrides
 * + overlay objects written in) before downloading. When no document is given
 * it falls back to the raw uploaded bytes.
 */
import { getUploadedPdf } from "@/lib/pdf-store";
import { exportEditedPdf } from "@/lib/pdf-export";
import type { PDFDocument as AppDocument } from "@/types/pdf";

/** Trigger a browser download of the given bytes. */
function triggerDownload(bytes: ArrayBuffer | Uint8Array, name: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser can start the download
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/**
 * Checks if the document has any user modifications (text overrides, objects, rotations, page structure)
 */
export function documentHasEdits(appDoc: AppDocument): boolean {
  const hasTextOverrides =
    Object.keys(appDoc.textOverrides).length > 0 ||
    Object.keys(appDoc.textStyleOverrides ?? {}).length > 0;
  const hasObjects = appDoc.pages.some((p) => p.objects.length > 0);
  const hasBlankPages = appDoc.pages.some((p) => p.type === "blank");
  const hasRotations = appDoc.pages.some((p) => (p.rotation || 0) % 360 !== 0);
  const hasPageStructuralChanges = appDoc.pages.some(
    (p, i) => (p.originalPageNumber ?? (i + 1)) !== i + 1,
  );

  return (
    hasTextOverrides ||
    hasObjects ||
    hasBlankPages ||
    hasRotations ||
    hasPageStructuralChanges
  );
}

/**
 * Retrieves the compiled PDF bytes for the current document (applying all edits from current editor state).
 */
export async function getDocumentPdfBytes(appDoc: AppDocument): Promise<ArrayBuffer> {
  const upload = getUploadedPdf();
  const isTemplateOrBlank = appDoc.pages.some((p) => p.type === "blank");
  const hasObjects = appDoc.pages.some((p) => p.objects && p.objects.length > 0);

  try {
    const edited = await exportEditedPdf(appDoc);
    if (edited) {
      const ab = edited.buffer.slice(
        edited.byteOffset,
        edited.byteOffset + edited.byteLength,
      ) as ArrayBuffer;
      return ab;
    }
  } catch (err) {
    console.error("[pdf-download] Export failed from current state:", err);
  }

  // Only fall back to raw upload bytes for normal uploaded PDFs when NO template or edits exist
  if (!isTemplateOrBlank && !hasObjects && upload?.bytes) {
    return upload.bytes.slice(0);
  }

  throw new Error("Could not compile PDF from current document edits.");
}

/**
 * Export and download the current PDF with all editor changes applied.
 *
 * @param appDoc  - The current editor document (text overrides + overlay objects + rotations)
 * @param onStart - Called when the export begins (show loading state)
 * @param onDone  - Called when the export finishes (success or failure)
 * @returns true if a download was triggered, false if there was no PDF loaded
 */
export async function downloadEditedPdf(
  appDoc: AppDocument,
  onStart?: () => void,
  onDone?: (ok: boolean) => void,
): Promise<boolean> {
  const upload = getUploadedPdf();
  const fileName = appDoc.fileName || upload?.fileName || "Document.pdf";

  onStart?.();

  const isTemplateOrBlank = appDoc.pages.some((p) => p.type === "blank");
  const hasAnyObjects = appDoc.pages.some((p) => p.objects && p.objects.length > 0);
  const hasEdits = documentHasEdits(appDoc);

  // ALWAYS generate and export from current editor state
  if (isTemplateOrBlank || hasAnyObjects || hasEdits || !upload) {
    try {
      const edited = await exportEditedPdf(appDoc);
      if (edited) {
        triggerDownload(edited, fileName);
        onDone?.(true);
        return true;
      }
    } catch (err) {
      console.error("[pdf-export] Export from current document failed:", err);
    }
  }

  // Fallback to original bytes ONLY for untouched, non-template uploaded PDFs
  if (!isTemplateOrBlank && !hasAnyObjects && upload?.bytes) {
    triggerDownload(upload.bytes, fileName);
    onDone?.(true);
    return true;
  }

  onDone?.(false);
  return false;
}

/**
 * Export and trigger browser native print dialog for the current PDF.
 */
export async function printEditedPdf(
  appDoc: AppDocument,
  onStart?: () => void,
  onDone?: (ok: boolean) => void,
): Promise<boolean> {
  const upload = getUploadedPdf();
  onStart?.();

  let bytes: ArrayBuffer | Uint8Array | null = null;
  const hasEdits = documentHasEdits(appDoc);

  if (hasEdits || !upload) {
    try {
      bytes = await exportEditedPdf(appDoc);
    } catch (err) {
      console.error("[pdf-print] Export failed, falling back to original:", err);
    }
  }

  if (!bytes && upload) {
    bytes = upload.bytes;
  }

  if (!bytes) {
    onDone?.(false);
    window.print();
    return true;
  }

  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;

  document.body.appendChild(iframe);

  let invoked = false;
  const triggerPrint = () => {
    if (invoked) return;
    invoked = true;
    try {
      iframe.focus();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      onDone?.(true);
    } catch {
      try {
        const win = window.open(url, "_blank");
        win?.focus();
        onDone?.(true);
      } catch {
        window.print();
        onDone?.(true);
      }
    }

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      } catch {}
    }, 60_000);
  };

  iframe.onload = () => {
    setTimeout(triggerPrint, 300);
  };

  setTimeout(triggerPrint, 1500);
  return true;
}

/** @deprecated Use downloadEditedPdf instead */
export function downloadCurrentPdf(preferredName?: string): boolean {
  const upload = getUploadedPdf();
  if (!upload) return false;
  triggerDownload(upload.bytes, preferredName ?? upload.fileName);
  return true;
}
