import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { createSeoHead } from "@/lib/seo";
import { privacyFaq } from "@/lib/faq-data";

export { privacyFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/privacy")({
  head: () =>
    createSeoHead({
      title: "Privacy Architecture & Data Protection — WebToolOcean PDF Studio",
      description:
        "Learn about our client-side architecture. Files processed locally in your browser memory, zero server storage, zero third-party tracking.",
      path: "/privacy",
      keywords: ["pdf privacy", "zero upload pdf", "client side privacy", "webtoolocean security", "gdpr pdf tools"],
      faqItems: privacyFaq,
      applicationName: "WebToolOcean PDF Privacy Standards",
    }),
  component: PrivacyPage,
});

