import { createFileRoute } from "@tanstack/react-router";
import { PngToPdfPage } from "@/pages/PngToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { pngToPdfFaq } from "@/lib/faq-data";

export { pngToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/png-to-pdf")({
  head: () =>
    createSeoHead({
      title: "PNG to PDF Converter — Convert PNG to PDF Free Online",
      description:
        "Convert PNG images and screenshots into standardized PDF documents with lossless clarity and custom margins. 100% private in-browser conversion.",
      path: "/png-to-pdf",
      keywords: [
        "png to pdf",
        "convert png to pdf",
        "lossless image to pdf",
        "online png to pdf converter",
        "screenshot to pdf",
      ],
      faqItems: pngToPdfFaq,
      applicationName: "WebToolOcean PNG to PDF Converter",
    }),
  component: PngToPdfPage,
});
