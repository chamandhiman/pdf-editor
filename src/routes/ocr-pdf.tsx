import { createFileRoute } from "@tanstack/react-router";
import { OcrPdfPage } from "@/pages/OcrPdfPage";
import { createSeoHead } from "@/lib/seo";
import { ocrPdfFaq } from "@/lib/faq-data";

export { ocrPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/ocr-pdf")({
  head: () =>
    createSeoHead({
      title: "OCR PDF Online Free — Convert Scanned PDF to Searchable Text | WebToolOcean",
      description:
        "Free online OCR PDF tool. Convert scanned PDFs and document images into searchable, selectable text. Generate searchable PDFs or extract text instantly. 100% private.",
      path: "/ocr-pdf",
      keywords: [
        "ocr pdf",
        "ocr pdf online free",
        "convert scanned pdf to text",
        "make pdf searchable",
        "searchable pdf creator",
        "extract text from scanned pdf",
        "pdf ocr converter free",
        "webtoolocean ocr pdf",
      ],
      faqItems: ocrPdfFaq,
      applicationName: "WebToolOcean PDF OCR Scanner",
      applicationCategory: "BusinessApplication",
    }),
  component: OcrPdfPage,
});
