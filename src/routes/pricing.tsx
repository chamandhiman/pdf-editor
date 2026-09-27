import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/pages/PricingPage";

const title = "Pricing Plans — PDF Studio";
const description =
  "Simple, transparent pricing for PDF Studio. Free community plan and upcoming premium productivity tiers.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});
