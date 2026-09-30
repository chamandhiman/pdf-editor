import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/pages/TermsPage";
import { createSeoHead } from "@/lib/seo";
import { termsFaq } from "@/lib/faq-data";

export { termsFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/terms")({
  head: () =>
    createSeoHead({
      title: "Terms of Service & Usage Rights — WebToolOcean PDF Studio",
      description:
        "Terms and conditions for utilizing WebToolOcean PDF Studio tools, document editing features, and cloud services.",
      path: "/terms",
      keywords: ["terms of service", "pdf studio terms", "webtoolocean conditions", "commercial pdf rights"],
      faqItems: termsFaq,
      applicationName: "WebToolOcean PDF Studio Terms",
    }),
  component: TermsPage,
});

