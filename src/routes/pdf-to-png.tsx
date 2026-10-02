import { createFileRoute } from "@tanstack/react-router";
import { PdfToImagePage } from "@/pages/PdfToImagePage";
import { createSeoHead } from "@/lib/seo";
import { pdfToPngFaq } from "@/lib/faq-data";

export { pdfToPngFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/pdf-to-png")({
  head: () =>
    createSeoHead({
      title: "PDF to PNG Converter — Export PDF Pages as Lossless PNG Images | WebToolOcean",
      description:
        "Convert every PDF page to a crisp, lossless PNG image online for free. Full transparency support, 2.5x DPI rendering, download all as ZIP. 100% private — no uploads.",
      path: "/pdf-to-png",
      keywords: [
        "pdf to png",
        "convert pdf to png online free",
        "pdf page to png image",
        "lossless pdf image export",
        "pdf to png converter",
        "webtoolocean pdf to png",
      ],
      faqItems: pdfToPngFaq,
      applicationName: "WebToolOcean PDF to PNG Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: () => <PdfToImagePage format="png" />,
});
