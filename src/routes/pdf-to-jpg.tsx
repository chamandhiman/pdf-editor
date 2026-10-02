import { createFileRoute } from "@tanstack/react-router";
import { PdfToImagePage } from "@/pages/PdfToImagePage";
import { createSeoHead } from "@/lib/seo";
import { pdfToJpgFaq } from "@/lib/faq-data";

export { pdfToJpgFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/pdf-to-jpg")({
  head: () =>
    createSeoHead({
      title: "PDF to JPG Converter — Convert PDF Pages to JPG Images Free | WebToolOcean",
      description:
        "Convert every PDF page to high-resolution JPG images online for free. Adjustable quality, 2.5x DPI rendering, download all as ZIP. 100% private — no uploads.",
      path: "/pdf-to-jpg",
      keywords: [
        "pdf to jpg",
        "pdf to jpeg",
        "convert pdf to jpg online free",
        "pdf page to image",
        "pdf to jpg converter",
        "webtoolocean pdf to jpg",
      ],
      faqItems: pdfToJpgFaq,
      applicationName: "WebToolOcean PDF to JPG Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: () => <PdfToImagePage format="jpeg" />,
});
