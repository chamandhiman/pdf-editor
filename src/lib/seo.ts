export const SITE_URL = "https://pdf.webtoolocean.com";
export const SITE_NAME = "WebToolOcean PDF Studio";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface FaqItem {
  q: string;
  a: string;
}

export interface SeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogType?: "website" | "article";
  faqItems?: FaqItem[];
  applicationName?: string;
  applicationCategory?: string;
}

export function createSeoHead({
  title,
  description,
  path,
  keywords = [],
  ogType = "website",
  faqItems,
  applicationName = "PDF Studio",
  applicationCategory = "UtilitiesApplication",
}: SeoOptions) {
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = title.includes("WebToolOcean") || title.includes("PDF Studio")
    ? title
    : `${title} | WebToolOcean PDF Studio`;

  const metaList = [
    { title: fullTitle },
    { name: "description", content: description },
    {
      name: "keywords",
      content: [
        "pdf editor",
        "free pdf tools",
        "edit pdf online",
        "protect pdf",
        "password protect pdf",
        "compress pdf",
        "convert pdf",
        "webtoolocean",
        ...keywords,
      ].join(", "),
    },
    { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    { name: "author", content: "WebToolOcean" },
    { name: "publisher", content: "WebToolOcean" },

    // OpenGraph
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: ogType },
    { property: "og:locale", content: "en_US" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:site", content: "@WebToolOcean" },
    { name: "twitter:creator", content: "@WebToolOcean" },

    // Mobile & App optimization
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-title", content: "PDF Studio" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    { name: "theme-color", content: "#e5383b" },
  ];

  const linksList = [
    { rel: "canonical", href: canonicalUrl },
  ];

  // Schema.org Structured Data for Answer Engine Optimization (AEO) and Rich Snippets
  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: fullTitle,
      description: description,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: "Professional all-in-one PDF editing, conversion, and security suite in your browser.",
      },
      inLanguage: "en-US",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: applicationName,
      operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
      applicationCategory: applicationCategory,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "In-Browser PDF Editing",
        "256-bit AES Password Encryption",
        "PDF Conversion & OCR",
        "Page Organization & Merging",
        "Electronic Signatures",
      ],
    },
  ];

  // Add FAQPage Schema if FAQs are provided
  if (faqItems && faqItems.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  const scriptsList = schemas.map((schema) => ({
    type: "application/ld+json",
    children: JSON.stringify(schema),
  }));

  return {
    meta: metaList,
    links: linksList,
    scripts: scriptsList,
  };
}
