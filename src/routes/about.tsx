import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/AboutPage";
import { createSeoHead } from "@/lib/seo";
import { aboutFaq } from "@/lib/faq-data";

export { aboutFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/about")({
  head: () =>
    createSeoHead({
      title: "About Us & Mission — WebToolOcean PDF Studio",
      description:
        "Learn about WebToolOcean PDF Studio, our privacy-first client-side architecture, accessibility commitment, and suite of web productivity tools.",
      path: "/about",
      keywords: [
        "about pdf studio",
        "webtoolocean about us",
        "in-browser pdf technology",
        "private pdf editor",
        "free online pdf company",
      ],
      faqItems: aboutFaq,
      applicationName: "About WebToolOcean PDF Studio",
    }),
  component: AboutPage,
});
