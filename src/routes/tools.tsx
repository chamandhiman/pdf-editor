import { createFileRoute } from "@tanstack/react-router";
import { ToolsPage } from "@/pages/ToolsPage";
import { createSeoHead } from "@/lib/seo";
import { toolsFaq } from "@/lib/faq-data";

export { toolsFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/tools")({
  head: () =>
    createSeoHead({
      title: "All Free Online PDF Tools Directory — WebToolOcean PDF Studio",
      description:
        "Browse all free online PDF tools: edit text, password protect, merge, split, compress, sign, and convert PDF documents in your browser with zero server uploads.",
      path: "/tools",
      keywords: [
        "all pdf tools",
        "free pdf directory",
        "merge pdf online",
        "split pdf online",
        "compress pdf online",
        "convert pdf online",
        "webtoolocean tools",
      ],
      faqItems: toolsFaq,
      applicationName: "WebToolOcean PDF Tools Directory",
      applicationCategory: "UtilitiesApplication",
    }),
  component: ToolsPage,
});
