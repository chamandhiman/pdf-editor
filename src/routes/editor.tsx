import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "@/pages/EditorPage";

const title = "PDF Editor Workspace — WebToolOcean PDF Studio";
const description =
  "In-browser PDF editing workspace: modify original text, draw, sign, add vector shapes and export.";

export const Route = createFileRoute("/editor")({
  validateSearch: (search: Record<string, unknown>) => ({
    file: typeof search["file"] === "string" ? (search["file"] as string) : "Sample-Document.pdf",
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://pdf.webtoolocean.com/editor" },
    ],
  }),
  component: EditorRoute,
});

function EditorRoute() {
  const { file } = Route.useSearch();
  return <EditorPage fileName={file || "Sample-Document.pdf"} />;
}
