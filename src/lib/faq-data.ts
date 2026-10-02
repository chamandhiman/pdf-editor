import type { FaqItem } from "./seo";

export const mergeFaq: FaqItem[] = [
  {
    q: "Is there a limit on how many PDF files I can merge together?",
    a: "No! You can merge as many PDF documents as you need. Since processing is performed directly inside your web browser, there are no artificial file count restrictions or hourly quotas.",
  },
  {
    q: "Will merging my PDFs reduce their visual quality or downscale images?",
    a: "No. Our client-side merging engine copies raw vector data, embedded fonts, and lossless page streams directly into the unified document without lossy compression.",
  },
  {
    q: "Are my uploaded PDF files sent to remote cloud servers?",
    a: "Never. All documents are loaded and merged locally in your browser's private memory using WebAssembly. Your confidential documents never leave your computer or mobile device.",
  },
  {
    q: "Can I rearrange the order of documents before merging?",
    a: "Yes. Once you select your PDF files, use the Up and Down arrow buttons to easily adjust the exact sequence before generating the consolidated document.",
  },
  {
    q: "Is the merged PDF compatible with Adobe Acrobat and mobile readers?",
    a: "Yes. The generated file conforms to the official ISO 32000 PDF standard and works seamlessly with Adobe Acrobat Reader, Apple Preview, Google Chrome, Edge, and iOS/Android devices.",
  },
];

export const splitFaq: FaqItem[] = [
  {
    q: "How does the online PDF splitter work?",
    a: "Our PDF splitting tool runs locally inside your web browser. It parses the document's page tree and compiles requested page ranges or individual pages into brand new, self-contained PDF files.",
  },
  {
    q: "Can I extract custom page ranges (e.g. 1-3, 5, 8-12)?",
    a: "Yes! Choose the 'Extract Page Ranges' mode and enter any combination of single pages or ranges separated by commas (e.g. 1-3, 5, 8-12). Each range is exported as its own cleanly formatted document.",
  },
  {
    q: "Can I download all separated pages in a single ZIP file?",
    a: "Yes. When extracting all pages or multiple ranges, you can download each file individually or click 'Download All as ZIP' to receive a single organized ZIP archive.",
  },
  {
    q: "Are my documents uploaded to external cloud servers?",
    a: "No. Unlike legacy PDF tools that upload files to third-party web servers, PDF Studio processes everything in your browser's private memory sandbox with zero data transmission.",
  },
  {
    q: "Is there any quality loss on split or extracted pages?",
    a: "None. All vector font outlines, high-resolution imagery, and hyperlinks are copied losslessly without downscaling or compression artifacts.",
  },
];

export const removePagesFaq: FaqItem[] = [
  {
    q: "How do I delete unwanted pages from my PDF?",
    a: "Simply upload your PDF file, click on the thumbnails of the pages you wish to remove (or type page numbers like '2, 4-6'), and click 'Remove Pages'. Your cleaned PDF will be ready for download instantly.",
  },
  {
    q: "Can I remove multiple non-consecutive pages at once?",
    a: "Yes. You can select any combination of non-consecutive pages (e.g. page 2, page 7, and pages 10 to 14) and delete them simultaneously in a single click.",
  },
  {
    q: "Are remaining pages modified or compressed in any way?",
    a: "No. The retained pages remain untouched. All original vector layouts, fonts, high-resolution graphics, form inputs, and hyperlinks are preserved losslessly.",
  },
  {
    q: "Is there any limit to the number of pages I can delete?",
    a: "You can delete as many pages as you want, provided that at least one page remains in the final document (a PDF file cannot have zero pages).",
  },
  {
    q: "Are my documents saved or transmitted to any server?",
    a: "Never. All page removal and file regeneration occurs entirely inside your device's web browser using local WebAssembly. No files are ever sent over the internet.",
  },
];

export const protectFaq: FaqItem[] = [
  {
    q: "How does PDF password protection work online?",
    a: "WebToolOcean PDF Studio applies standard 256-bit AES encryption to your PDF file directly in your browser. It generates a cryptographic key from your password, encrypting the document's content streams, metadata, and object tables so that without the password, the file cannot be opened.",
  },
  {
    q: "Are my PDF files and passwords sent to any server?",
    a: "No. All encryption runs locally on your device via the Web Crypto API. Your files and passwords never touch remote servers, ensuring 100% compliance with privacy laws and corporate confidentiality standards.",
  },
  {
    q: "Can protected PDFs be opened in Adobe Acrobat and phone apps?",
    a: "Yes. The output file uses the standard ISO 32000 PDF encryption format, ensuring immediate compatibility with Adobe Acrobat Reader, Apple Preview, Google Chrome, Microsoft Edge, iOS Files, and Android PDF readers.",
  },
  {
    q: "Can I restrict printing or copying of my PDF?",
    a: "Yes. In the Advanced Permissions section, you can toggle permissions to allow or forbid printing and copying of text and graphics, or set a separate Master Permissions password.",
  },
  {
    q: "What should I do if I lose the password?",
    a: "Because WebToolOcean never stores your password or documents, lost passwords cannot be retrieved. Always keep your passwords in a secure password manager.",
  },
];

export const contactFaq: FaqItem[] = [
  {
    q: "How quickly does PDF Studio technical support respond?",
    a: "Our core engineering and support team typically replies within 24 business hours to all technical, licensing, and feature inquiries.",
  },
  {
    q: "Do you store any uploaded document data when I request support?",
    a: "Never. All documents remain in your private local browser memory. When reporting an issue, we only examine anonymized client error logs if you choose to share them.",
  },
  {
    q: "Can I request custom enterprise features or batch API integrations?",
    a: "Yes. Use the contact form with the 'Enterprise & Team Licensing' option to request custom offline deployments, API webhooks, or volume team licensing.",
  },
];

export const pricingFaq: FaqItem[] = [
  {
    q: "Is the Free Community plan truly free forever?",
    a: "Yes. Core document utilities, client-side PDF editing, password protection, and page organization are completely free with zero hidden charges or watermarks.",
  },
  {
    q: "What payment methods are supported for Pro tiers?",
    a: "We support all major international credit cards, debit cards, Google Pay, Apple Pay, and PayPal with end-to-end encrypted billing.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. You can cancel your subscription with a single click inside your account dashboard at any point with no cancellation fees.",
  },
];

export const privacyFaq: FaqItem[] = [
  {
    q: "Does WebToolOcean PDF Studio upload my files to remote servers?",
    a: "No. Unlike traditional converters that send documents across the internet, PDF Studio parses, edits, and encrypts PDF documents locally inside your browser's private WebAssembly memory sandbox.",
  },
  {
    q: "Are my documents saved on the server after closing the browser?",
    a: "No. Nothing is stored on our servers. Your document drafts reside solely in your browser's local IndexedDB session until you clear your browsing cache or delete the file.",
  },
  {
    q: "Is WebToolOcean PDF Studio compliant with GDPR and HIPAA requirements?",
    a: "Because documents are processed strictly client-side on the user's local workstation and never transferred or stored externally, confidential patient and personal data never leaves your custody.",
  },
];

export const termsFaq: FaqItem[] = [
  {
    q: "Who owns the copyright of documents edited on PDF Studio?",
    a: "You retain 100% full legal ownership and intellectual property rights over all files, images, signatures, and annotations created using our tools.",
  },
  {
    q: "Can I use WebToolOcean PDF Studio for commercial client work?",
    a: "Yes. All documents produced or edited in PDF Studio are free of watermarks and permitted for commercial, business, legal, and educational use.",
  },
  {
    q: "Are there any usage restrictions or subscription locks?",
    a: "Core editing, drawing, stamping, and password protection tools are provided free with zero forced payment locks or hidden checkout penalties.",
  },
];

export const toolsFaq: FaqItem[] = [
  {
    q: "What tools are available in the PDF Studio directory?",
    a: "Our suite includes over 30 dedicated tools: In-place Text Editor, Password Protect (256-bit AES), Unlock PDF, Merge PDF, Split PDF, Rotate & Extract Pages, Watermark, Compress, Electronic Signature, OCR, and multi-format conversions (Word, Excel, PowerPoint, JPG, PNG).",
  },
  {
    q: "Are the PDF tools free to use?",
    a: "Yes. All core PDF tools are free to use directly in your browser with unlimited daily operations and no required account sign-ups.",
  },
  {
    q: "How fast is document processing on WebToolOcean?",
    a: "Because operations run locally in your browser leveraging WebAssembly, most tasks (such as password encryption, page rotation, text editing, and page extraction) complete in under a second.",
  },
  {
    q: "Will my documents look identical across all operating systems?",
    a: "Yes. PDF Studio uses high-precision font metrics and standardized PDF stream generation to ensure visual parity on Windows, macOS, Linux, iOS, and Android.",
  },
];

export const homeFaq: FaqItem[] = [
  {
    q: "How does in-browser PDF editing protect my privacy?",
    a: "Unlike typical cloud converters, PDF Studio uses client-side WebAssembly and JavaScript engines. Your documents are rendered and modified directly in your local browser sandbox and are never uploaded to remote servers without your explicit permission.",
  },
  {
    q: "Can I password protect my PDF documents for free?",
    a: "Yes. PDF Studio includes a dedicated 256-bit AES password encryption tool that secures your PDF files entirely client-side. The protected documents are compatible with all PDF viewers including Adobe Acrobat and mobile apps.",
  },
  {
    q: "Do I need to install Adobe Acrobat or any plugins?",
    a: "No installation is required. PDF Studio runs entirely in modern web browsers including Chrome, Edge, Safari, Firefox, and Opera on Windows, Mac, Linux, and mobile devices.",
  },
  {
    q: "Can I edit existing text in my PDF without recreating the document?",
    a: "Yes. PDF Studio features in-place text editing that detects existing font styles, sizes, and layout geometries so you can change words directly without adding ugly overlays.",
  },
  {
    q: "Is there any document page limit or hidden watermark?",
    a: "All free tools export clean, professional PDF files with zero watermarks and support documents up to 100 MB.",
  },
];

export const reorderPagesFaq: FaqItem[] = [
  {
    q: "How do I rearrange or change page order in my PDF?",
    a: "Upload your document to the interactive page reordering board. Click and drag page cards to your preferred positions, or use the Move Left / Move Right arrow buttons. Once arranged, click 'Save Reordered PDF' to download your new document instantly.",
  },
  {
    q: "Can I invert or reverse the entire document order?",
    a: "Yes! Click the 'Reverse Order' quick-action button in the toolbar to immediately flip the document sequence from front to back, perfect for reversed scan jobs.",
  },
  {
    q: "Will reordering pages affect the document quality or font formatting?",
    a: "Never. Reordering strictly reorganizes the PDF page tree. Every piece of vector text, high-resolution graphic, embedded font, hyperlink, and visual element is preserved 100% losslessly.",
  },
  {
    q: "Are my uploaded PDF files kept secure and private?",
    a: "Yes. All processing occurs exclusively in your browser memory via WebAssembly with zero network data transfer. Your confidential files never touch remote cloud servers.",
  },
  {
    q: "Is there any limit to the number of pages I can reorder?",
    a: "No! Whether you are organizing a 2-page invoice or a 100-page report, you can rearrange any number of pages with zero file caps or subscription requirements.",
  },
];

export const unlockPdfFaq: FaqItem[] = [
  {
    q: "How does the PDF unlock tool work?",
    a: "Our PDF Unlock tool decrypts password-protected PDF files and strips restrictive editing, printing, and copying permissions directly inside your browser. Once unlocked, you receive a clean, unrestricted PDF file that can be opened anywhere without a password.",
  },
  {
    q: "Can I remove passwords if I don't know the password?",
    a: "If the PDF is protected with an Open / Viewing password (AES encrypted), the correct password must be entered once so our browser engine can decrypt the content streams. If the document is only locked with Permissions restrictions (printing or editing locked), our tool can unlock it immediately.",
  },
  {
    q: "Are my passwords or files sent to any external server?",
    a: "No. Everything runs strictly inside your local web browser. Your confidential files, encryption keys, and passwords never leave your device.",
  },
  {
    q: "Will unlocking a PDF affect the visual formatting or text quality?",
    a: "Never. Unlocking strips encryption envelopes while retaining 100% of original vector typography, high-resolution imagery, and page layout structure losslessly.",
  },
  {
    q: "Is it legal to remove restrictions from my own PDF files?",
    a: "Yes. As long as you have the legal right to access and modify the document (such as your own invoices, receipts, tax documents, or company records), removing passwords and restrictions is completely legal.",
  },
];

export const ocrPdfFaq: FaqItem[] = [
  {
    q: "What is OCR PDF and how does it work?",
    a: "Optical Character Recognition (OCR) converts images of text—such as scanned paper documents, books, receipts, and photos—into editable, searchable, and selectable digital text. Our tool uses browser-native neural OCR technology to identify character glyphs and reconstruct sentences with high accuracy.",
  },
  {
    q: "Can I make my scanned PDF searchable with this tool?",
    a: "Yes! WebToolOcean PDF Studio can generate a true Searchable PDF where the visual appearance of your scanned document is 100% preserved with an invisible, searchable text layer embedded underneath. You can search words with Ctrl+F / Cmd+F, select passages, and copy text directly in any PDF reader.",
  },
  {
    q: "Are my confidential scanned documents uploaded to any server?",
    a: "No! All OCR processing executes 100% locally inside your browser via WebAssembly and Web Workers. Your tax forms, contracts, receipts, IDs, and financial statements never leave your computer or touch remote servers.",
  },
  {
    q: "Which languages are supported for character recognition?",
    a: "We support over 10 major languages including English, Spanish, French, German, Italian, Portuguese, Chinese (Simplified), Japanese, Hindi, and Russian with high-accuracy language models.",
  },
  {
    q: "What output formats can I download?",
    a: "You can download a newly minted Searchable PDF document, export plain recognized text as a clean .txt file, copy text to your clipboard with one click, or seamlessly open the file in the PDF Studio visual editor.",
  },
  {
    q: "Is there any cost, page restriction, or watermark?",
    a: "No. Our OCR PDF tool is completely free with zero watermarks, zero page caps, and no mandatory account sign-up.",
  },
];

export const compressPdfFaq: FaqItem[] = [
  {
    q: "How does the Compress PDF tool reduce file size?",
    a: "Our compression engine analyzes document elements, downsamples oversized embedded images to standard DPI (such as 150 DPI for screens or 96 DPI for web), strips redundant metadata and duplicate font subsets, and optimizes document cross-reference streams. All processing runs 100% locally inside your browser.",
  },
  {
    q: "Will compressing my PDF degrade text or image quality?",
    a: "Not noticeably with Recommended compression. Text remains sharp and readable, while high-resolution photos and graphics are intelligently re-encoded using high-efficiency JPEG compression. If you need maximum visual fidelity for printing, select our 'Low Compression / High Quality' preset.",
  },
  {
    q: "Which compression level should I choose?",
    a: "Recommended (Balanced) is ideal for everyday emailing, portals, and uploads, giving 40%–60% reduction. Extreme (Smallest Size) is perfect for strict attachment limits under 2 MB. Low (High Quality) keeps fine print and graphics pristine while removing unnecessary stream bloat.",
  },
  {
    q: "Are my private documents sent to remote servers for compression?",
    a: "No! PDF Studio operates strictly client-side using WebAssembly and HTML5 Canvas APIs. Your confidential tax files, bank records, and legal agreements are processed exclusively in your computer's local memory and never leave your machine.",
  },
  {
    q: "Can I compress password-protected PDF files?",
    a: "To compress a password-protected PDF, first unlock it using our free 'Unlock PDF' tool to remove the encryption envelope, and then run the unencrypted file through the Compress PDF tool.",
  },
  {
    q: "Is there any limit to the file size or quantity of PDFs I can compress?",
    a: "No! You can compress documents up to 100 MB with zero daily limits, zero watermarks, and no mandatory subscription or account creation.",
  },
];

export const editPdfFaq: FaqItem[] = [
  {
    q: "How do I edit text in an existing PDF document?",
    a: "Simply upload your PDF or select it in the editor. Click on any text passage to modify the words directly in-place. You can change font family, font size, bold, italic, text color, and alignment using the intuitive floating text toolbar.",
  },
  {
    q: "Can I add electronic signatures to my documents?",
    a: "Yes! Use the Sign tool in the top toolbar to draw your signature with your mouse or stylus, type your name using elegant cursive fonts, or upload a photo of your handwritten signature.",
  },
  {
    q: "Can I insert images, shapes, and stamps into the PDF?",
    a: "Yes. You can insert PNG, JPG, and WebP images, place customizable shapes (rectangles, circles, arrows, lines), highlight text passages with color tints, add freehand drawings, and apply official stamps like APPROVED, CONFIDENTIAL, and VOID.",
  },
  {
    q: "Are my documents uploaded to a remote server while editing?",
    a: "Never. PDF Studio runs 100% locally inside your web browser. Your confidential files, contracts, tax returns, and medical records never leave your device.",
  },
  {
    q: "Can I rearrange, rotate, or delete pages in the editor?",
    a: "Yes! The left sidebar displays responsive visual page thumbnails. You can drag and drop to reorder pages, rotate pages 90° clockwise or counter-clockwise, duplicate pages, or delete unwanted pages.",
  },
  {
    q: "Is there any cost, page restriction, or watermark added?",
    a: "No. PDF Studio is completely free to use. Your exported PDFs contain zero watermarks, zero quality reduction, and require no credit card or account sign-up.",
  },
];

export const imageToPdfFaq: FaqItem[] = [
  {
    q: "What image formats can I convert to PDF?",
    a: "You can convert JPG, JPEG, PNG, WebP, SVG, GIF, and BMP images into clean, high-resolution PDF documents.",
  },
  {
    q: "Can I combine multiple images into a single PDF document?",
    a: "Yes! You can upload dozens of photos or scans, arrange them in any desired order with drag-and-drop or move buttons, and merge them all into a single unified multi-page PDF.",
  },
  {
    q: "Can I adjust page orientation and margins?",
    a: "Yes. You can select standard page sizes like A4 or US Letter, fit the page directly to the image aspect ratio, choose portrait or landscape orientation, and customize margin spacing (none, normal, wide).",
  },
  {
    q: "Are my uploaded photos sent to remote servers?",
    a: "Never. All image rendering and PDF compiling happens 100% locally in your web browser using HTML5 Canvas and WebAssembly. Your personal photos and scans remain completely private on your device.",
  },
  {
    q: "Will my images lose quality during conversion?",
    a: "No. PDF Studio retains maximum photographic clarity and original color profiles, packaging high-resolution bitmap data directly into the resulting PDF container.",
  },
];

export const pdfToWordFaq: FaqItem[] = [
  {
    q: "Will the converted Word document be fully editable in Microsoft Word?",
    a: "Yes! The output is a native Office OpenXML document (.docx) compatible with Microsoft Word, Office 365, Google Docs, Apple Pages, and LibreOffice Writer.",
  },
  {
    q: "How does PDF Studio preserve paragraphs and text formatting?",
    a: "Our conversion engine analyzes character coordinates, font sizes, line heights, and vertical margins to intelligently reconstruct paragraphs, headings, and page breaks without scrambled text.",
  },
  {
    q: "Are my confidential files uploaded to any third-party servers?",
    a: "No. Everything runs inside your browser sandbox. Your sensitive contracts, financial statements, and business proposals never leave your computer.",
  },
  {
    q: "Can I copy and edit the text directly in the browser?",
    a: "Yes! The conversion tool provides a live text preview where you can read, verify, and copy the extracted content with a single click before or after downloading the .docx file.",
  },
  {
    q: "Is there a limit on how many pages I can convert to Word?",
    a: "No. There are no daily limits, no page count restrictions, and no required email registration.",
  },
];

export const pdfToExcelFaq: FaqItem[] = [
  {
    q: "How does the PDF to Excel converter detect tables and columns?",
    a: "The extractor analyzes text spatial alignments, line clusters, and coordinate spacing to group data into structured rows and columns, mapping them directly into Excel cells.",
  },
  {
    q: "What file formats can I download after conversion?",
    a: "You can download a native Microsoft Excel workbook (.xlsx) ready for formula calculations, or export as raw CSV for database importing and spreadsheet analysis.",
  },
  {
    q: "Can I preview the extracted table before downloading?",
    a: "Yes! A live interactive spreadsheet viewer is rendered directly in your browser so you can inspect the extracted columns and rows immediately.",
  },
  {
    q: "Are numbers formatted correctly for Excel formulas?",
    a: "Yes. PDF Studio detects numeric entries and converts them into numeric cell types in Excel, allowing instant SUM, AVERAGE, and arithmetic operations.",
  },
  {
    q: "Is my financial and accounting data safe?",
    a: "100% safe. Processing is performed locally on your device. Zero bytes are uploaded to remote servers or cloud storage.",
  },
];

export const pdfToPptFaq: FaqItem[] = [
  {
    q: "Does the PDF to PowerPoint converter include images and graphics from the PDF?",
    a: "Yes! Unlike simple text-only converters, our tool renders every PDF page as a full-resolution 2.5× PNG image and embeds it as the slide background. Every image, chart, logo, graphic, and design element is preserved with complete visual fidelity.",
  },
  {
    q: "Can I edit the converted slides in Microsoft PowerPoint?",
    a: "Yes! Every slide contains fully editable PowerPoint text boxes matching the original font sizes, weights, and colors, positioned over a clean visual background containing your illustrations, charts, and graphics without duplicate text overlay. You can directly click, select, edit, reformat, and replace any text in PowerPoint, Google Slides, or Apple Keynote.",
  },
  {
    q: "Are my PDF files uploaded to any server during conversion?",
    a: "No. All processing happens entirely in your browser using PDF.js and JavaScript. Your files never leave your device. This guarantees complete privacy for confidential presentations, reports, and business documents.",
  },
  {
    q: "What is the output slide size and resolution?",
    a: "Each slide inherits the exact dimensions of its corresponding PDF page (converted from points to EMUs), so there is no stretching or cropping. The background image is rendered at 2.5× scale (~190 DPI equivalent) for crisp text and sharp graphics.",
  },
  {
    q: "Can I also download the slide images separately?",
    a: "Yes! Along with the .pptx download, you can also download a ZIP archive containing all slide pages as individual high-resolution PNG files — perfect for embedding into other documents or sharing online.",
  },
];

export const pdfToJpgFaq: FaqItem[] = [
  {
    q: "What resolution are the JPG images exported at?",
    a: "Our converter renders PDF pages at 2.5× scale by default (approximately 180 DPI), producing sharp, publication-quality JPG images. You can also choose 1.5×, 2×, or 3× scale in the export settings panel.",
  },
  {
    q: "Can I control the JPG compression quality?",
    a: "Yes. The export settings panel lets you adjust JPEG quality from 60% to 100%. Higher quality means larger file size but sharper images. 90–95% is recommended for most use cases.",
  },
  {
    q: "Can I convert all pages of a multi-page PDF to JPG at once?",
    a: "Yes. All pages are rendered simultaneously and you can download individual pages or all images together in a single organized ZIP archive with one click.",
  },
  {
    q: "Are my PDF documents sent to external servers?",
    a: "Never. All PDF rendering and JPEG encoding is performed locally inside your web browser using HTML5 Canvas and PDF.js. Your documents remain completely private on your device.",
  },
  {
    q: "Which PDF types are supported?",
    a: "Any standard PDF file is supported — including text-based documents, scanned documents, presentations, reports, forms, and brochures.",
  },
];

export const pdfToPngFaq: FaqItem[] = [
  {
    q: "Why use PNG instead of JPG for PDF export?",
    a: "PNG uses lossless compression, meaning every pixel is preserved exactly without JPEG artifacts. This is ideal for documents with sharp text, line art, logos, diagrams, or any content where visual accuracy is critical.",
  },
  {
    q: "Does the PNG export support transparency?",
    a: "The renderer uses a white background canvas for maximum compatibility. If your PDF pages have transparent areas, they will appear white in the output — which is the standard behavior for maximum viewer compatibility.",
  },
  {
    q: "What is the output resolution for PNG images?",
    a: "Pages are rendered at 2.5× scale by default (approximately 180 DPI equivalent), producing crisp, high-detail PNG images. You can increase scale to 3× for print-quality output or decrease to 1.5× for smaller file sizes.",
  },
  {
    q: "Can I export all PDF pages as PNG in one click?",
    a: "Yes. Click 'All as ZIP' to download every page as an individually named PNG file inside a single ZIP archive — perfectly organized and ready for use.",
  },
  {
    q: "Are my files uploaded to any server?",
    a: "No. All rendering runs 100% locally in your browser with zero server uploads. Your confidential documents never leave your device.",
  },
];

export const cookiesFaq: FaqItem[] = [
  {
    q: "Why does WebToolOcean PDF Studio use cookies?",
    a: "We use essential cookies and browser storage (such as IndexedDB and localStorage) to keep your editing sessions active, remember your theme preference, and preserve draft documents locally. Third-party advertising partners like Google AdSense may also set cookies to serve relevant, non-intrusive advertisements.",
  },
  {
    q: "What is Google's DoubleClick DART cookie and how does it affect me?",
    a: "Google uses DART cookies to serve ads to users based on their visits to websites across the internet. You can opt out of personalized DART cookie targeting at any time by visiting the Google Ad and Content Network Privacy Policy at adssettings.google.com.",
  },
  {
    q: "Can I use PDF Studio without enabling advertising cookies?",
    a: "Yes! All core document editing, conversion, splitting, merging, and encryption functions work seamlessly regardless of whether you accept advertising cookies. You can reject non-essential cookies via our consent prompt or your browser settings.",
  },
  {
    q: "How do I clear or disable cookies in my browser?",
    a: "You can manage, restrict, or clear cookies in your browser settings under Privacy & Security. Detailed step-by-step instructions for Chrome, Safari, Firefox, and Microsoft Edge are provided on our Cookie Policy page.",
  },
  {
    q: "Does PDF Studio track my document contents using cookies?",
    a: "Never. Cookies cannot access, read, or transmit your PDF document data. All PDF parsing and rendering happens in a closed, client-side browser sandbox without telemetry.",
  },
];

export const disclaimerFaq: FaqItem[] = [
  {
    q: "Does PDF Studio offer legal advice regarding signed documents?",
    a: "No. PDF Studio provides technical software tools for electronic document modification and drawing signatures. We do not provide legal counsel, compliance certifications, or legal enforceability guarantees for contracts signed through the platform.",
  },
  {
    q: "Is document conversion 100% guaranteed to be identical to original files?",
    a: "While our conversion engine strives for maximum fidelity by extracting vector layout, styles, and high-resolution graphics, differences in system fonts, embedded complex scripts, or non-standard PDF formats may occasionally result in slight visual variances.",
  },
  {
    q: "What happens if I lose a password set on an encrypted PDF?",
    a: "Because PDF Studio implements true zero-knowledge client-side 256-bit AES encryption, passwords are never transmitted to our servers or stored in any database. If you forget your password, our team cannot recover or reset it.",
  },
  {
    q: "Are third-party links and advertisements endorsed by PDF Studio?",
    a: "Third-party advertisements served via networks like Google AdSense and links to external websites are provided for reference and convenience. WebToolOcean does not warrant or endorse third-party products, services, or claims.",
  },
  {
    q: "Is there any warranty on free PDF utilities?",
    a: "The services are provided on an 'as-is' and 'as-available' basis without warranties of any kind, whether statutory, express, or implied. Users are encouraged to retain backups of important original files.",
  },
];

export const aboutFaq: FaqItem[] = [
  {
    q: "What is WebToolOcean PDF Studio?",
    a: "PDF Studio by WebToolOcean is a modern, privacy-first web document platform. We engineer high-performance web applications that handle professional PDF editing, conversion, password protection, and page manipulation directly in your browser without requiring server uploads.",
  },
  {
    q: "How does the client-side architecture work?",
    a: "By leveraging modern web standards including WebAssembly, Web Workers, and the HTML5 Canvas API, computation is executed on your local computer's processor. Your confidential files never touch external servers or cloud databases.",
  },
  {
    q: "Is PDF Studio completely free to use?",
    a: "Yes! All fundamental document tools — including editing, merging, splitting, compressing, password protection, and conversions — are free to use without requiring an account or credit card.",
  },
  {
    q: "What other products are part of the WebToolOcean ecosystem?",
    a: "WebToolOcean develops a suite of high-productivity web applications including the AI Resume Builder (Resume.webtoolocean.com), drag-and-drop Website Builder (builder.webtoolocean.com), and the core WebToolOcean productivity toolkit.",
  },
  {
    q: "How does PDF Studio adhere to web accessibility standards?",
    a: "We adhere strictly to WCAG 2.1 AA accessibility guidelines, providing comprehensive keyboard navigation, high contrast UI themes, screen reader ARIA labels, and responsive typography.",
  },
];

export const securityFaq: FaqItem[] = [
  {
    q: "How does PDF Studio guarantee document privacy?",
    a: "We operate on a zero-knowledge, client-side execution model. When you open a PDF, it is parsed directly in your browser's private memory heap. At no point is the document stream uploaded to or stored on our servers.",
  },
  {
    q: "What encryption standards are used for password protection?",
    a: "We use standard 256-bit AES (Advanced Encryption Standard) encryption via the browser's hardware-accelerated Web Crypto API, conforming to the ISO 32000 PDF security specification.",
  },
  {
    q: "Are Google OAuth sessions safe and private?",
    a: "Yes. Google OAuth 2.0 uses encrypted tokens and only requests basic profile information (name, email, and avatar) to display your workspace. We never request access to your Google Drive, contacts, or personal cloud files.",
  },
  {
    q: "How can I report a security vulnerability?",
    a: "We welcome responsible security disclosures. If you discover a potential vulnerability, please email our security engineering team directly at security@webtoolocean.com.",
  },
];

export const wordToPdfFaq: FaqItem[] = [
  {
    q: "How does the Word to PDF converter work?",
    a: "Our converter parses your DOCX document structure (including headings, paragraphs, bullet points, text styling, and tables) directly in your browser using client-side JavaScript, compiling it into a clean, standardized PDF file with zero server uploads.",
  },
  {
    q: "Are my confidential Word documents uploaded to remote servers?",
    a: "Never. All parsing and PDF rendering occurs locally on your computer's processor. Your confidential files never leave your device.",
  },
  {
    q: "Are tables and formatted lists preserved?",
    a: "Yes! Document headings, body text, lists, and tabular data are cleanly converted into formatted PDF pages matching standard A4 dimensions.",
  },
  {
    q: "Can I open the generated PDF in the online PDF Editor right away?",
    a: "Yes! Once converted, you can either download the PDF immediately or click 'Open in Editor' to annotate, sign, or modify text in your newly generated document.",
  },
];

export const excelToPdfFaq: FaqItem[] = [
  {
    q: "How does the Excel to PDF converter format large spreadsheets?",
    a: "Our Excel to PDF engine automatically uses Landscape A4 orientation (842 x 595 pt) to ensure maximum column visibility, applying alternating row fills and clean grid lines for effortless readability.",
  },
  {
    q: "Are my financial figures and spreadsheet data private?",
    a: "100% private. Processing happens completely inside your device browser sandbox. No financial data, customer lists, or numbers are transmitted across the web.",
  },
  {
    q: "What Excel file formats are supported?",
    a: "We support standard Microsoft Excel OpenXML (.xlsx) workbooks, templates, and exports from Google Sheets and Apple Numbers.",
  },
  {
    q: "Can I convert multi-row datasets?",
    a: "Yes! The converter automatically paginates long spreadsheets into sequential pages with persistent header banners and page indicators.",
  },
];

export const pptToPdfFaq: FaqItem[] = [
  {
    q: "How does the PowerPoint to PDF converter format slides?",
    a: "Each slide is rendered into a 16:9 widescreen PDF presentation page, preserving slide titles, bullet points, numbering, and slide layouts for high-impact viewing and printing.",
  },
  {
    q: "Can I present or print the converted PDF deck?",
    a: "Yes! The output PDF conforms to the ISO 32000 standard and can be viewed in full-screen presentation mode in Adobe Acrobat Reader, Google Chrome, Apple Preview, or printed as slide handouts.",
  },
  {
    q: "Are my presentation slides uploaded to cloud servers?",
    a: "No. The entire slide extraction and PDF creation executes in your browser's private memory. Confidential corporate decks remain 100% safe on your workstation.",
  },
];

export const pngToPdfFaq: FaqItem[] = [
  {
    q: "Does the PNG to PDF converter preserve image transparency?",
    a: "Yes. Our PNG converter embeds lossless PNG graphics onto standard PDF canvas pages, retaining crisp edges, sharp text captures, and logo fidelity without JPEG compression artifacts.",
  },
  {
    q: "Can I convert multiple PNG images into a single multi-page PDF?",
    a: "Yes! You can drop multiple PNG screenshots or scans, reorder pages, rotate images, customize page margins, and download a single consolidated PDF document.",
  },
  {
    q: "What page sizes are supported for PNG to PDF?",
    a: "You can choose between A4, US Letter, or 'Fit to Image' dimensions depending on whether you are preparing documents for print or digital archiving.",
  },
];





