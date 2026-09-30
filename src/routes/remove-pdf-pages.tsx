import { createFileRoute } from "@tanstack/react-router";
import { RemovePdfPagesPage } from "@/pages/RemovePdfPagesPage";
import { createSeoHead } from "@/lib/seo";
import { removePagesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/remove-pdf-pages")({
  head: () =>
    createSeoHead({
      title: "Remove Pages from PDF Online Free — WebToolOcean PDF Studio",
      description:
        "Delete unwanted or blank pages from your PDF online for free. Visual page selector, interactive page numbers, instant download, zero cloud uploads. 100% private.",
      path: "/remove-pages",
      keywords: ["remove pdf pages", "delete pdf pages", "remove pages from pdf"],
      faqItems: removePagesFaq,
      applicationName: "WebToolOcean PDF Page Remover",
    }),
  component: RemovePdfPagesPage,
});
