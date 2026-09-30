import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages/ContactPage";
import { createSeoHead } from "@/lib/seo";
import { contactFaq } from "@/lib/faq-data";

export { contactFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/contact")({
  head: () =>
    createSeoHead({
      title: "Contact Support & Inquiries — WebToolOcean PDF Studio",
      description:
        "Get in touch with the WebToolOcean PDF Studio team for questions, feature requests, partnership inquiries, or technical support.",
      path: "/contact",
      keywords: ["contact pdf studio", "pdf support", "webtoolocean help", "enterprise pdf inquiries"],
      faqItems: contactFaq,
      applicationName: "WebToolOcean PDF Help & Support",
    }),
  component: ContactPage,
});

