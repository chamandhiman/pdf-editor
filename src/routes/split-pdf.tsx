import { createFileRoute } from "@tanstack/react-router";
import { SplitPdfPage } from "@/pages/SplitPdfPage";
import { createSeoHead } from "@/lib/seo";
import { splitFaq } from "@/lib/faq-data";

export { splitFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/split-pdf")({
  head: () =>
    createSeoHead({
      title: "Split PDF Online Free — Separate PDF Pages into Multiple Files | WebToolOcean",
      description:
        "Split PDF files online for free. Extract custom page ranges or separate every page into individual documents. Download files individually or as a ZIP. 100% private.",
      path: "/split-pdf",
      keywords: [
        "split pdf",
        "extract pdf pages",
        "separate pdf online",
        "free pdf splitter",
        "split pdf into pages",
        "split pdf free",
        "webtoolocean split pdf",
      ],
      faqItems: splitFaq,
      applicationName: "WebToolOcean PDF Splitter",
    }),
  component: SplitPdfPage,
});
