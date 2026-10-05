import { createFileRoute } from "@tanstack/react-router";
import { ExtractPdfPagesPage } from "@/pages/ExtractPdfPagesPage";

export const Route = createFileRoute("/extract-pdf")({
  component: ExtractPdfRoute,
  head: () => ({
    meta: [
      {
        title: "Extract PDF Pages Online Free — Save Selected Pages | PDF Studio",
      },
    ],
  }),
});

function ExtractPdfRoute() {
  return <ExtractPdfPagesPage />;
}
