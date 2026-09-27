import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "@/pages/FaqPage";

const title = "FAQ — PDF Studio";
const description =
  "Frequently asked questions about PDF Studio features, editing capabilities, conversions, and document privacy.";

export const Route = createFileRoute("/faq")({
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
  component: FaqPage,
});
