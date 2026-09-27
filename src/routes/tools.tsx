import { createFileRoute } from "@tanstack/react-router";
import { ToolsPage } from "@/pages/ToolsPage";

const title = "All PDF Tools — PDF Studio";
const description =
  "Explore all PDF tools: edit text, convert, organize pages, sign, watermark, and secure documents.";

export const Route = createFileRoute("/tools")({
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
  component: ToolsPage,
});
