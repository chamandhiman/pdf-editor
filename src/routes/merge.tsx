import { createFileRoute } from "@tanstack/react-router";
import { MergePdfPage } from "@/pages/MergePdfPage";
import { createSeoHead } from "@/lib/seo";
import { mergeFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/merge")({
  head: () =>
    createSeoHead({
      title: "Merge PDF Online Free — Combine Multiple PDF Files | WebToolOcean",
      description:
        "Combine multiple PDF files into one single document online for free. Rearrange page order, fast client-side merging, zero cloud uploads, 100% private.",
      path: "/merge-pdf",
      keywords: ["merge pdf", "combine pdf", "merge pdf files online", "free pdf merger"],
      faqItems: mergeFaq,
      applicationName: "WebToolOcean PDF Merger",
    }),
  component: MergePdfPage,
});
