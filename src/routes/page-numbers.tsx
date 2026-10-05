import { createFileRoute } from "@tanstack/react-router";
import { PageNumbersPdfPage } from "@/pages/PageNumbersPdfPage";

export const Route = createFileRoute("/page-numbers")({
  component: PageNumbersPdfRoute,
  head: () => ({
    meta: [
      {
        title: "Add Page Numbers to PDF Online Free — Number PDF Pages | PDF Studio",
      },
      {
        name: "description",
        content:
          "Insert page numbers into PDF documents online for free. Customize numbering format, position (header/footer), and font size with 100% client-side privacy.",
      },
    ],
  }),
});

function PageNumbersPdfRoute() {
  return <PageNumbersPdfPage />;
}
