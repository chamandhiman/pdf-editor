import { createFileRoute } from "@tanstack/react-router";
import { EditPdfPage } from "@/pages/EditPdfPage";
import { createSeoHead } from "@/lib/seo";
import { editPdfFaq } from "@/lib/faq-data";

export { editPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/edit-pdf")({
  head: () =>
    createSeoHead({
      title: "Edit PDF Online Free — In-Browser PDF Text Editor & Signer | WebToolOcean",
      description:
        "Edit PDF text, add headings, sign documents, insert images, shapes, annotations, and organize pages online for free. 100% private in-browser editing with zero uploads.",
      path: "/edit-pdf",
      keywords: [
        "edit pdf",
        "edit pdf online free",
        "edit pdf text",
        "sign pdf online",
        "pdf editor browser",
        "annotate pdf",
        "rotate pdf pages",
        "webtoolocean edit pdf",
      ],
      faqItems: editPdfFaq,
      applicationName: "WebToolOcean PDF Editor",
      applicationCategory: "UtilitiesApplication",
    }),
  component: EditPdfPage,
});
