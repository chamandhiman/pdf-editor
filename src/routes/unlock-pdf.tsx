import { createFileRoute } from "@tanstack/react-router";
import { UnlockPdfPage } from "@/pages/UnlockPdfPage";
import { createSeoHead } from "@/lib/seo";
import { unlockPdfFaq } from "@/lib/faq-data";

export { unlockPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/unlock-pdf")({
  head: () =>
    createSeoHead({
      title: "Unlock PDF Online Free — Remove PDF Password & Restrictions | WebToolOcean",
      description:
        "Remove PDF passwords and encryption restrictions online for free. Decrypt protected PDF documents, unlock printing & copying, zero cloud uploads. 100% private.",
      path: "/unlock-pdf",
      keywords: [
        "unlock pdf",
        "remove pdf password",
        "decrypt pdf online",
        "remove pdf restrictions",
        "pdf password remover free",
        "unlock encrypted pdf",
        "webtoolocean unlock pdf",
      ],
      faqItems: unlockPdfFaq,
      applicationName: "WebToolOcean PDF Password Remover",
      applicationCategory: "SecurityApplication",
    }),
  component: UnlockPdfPage,
});
