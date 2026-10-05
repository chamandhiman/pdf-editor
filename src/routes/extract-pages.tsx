import { createFileRoute } from "@tanstack/react-router";
import { ExtractPdfPagesPage } from "@/pages/ExtractPdfPagesPage";

export const Route = createFileRoute("/extract-pages")({
  component: ExtractPdfPagesRoute,
  head: () => ({
    meta: [
      {
        title: "Extract PDF Pages Online Free — Save Selected Pages | PDF Studio",
      },
      {
        name: "description",
        content:
          "Extract specific pages or page ranges from a PDF document online for free. Select pages visually with thumbnails, 100% private in-browser processing.",
      },
    ],
  }),
});

function ExtractPdfPagesRoute() {
  return <ExtractPdfPagesPage />;
}
