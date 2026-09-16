import { createFileRoute } from "@tanstack/react-router";
import { UploadPage } from "@/pages/UploadPage";

const title = "PDF Studio — Edit PDFs. Simply.";
const description =
  "Edit, annotate, sign and manage your PDF documents from one fast, private workspace.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: UploadPage,
});
