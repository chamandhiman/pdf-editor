import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";
import { createSeoHead } from "@/lib/seo";
import { homeFaq } from "@/lib/faq-data";

export { homeFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/")({
  head: () =>
    createSeoHead({
      title: "WebToolOcean PDF Studio — Edit, Protect & Convert PDFs Online",
      description:
        "Free, private, and fast in-browser PDF suite. Edit original text, password protect with 256-bit AES, organize pages, sign, and convert documents with zero server uploads.",
      path: "/",
      keywords: [
        "free online pdf editor",
        "edit pdf text in place",
        "password protect pdf",
        "client side pdf tools",
        "sign pdf online",
        "merge pdf browser",
        "webtoolocean",
      ],
      faqItems: homeFaq,
      applicationName: "WebToolOcean PDF Studio",
      applicationCategory: "BusinessApplication",
    }),
  component: HomePage,
});
