import { createFileRoute } from "@tanstack/react-router";
import { ReorderPdfPagesPage } from "@/pages/ReorderPdfPagesPage";
import { createSeoHead } from "@/lib/seo";
import { reorderPagesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/reorder")({
  head: () =>
    createSeoHead({
      title: "Reorder PDF Pages Online Free — Rearrange & Sort Pages | WebToolOcean",
      description:
        "Rearrange and reorder PDF pages online for free. Visual drag-and-drop page sorting, one-click reverse order, zero cloud uploads. 100% private in browser.",
      path: "/reorder-pages",
      keywords: ["reorder pdf pages", "rearrange pdf pages", "sort pdf pages online", "reverse pdf pages"],
      faqItems: reorderPagesFaq,
      applicationName: "WebToolOcean PDF Page Organizer",
    }),
  component: ReorderPdfPagesPage,
});
