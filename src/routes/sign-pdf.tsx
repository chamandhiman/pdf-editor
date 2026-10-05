import { createFileRoute } from "@tanstack/react-router";
import { EditPdfPage } from "@/pages/EditPdfPage";

export const Route = createFileRoute("/sign-pdf")({
  component: SignPdfRoute,
  head: () => ({
    meta: [
      {
        title: "Sign PDF Online Free — Draw, Type, or Upload Electronic Signature | PDF Studio",
      },
      {
        name: "description",
        content:
          "Sign PDF documents online for free. Draw, type, or upload your electronic signature directly in your browser. 100% private and legally binding.",
      },
    ],
  }),
});

function SignPdfRoute() {
  return <EditPdfPage />;
}
