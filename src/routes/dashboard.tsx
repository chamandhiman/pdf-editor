import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/DashboardPage";

const title = "My Dashboard — WebToolOcean PDF Studio";
const description = "Manage your PDF documents, recent files, and productivity settings.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://pdf.webtoolocean.com/dashboard" },
    ],
    links: [
      { rel: "canonical", href: "https://pdf.webtoolocean.com/dashboard" },
    ],
  }),
  component: DashboardPage,
});
