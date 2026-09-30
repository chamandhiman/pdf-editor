import { createFileRoute } from "@tanstack/react-router";
import { ReorderPdfPagesPage } from "@/pages/ReorderPdfPagesPage";
import { createSeoHead } from "@/lib/seo";
import { reorderPagesFaq } from "@/lib/faq-data";

export { reorderPagesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/reorder-pages")({
  head: () =>
    createSeoHead({
      title: "Reorder PDF Pages Online Free — Rearrange & Sort Pages | WebToolOcean",
      description:
        "Rearrange and reorder PDF pages online for free. Visual drag-and-drop page sorting, one-click reverse order, zero cloud uploads. 100% private in browser.",
      path: "/reorder-pages",
      keywords: [
        "reorder pdf pages",
        "rearrange pdf pages",
        "sort pdf pages online",
        "change pdf page order",
        "reverse pdf pages",
        "reorder pdf free",
        "organize pdf pages",
        "webtoolocean reorder pdf",
      ],
      faqItems: reorderPagesFaq,
      applicationName: "WebToolOcean PDF Page Organizer",
      applicationCategory: "UtilitiesApplication",
    }),
  component: ReorderPdfPagesPage,
});
