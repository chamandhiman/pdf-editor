import { createFileRoute } from "@tanstack/react-router";
import { RotatePdfPage } from "@/pages/RotatePdfPage";

export const Route = createFileRoute("/rotate-pdf")({
  component: RotatePdfRoute,
  head: () => ({
    meta: [
      {
        title: "Rotate PDF Pages Online Free — 100% Private | PDF Studio",
      },
      {
        name: "description",
        content:
          "Rotate PDF pages 90, 180, or 270 degrees online for free. Rotate single pages or all pages at once without losing quality or uploading files to servers.",
      },
    ],
  }),
});

function RotatePdfRoute() {
  return <RotatePdfPage />;
}
