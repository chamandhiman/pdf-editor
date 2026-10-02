import { createFileRoute } from "@tanstack/react-router";
import { PptToPdfPage } from "@/pages/PptToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { pptToPdfFaq } from "@/lib/faq-data";

export { pptToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/powerpoint-to-pdf")({
  head: () =>
    createSeoHead({
      title: "PowerPoint to PDF Converter — Convert PPTX to PDF",
      description:
        "Convert Microsoft PowerPoint presentations and PPTX slide decks into clean PDF documents.",
      path: "/powerpoint-to-pdf",
      keywords: ["powerpoint to pdf", "pptx to pdf", "convert slides to pdf"],
      faqItems: pptToPdfFaq,
      applicationName: "WebToolOcean PowerPoint to PDF Converter",
    }),
  component: PptToPdfPage,
});
