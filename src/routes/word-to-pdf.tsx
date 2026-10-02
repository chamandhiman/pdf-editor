import { createFileRoute } from "@tanstack/react-router";
import { WordToPdfPage } from "@/pages/WordToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { wordToPdfFaq } from "@/lib/faq-data";

export { wordToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/word-to-pdf")({
  head: () =>
    createSeoHead({
      title: "Word to PDF Converter — Convert DOCX to PDF Free Online",
      description:
        "Convert Microsoft Word DOC and DOCX documents to standardized PDF files online in your browser. 100% private, client-side, with zero server uploads.",
      path: "/word-to-pdf",
      keywords: [
        "word to pdf",
        "docx to pdf",
        "convert word to pdf free",
        "online word to pdf converter",
        "private word converter",
      ],
      faqItems: wordToPdfFaq,
      applicationName: "WebToolOcean Word to PDF Converter",
    }),
  component: WordToPdfPage,
});
