import { createFileRoute } from "@tanstack/react-router";
import { PdfToWordPage } from "@/pages/PdfToWordPage";
import { createSeoHead } from "@/lib/seo";
import { pdfToWordFaq } from "@/lib/faq-data";

export { pdfToWordFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/pdf-to-word")({
  head: () =>
    createSeoHead({
      title: "PDF to Word Converter — Convert PDF to DOCX Online Free | WebToolOcean",
      description:
        "Convert PDF to editable Word DOCX documents online for free. Preserves paragraphs, formatting, and tables. 100% private in-browser execution with zero uploads.",
      path: "/pdf-to-word",
      keywords: [
        "pdf to word",
        "pdf to docx",
        "convert pdf to word online free",
        "editable word from pdf",
        "pdf to word converter",
        "webtoolocean pdf to word",
      ],
      faqItems: pdfToWordFaq,
      applicationName: "WebToolOcean PDF to Word Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: PdfToWordPage,
});
