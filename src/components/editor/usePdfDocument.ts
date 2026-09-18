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

export function usePdfUpload() {
  const [status, setStatus] = useState<Status>("loading");
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);

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
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, pdf };
}
