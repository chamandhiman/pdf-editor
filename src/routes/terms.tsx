import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/pages/TermsPage";

const title = "Terms of Use — PDF Studio";
const description =
  "Terms and conditions for utilizing PDF Studio online editing and document processing services.";

export const Route = createFileRoute("/terms")({
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
  component: TermsPage,
});
