import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "@/pages/FaqPage";
import { createSeoHead } from "@/lib/seo";

export const globalFaq = [
  {
    q: "Is WebToolOcean PDF Studio secure and private?",
    a: "Yes, 100%. Our platform uses client-side WebAssembly and modern browser APIs so your files are never transmitted to external servers. Your documents remain entirely within your private device memory.",
  },
  {
    q: "How does the in-place PDF text editor work?",
    a: "PDF Studio uses an optical font parser to detect the exact font family, size, line spacing, and color of existing text, allowing you to edit text directly within the original layout without overlay artifacts.",
  },
  {
    q: "What encryption standard is used to protect PDFs?",
    a: "We use standard 256-bit AES encryption conforming to the ISO 32000 PDF security specification, ensuring maximum military-grade confidentiality compatible with all global PDF readers.",
  },
  {
    q: "Can I use WebToolOcean PDF Studio on iPhone, iPad, and Android?",
    a: "Yes. The entire user interface is responsive, touch-optimized, and works seamlessly on all mobile phones, tablets, and desktop computers.",
  },
  {
    q: "Are there any file size or conversion limits?",
    a: "You can process PDF files up to 100 MB directly in your browser with unlimited daily usage.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () =>
    createSeoHead({
      title: "Frequently Asked Questions (FAQ) — WebToolOcean PDF Studio",
      description:
        "Find clear answers about PDF Studio: in-browser security, client-side encryption, editing capabilities, compatibility, and file privacy.",
      path: "/faq",
      keywords: ["pdf studio faq", "pdf editor questions", "browser pdf privacy", "webtoolocean faq"],
      faqItems: globalFaq,
      applicationName: "WebToolOcean PDF Help Center",
    }),
  component: FaqPage,
});
