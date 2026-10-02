import { createFileRoute } from "@tanstack/react-router";
import { PptToPdfPage } from "@/pages/PptToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { pptToPdfFaq } from "@/lib/faq-data";

export { pptToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/ppt-to-pdf")({
  head: () =>
    createSeoHead({
      title: "PowerPoint to PDF Converter — Convert PPTX to PDF Free Online",
      description:
        "Convert Microsoft PowerPoint presentations and PPTX slide decks into clean, 16:9 widescreen PDF documents. 100% private in-browser conversion.",
      path: "/ppt-to-pdf",
      keywords: [
        "powerpoint to pdf",
        "pptx to pdf",
        "convert slides to pdf",
        "online ppt to pdf converter",
        "private presentation converter",
      ],
      faqItems: pptToPdfFaq,
      applicationName: "WebToolOcean PowerPoint to PDF Converter",
    }),
  component: PptToPdfPage,
});
