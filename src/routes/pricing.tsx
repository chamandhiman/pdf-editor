import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/pages/PricingPage";
import { createSeoHead } from "@/lib/seo";
import { pricingFaq } from "@/lib/faq-data";

export { pricingFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/pricing")({
  head: () =>
    createSeoHead({
      title: "Simple & Transparent Pricing Plans — WebToolOcean PDF Studio",
      description:
        "Transparent pricing for PDF Studio. Free forever community tier with full editing & 256-bit AES protection, plus scalable premium plans for teams.",
      path: "/pricing",
      keywords: ["pdf editor pricing", "free pdf tools", "pdf studio plans", "webtoolocean pricing"],
      faqItems: pricingFaq,
      applicationName: "WebToolOcean PDF Studio Pricing",
    }),
  component: PricingPage,
});
