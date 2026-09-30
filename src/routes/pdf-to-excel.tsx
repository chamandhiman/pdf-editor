import { createFileRoute } from "@tanstack/react-router";
import { PdfToExcelPage } from "@/pages/PdfToExcelPage";
import { createSeoHead } from "@/lib/seo";
import { pdfToExcelFaq } from "@/lib/faq-data";

export { pdfToExcelFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/pdf-to-excel")({
  head: () =>
    createSeoHead({
      title: "PDF to Excel Converter — Extract Tables to XLSX & CSV Online Free | WebToolOcean",
      description:
        "Convert PDF to Microsoft Excel XLSX and CSV spreadsheets online for free. Automatically detects tables, columns, and numbers. 100% private in-browser processing.",
      path: "/pdf-to-excel",
      keywords: [
        "pdf to excel",
        "pdf to xlsx",
        "pdf to csv",
        "convert pdf to excel online free",
        "extract tables from pdf",
        "pdf spreadsheet converter",
        "webtoolocean pdf to excel",
      ],
      faqItems: pdfToExcelFaq,
      applicationName: "WebToolOcean PDF to Excel Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: PdfToExcelPage,
});
