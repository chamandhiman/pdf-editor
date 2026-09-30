import { createFileRoute } from "@tanstack/react-router";
import { ImageToPdfPage } from "@/pages/ImageToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { imageToPdfFaq } from "@/lib/faq-data";

export { imageToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/jpg-to-pdf")({
  head: () =>
    createSeoHead({
      title: "JPG to PDF Converter — Convert Images to PDF Online Free | WebToolOcean",
      description:
        "Convert JPG, PNG, and WebP images to PDF online for free. Adjust margins, page orientation, and reorder images. 100% private in-browser processing with zero uploads.",
      path: "/jpg-to-pdf",
      keywords: [
        "jpg to pdf",
        "image to pdf",
        "convert jpg to pdf",
        "png to pdf",
        "images to pdf online free",
        "convert photos to pdf",
        "webtoolocean jpg to pdf",
      ],
      faqItems: imageToPdfFaq,
      applicationName: "WebToolOcean JPG to PDF Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: ImageToPdfPage,
});
