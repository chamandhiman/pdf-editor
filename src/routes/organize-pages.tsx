import { createFileRoute } from "@tanstack/react-router";
import { ReorderPdfPagesPage } from "@/pages/ReorderPdfPagesPage";
import { createSeoHead } from "@/lib/seo";
import { reorderPagesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/organize-pages")({
  head: () =>
    createSeoHead({
      title: "Organize PDF Pages Online Free — Reorder & Sort Pages | WebToolOcean",
      description:
        "Organize, sort, and reorder PDF pages online for free. Visual page organizer with drag-and-drop, zero cloud uploads. 100% private in browser.",
      path: "/reorder-pages",
      keywords: ["organize pdf pages", "reorder pdf pages", "sort pdf pages online"],
      faqItems: reorderPagesFaq,
      applicationName: "WebToolOcean PDF Page Organizer",
    }),
  component: ReorderPdfPagesPage,
});
