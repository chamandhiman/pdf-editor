import { createFileRoute } from "@tanstack/react-router";
import { CompressPdfPage } from "@/pages/CompressPdfPage";
import { createSeoHead } from "@/lib/seo";
import { compressPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/compress")({
  head: () =>
    createSeoHead({
      title: "Compress PDF Online Free — Reduce PDF File Size | WebToolOcean",
      description:
        "Compress PDF files online for free. Reduce PDF file size by up to 75% without losing visual quality. 3 compression presets, 100% private in-browser execution.",
      path: "/compress-pdf",
      keywords: ["compress pdf", "reduce pdf size", "shrink pdf", "pdf compressor free"],
      faqItems: compressPdfFaq,
      applicationName: "WebToolOcean PDF Compressor",
    }),
  component: CompressPdfPage,
});
