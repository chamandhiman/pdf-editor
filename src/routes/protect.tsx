import { createFileRoute } from "@tanstack/react-router";
import { ProtectPdfPage } from "@/pages/ProtectPdfPage";
import { createSeoHead } from "@/lib/seo";
import { protectFaq } from "@/lib/faq-data";

export { protectFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/protect")({
  head: () =>
    createSeoHead({
      title: "Protect PDF with Password Online — 256-Bit AES Encryption",
      description:
        "Encrypt and password protect PDF documents online for free. Military-grade 256-bit AES encryption, customizable permissions, zero cloud uploads. 100% private in browser.",
      path: "/protect",
      keywords: [
        "protect pdf",
        "password protect pdf",
        "encrypt pdf online",
        "pdf password lock",
        "secure pdf free",
        "aes 256 pdf encryption",
        "webtoolocean",
      ],
      faqItems: protectFaq,
      applicationName: "WebToolOcean PDF Protect",
      applicationCategory: "SecurityApplication",
    }),
  component: ProtectPdfPage,
});
