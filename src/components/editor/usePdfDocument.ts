import { createContext, useContext, useEffect, useState } from "react";
import { loadPdfDocument, type PdfDocumentProxy } from "@/lib/pdf-loader";
import { getUploadedPdf } from "@/lib/pdf-store";

export interface LoadedPdf {
  doc: PdfDocumentProxy;
  fileName: string;
  sizes: { width: number; height: number }[];
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

export function usePdfUpload() {
  const [status, setStatus] = useState<Status>("loading");
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const upload = getUploadedPdf();
    if (!upload) {
      setStatus("empty");
      return;
    }
    setStatus("loading");
    (async () => {
      try {
        const doc = await loadPdfDocument(upload.bytes);
        const sizes: { width: number; height: number }[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          sizes.push({ width: Math.round(vp.width), height: Math.round(vp.height) });
        }
        if (cancelled) return;
        setPdf({ doc, fileName: upload.fileName, sizes });
        setStatus("ready");
      } catch (error) {
        console.error("[pdf] failed to open document", error);
        if (!cancelled) {
          setErrorMessage(describeLoadFailure(error));
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, pdf, errorMessage };
}
