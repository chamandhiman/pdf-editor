import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "@/pages/EditorPage";

const title = "Editor — PDF Studio";
const description =
  "A full PDF editing workspace: pages, annotation tools, text editing and document properties.";

export const Route = createFileRoute("/editor")({
  validateSearch: (search: Record<string, unknown>) => ({
    file: typeof search["file"] === "string" ? (search["file"] as string) : "Sample-Document.pdf",
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditorRoute,
});

function EditorRoute() {
  const { file } = Route.useSearch();
  return <EditorPage fileName={file || "Sample-Document.pdf"} />;
}
