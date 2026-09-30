import { createFileRoute } from "@tanstack/react-router";
import { RemovePdfPagesPage } from "@/pages/RemovePdfPagesPage";
import { createSeoHead } from "@/lib/seo";
import { removePagesFaq } from "@/lib/faq-data";

export { removePagesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/remove-pages")({
  head: () =>
    createSeoHead({
      title: "Remove Pages from PDF Online Free — Delete PDF Pages | WebToolOcean",
      description:
        "Delete unwanted or blank pages from your PDF online for free. Visual page selector, interactive page numbers, instant download, zero cloud uploads. 100% private.",
      path: "/remove-pages",
      keywords: [
        "remove pages from pdf",
        "delete pdf pages",
        "delete pages from pdf online",
        "remove pdf pages free",
        "delete blank pages pdf",
        "pdf page remover",
        "webtoolocean remove pages",
      ],
      faqItems: removePagesFaq,
      applicationName: "WebToolOcean PDF Page Remover",
    }),
  component: RemovePdfPagesPage,
});
