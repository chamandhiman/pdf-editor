import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadPdfDocument, type PdfDocumentProxy } from "@/lib/pdf-loader";
import { getUploadedPdf, setUploadedPdf } from "@/lib/pdf-store";
import { loadActiveDocument, getOfflineCloudDocs, saveActiveDocument } from "@/lib/pdf-storage";
import { cleanDocName, normalizeDocKey, isSameDoc } from "@/lib/doc-naming";
import { PDF_TEMPLATES, generateTemplatePdfAndDoc } from "@/lib/pdf-templates";
import type { PDFDocument } from "@/types/pdf";

export interface LoadedPdf {
  doc: PdfDocumentProxy;
  fileName: string;
  sizes: { width: number; height: number }[];
  storedDocState?: PDFDocument | undefined;
}

export const PdfDocContext = createContext<PdfDocumentProxy | null>(null);
export const usePdfDoc = () => useContext(PdfDocContext);

type Status = "empty" | "loading" | "ready" | "error";

function describeLoadFailure(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  if (/password/i.test(raw)) {
    return "This PDF is password protected. Remove the password and try again.";
  }
  if (/InvalidPDF|structure|header|corrupt/i.test(raw)) {
    return "This file is not a valid PDF, or it is damaged.";
  }
  if (/detached|ArrayBuffer/i.test(raw)) {
    return "The file data was lost. Please choose the PDF again.";
  }
  if (/fetch|worker|network|import/i.test(raw)) {
    return "The PDF engine could not start. Check your connection and reload.";
  }
  return `The PDF could not be read (${raw}).`;
}

export function usePdfUpload(targetFileName?: string) {
  const [status, setStatus] = useState<Status>("loading");
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Bump this counter to force a reload of the current store entry
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setPdf(null);
    setErrorMessage(null);
    setReloadTick((t) => t + 1);
  }, []);

  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setStatus("loading");

    (async () => {
      try {
        const cleanTarget = targetFileName ? cleanDocName(targetFileName) : undefined;
        let upload = getUploadedPdf();
        let storedDocState: PDFDocument | undefined = upload?.docState;

        // If targetFileName is requested:
        if (cleanTarget) {
          const memoryMatches = upload && isSameDoc(upload.fileName, cleanTarget);

          if (!memoryMatches) {
            // Memory has a different/stale document or none. Reset upload so the wrong document NEVER opens.
            upload = null;
            storedDocState = undefined;

            // 1. Check active document in IndexedDB
            const active = await loadActiveDocument();
            if (
              active &&
              active.bytes &&
              active.bytes.byteLength > 0 &&
              isSameDoc(active.fileName, cleanTarget)
            ) {
              const fName = active.fileName || cleanTarget;
              upload = {
                bytes: active.bytes,
                fileName: fName,
                ...(active.docState ? { docState: active.docState } : {}),
              };
              storedDocState = active.docState;
              setUploadedPdf(active.bytes, fName, active.docState);
            }

            // 2. Check offline saved docs
            if (!upload) {
              const allSaved = await getOfflineCloudDocs();
              const match = allSaved.find(
                (d) =>
                  isSameDoc(d.name, cleanTarget) ||
                  isSameDoc(d.id, cleanTarget) ||
                  d.id === `recent_${normalizeDocKey(cleanTarget)}`
              );
              if (match && match.bytes && match.bytes.byteLength > 0) {
                const fName = match.name || cleanTarget;
                upload = { bytes: match.bytes, fileName: fName, docState: match.editorState };
                storedDocState = match.editorState;
                setUploadedPdf(match.bytes, fName, match.editorState);
                await saveActiveDocument(fName, match.bytes, match.editorState);
              }
            }

            // 3. Check templates catalog
            if (!upload) {
              const matchedTemplate = PDF_TEMPLATES.find(
                (t) =>
                  isSameDoc(t.name, cleanTarget) ||
                  isSameDoc(t.id, cleanTarget) ||
                  isSameDoc(t.fileName, cleanTarget)
              );
              if (matchedTemplate) {
                try {
                  const generated = await generateTemplatePdfAndDoc(matchedTemplate.id);
                  upload = { bytes: generated.bytes, fileName: generated.fileName, docState: generated.doc };
                  storedDocState = generated.doc;
                  setUploadedPdf(generated.bytes, generated.fileName, generated.doc);
                  await saveActiveDocument(generated.fileName, generated.bytes, generated.doc);
                } catch (tErr) {
                  console.warn("[pdf] Failed to auto-generate template for target:", cleanTarget, tErr);
                }
              }
            }
          }
        }

        // If NO targetFileName was specified (generic /editor open or fresh reload):
        if (!cleanTarget) {
          if (!upload) {
            const stored = await loadActiveDocument();
            if (stored && stored.bytes && stored.bytes.byteLength > 0) {
              const fName = stored.fileName || "Document.pdf";
              setUploadedPdf(stored.bytes, fName, stored.docState);
              upload = {
                bytes: stored.bytes,
                fileName: fName,
                ...(stored.docState ? { docState: stored.docState } : {}),
              };
              storedDocState = stored.docState;
            }
          }

          if (!upload) {
            const allSaved = await getOfflineCloudDocs();
            if (allSaved.length > 0) {
              const sorted = [...allSaved].sort(
                (a, b) =>
                  new Date(b.updatedAt || b.savedAt).getTime() -
                  new Date(a.updatedAt || a.savedAt).getTime()
              );
              const latest = sorted[0];
              if (latest?.bytes && latest.bytes.byteLength > 0) {
                const fName = latest.name || "Document.pdf";
                setUploadedPdf(latest.bytes, fName, latest.editorState);
                upload = { bytes: latest.bytes, fileName: fName, docState: latest.editorState };
                storedDocState = latest.editorState;
              }
            }
          }
        }

        if (!upload) {
          if (!cancelledRef.current) setStatus("empty");
          return;
        }

        const doc = await loadPdfDocument(upload.bytes);
        const sizes: { width: number; height: number }[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          sizes.push({ width: Math.round(vp.width), height: Math.round(vp.height) });
        }
        if (cancelledRef.current) return;
        setPdf({ doc, fileName: upload.fileName, sizes, storedDocState });
        setStatus("ready");
      } catch (error) {
        console.error("[pdf] failed to open document", error);
        if (!cancelledRef.current) {
          setErrorMessage(describeLoadFailure(error));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTick, targetFileName]);

  return { status, pdf, errorMessage, reload };
}

