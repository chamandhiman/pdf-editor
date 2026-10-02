import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "@/pages/SecurityPage";
import { createSeoHead } from "@/lib/seo";
import { securityFaq } from "@/lib/faq-data";

export { securityFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/security")({
  head: () =>
    createSeoHead({
      title: "Security Architecture & Cryptography — WebToolOcean PDF Studio",
      description:
        "Technical breakdown of our zero-knowledge security architecture, 256-bit AES encryption standard, TLS 1.3 transport, and responsible vulnerability disclosure.",
      path: "/security",
      keywords: [
        "pdf security",
        "zero knowledge pdf",
        "256 bit aes encryption",
        "browser sandboxing",
        "webtoolocean security architecture",
      ],
      faqItems: securityFaq,
      applicationName: "WebToolOcean PDF Studio Security",
    }),
  component: SecurityPage,
});
