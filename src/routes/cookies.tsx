import { createFileRoute } from "@tanstack/react-router";
import { CookiesPage } from "@/pages/CookiesPage";
import { createSeoHead } from "@/lib/seo";
import { cookiesFaq } from "@/lib/faq-data";

export { cookiesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/cookies")({
  head: () =>
    createSeoHead({
      title: "Cookie Policy & Advertising Transparency — WebToolOcean PDF Studio",
      description:
        "Understand our cookie practices, local storage usage, and third-party advertising policies including Google AdSense and DoubleClick DART cookies.",
      path: "/cookies",
      keywords: [
        "pdf cookie policy",
        "cookie preferences",
        "google adsense cookies",
        "dart cookie opt out",
        "webtoolocean cookies",
        "gdpr cookie compliance",
      ],
      faqItems: cookiesFaq,
      applicationName: "WebToolOcean PDF Cookie Policy",
    }),
  component: CookiesPage,
});
