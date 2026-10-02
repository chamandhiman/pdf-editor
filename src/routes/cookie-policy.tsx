import { createFileRoute } from "@tanstack/react-router";
import { CookiesPage } from "@/pages/CookiesPage";
import { createSeoHead } from "@/lib/seo";
import { cookiesFaq } from "@/lib/faq-data";

export { cookiesFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/cookie-policy")({
  head: () =>
    createSeoHead({
      title: "Cookie Policy — WebToolOcean PDF Studio",
      description:
        "Understand our cookie practices, local storage usage, and third-party advertising policies including Google AdSense.",
      path: "/cookie-policy",
      keywords: ["pdf cookie policy", "google adsense cookies", "cookie consent"],
      faqItems: cookiesFaq,
      applicationName: "WebToolOcean PDF Cookie Policy",
    }),
  component: CookiesPage,
});
