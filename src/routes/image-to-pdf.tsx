import { createFileRoute } from "@tanstack/react-router";
import { ImageToPdfPage } from "@/pages/ImageToPdfPage";
import { createSeoHead } from "@/lib/seo";
import { imageToPdfFaq } from "@/lib/faq-data";

export { imageToPdfFaq } from "@/lib/faq-data";

export const Route = createFileRoute("/image-to-pdf")({
  head: () =>
    createSeoHead({
      title: "Image to PDF Converter — Convert Photos to PDF Online Free | WebToolOcean",
      description:
        "Convert JPG, PNG, and WebP images to PDF online for free. Adjust margins, page orientation, and reorder images. 100% private in-browser processing with zero uploads.",
      path: "/image-to-pdf",
      keywords: [
        "image to pdf",
        "jpg to pdf",
        "convert image to pdf",
        "png to pdf",
        "photos to pdf online free",
      ],
      faqItems: imageToPdfFaq,
      applicationName: "WebToolOcean Image to PDF Converter",
      applicationCategory: "UtilitiesApplication",
    }),
  component: ImageToPdfPage,
});
