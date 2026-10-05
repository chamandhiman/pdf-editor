import { createFileRoute } from "@tanstack/react-router";
import { WatermarkPdfPage } from "@/pages/WatermarkPdfPage";

export const Route = createFileRoute("/stamp-pdf")({
  component: StampPdfRoute,
  head: () => ({
    meta: [
      {
        title: "Stamp PDF Online Free — Stamp Approved, Confidential, Paid | PDF Studio",
      },
      {
        name: "description",
        content:
          "Stamp PDF documents with Approved, Confidential, Paid, Draft, or custom text stamps online for free with 100% in-browser privacy.",
      },
    ],
  }),
});

function StampPdfRoute() {
  return <WatermarkPdfPage />;
}
