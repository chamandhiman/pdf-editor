import { createFileRoute } from "@tanstack/react-router";
import { PdfToPptPage } from "@/pages/PdfToPptPage";
import { createSeoHead } from "@/lib/seo";
import { pdfToPptFaq } from "@/lib/faq-data";

export { pdfToPptFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/pdf-to-ppt")({
  head: () =>
    createSeoHead({
      title: "PDF to PowerPoint Converter — Convert PDF to PPTX Online Free | WebToolOcean",
      description:
        "Convert PDF to editable PowerPoint PPTX presentations online for free. Full visual fidelity — images, text, design all included. 100% private in-browser processing, zero uploads.",
      path: "/pdf-to-ppt",
      keywords: [
        "pdf to powerpoint",
        "pdf to pptx",
        "convert pdf to ppt online free",
        "pdf to presentation",
        "pdf to slides",
        "webtoolocean pdf to powerpoint",
      ],
      faqItems: pdfToPptFaq,
      applicationName: "WebToolOcean PDF to PowerPoint Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: PdfToPptPage,
});
