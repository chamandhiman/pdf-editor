import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadPdfDocument, type PdfDocumentProxy } from "@/lib/pdf-loader";
import { getUploadedPdf, setUploadedPdf } from "@/lib/pdf-store";
import { loadActiveDocument, getOfflineCloudDocs } from "@/lib/pdf-storage";
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
        let upload = getUploadedPdf();
        let storedDocState: PDFDocument | undefined = upload?.docState;

        // If targetFileName is requested and either in-memory is missing or has a different file
        if (
          targetFileName &&
          (!upload || upload.fileName.toLowerCase() !== targetFileName.toLowerCase())
        ) {
          // Check active document first
          const active = await loadActiveDocument();
          if (
            active &&
            active.bytes &&
            active.bytes.byteLength > 0 &&
            active.fileName.toLowerCase() === targetFileName.toLowerCase()
          ) {
            setUploadedPdf(active.bytes, active.fileName, active.docState);
            upload = { bytes: active.bytes, fileName: active.fileName, docState: active.docState };
            storedDocState = active.docState;
          } else {
            // Check offline saved docs
            const allSaved = await getOfflineCloudDocs();
            const match = allSaved.find(
              (d) =>
                d.name.toLowerCase() === targetFileName.toLowerCase() ||
                d.id === targetFileName ||
                d.id === `recent_${targetFileName.toLowerCase().replace(/[^a-z0-9_.-]/g, "_")}`
            );
            if (match && match.bytes && match.bytes.byteLength > 0) {
              setUploadedPdf(match.bytes, match.name, match.editorState);
              upload = { bytes: match.bytes, fileName: match.name, docState: match.editorState };
              storedDocState = match.editorState;
            }
          }
        }

        // If in-memory upload is null (e.g. after fresh browser reload), restore from active IndexedDB
        if (!upload) {
          const stored = await loadActiveDocument();
          if (stored && stored.bytes && stored.bytes.byteLength > 0) {
            setUploadedPdf(stored.bytes, stored.fileName, stored.docState);
            upload = { bytes: stored.bytes, fileName: stored.fileName, docState: stored.docState };
            storedDocState = stored.docState;
          }
        }

        // As a secondary fallback on browser reload, restore the most recent saved document
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
              setUploadedPdf(latest.bytes, latest.name, latest.editorState);
              upload = { bytes: latest.bytes, fileName: latest.name, docState: latest.editorState };
              storedDocState = latest.editorState;
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

