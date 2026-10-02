import { createFileRoute } from "@tanstack/react-router";
import { DisclaimerPage } from "@/pages/DisclaimerPage";
import { createSeoHead } from "@/lib/seo";
import { disclaimerFaq } from "@/lib/faq-data";

export { disclaimerFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/disclaimer")({
  head: () =>
    createSeoHead({
      title: "Legal Disclaimer & Service Disclosures — WebToolOcean PDF Studio",
      description:
        "Important notices regarding technical document conversion, OCR accuracy, electronic signatures, and third-party advertising on PDF Studio.",
      path: "/disclaimer",
      keywords: [
        "pdf disclaimer",
        "document conversion disclaimer",
        "electronic signature legal notice",
        "webtoolocean disclaimer",
        "google adsense disclaimer",
      ],
      faqItems: disclaimerFaq,
      applicationName: "WebToolOcean PDF Studio Disclaimer",
    }),
  component: DisclaimerPage,
});
