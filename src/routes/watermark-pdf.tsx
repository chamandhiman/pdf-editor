import { createFileRoute } from "@tanstack/react-router";
import { WatermarkPdfPage } from "@/pages/WatermarkPdfPage";

export const Route = createFileRoute("/watermark-pdf")({
  component: WatermarkPdfRoute,
  head: () => ({
    meta: [
      {
        title: "Watermark PDF Online Free — Stamp Confidential or Custom Text | PDF Studio",
      },
      {
        name: "description",
        content:
          "Add text or stamp watermarks (Confidential, Draft, Approved) to PDF documents online. 100% private, client-side in-browser processing with adjustable opacity and angle.",
      },
    ],
  }),
});

function WatermarkPdfRoute() {
  return <WatermarkPdfPage />;
}
