import { createFileRoute } from "@tanstack/react-router";
import { ExcelToPdfPage } from "@/pages/ExcelToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { excelToPdfFaq } from "@/lib/faq-data";

export { excelToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/excel-to-pdf")({
  head: () =>
    createSeoHead({
      title: "Excel to PDF Converter — Convert XLSX to PDF Free Online",
      description:
        "Convert Microsoft Excel spreadsheets and XLSX workbooks into clean, landscape-oriented PDF reports. 100% private, client-side, zero server storage.",
      path: "/excel-to-pdf",
      keywords: [
        "excel to pdf",
        "xlsx to pdf",
        "convert spreadsheet to pdf",
        "online excel to pdf converter",
        "private excel converter",
      ],
      faqItems: excelToPdfFaq,
      applicationName: "WebToolOcean Excel to PDF Converter",
    }),
  component: ExcelToPdfPage,
});
