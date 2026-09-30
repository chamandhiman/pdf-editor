import { createFileRoute } from "@tanstack/react-router";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { createSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/templates")({
  head: () =>
    createSeoHead({
      title: "Free Editable PDF Templates — Resumes, Invoices, Contracts | PDF Studio",
      description:
        "Browse and customize free professional PDF templates online. Invoices, resumes, agreements, meeting notes, receipts, and checklists ready to edit in your browser.",
      path: "/templates",
      keywords: [
        "pdf templates",
        "free invoice template pdf",
        "resume template pdf",
        "contract template pdf",
        "editable pdf templates",
        "meeting notes template",
      ],
      applicationName: "PDF Studio Templates",
    }),
  component: TemplatesPage,
});
