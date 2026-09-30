import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface TemplateDefinition {
  id: string;
  name: string;
  category: "Business" | "Career" | "Productivity" | "Legal";
  description: string;
  badge: string;
  fileName: string;
  accentColor: string;
  previewSnippet: string;
}

export const PDF_TEMPLATES: TemplateDefinition[] = [
  {
    id: "resume",
    name: "Modern Resume / CV",
    category: "Career",
    description: "Clean, professional two-column curriculum vitae layout with summary, work experience, education, and core skills.",
    badge: "Most Popular",
    fileName: "Modern-Resume.pdf",
    accentColor: "#2563eb",
    previewSnippet: "ALEX MORGAN • SENIOR PRODUCT DESIGNER\nSan Francisco, CA • alex.morgan@example.com\n\nPROFESSIONAL SUMMARY\nExperienced product designer specializing in user-centered digital products...",
  },
  {
    id: "invoice",
    name: "Professional Invoice",
    category: "Business",
    description: "Standard corporate billing invoice with itemized line items, quantity, unit rate, tax calculation, and payment details.",
    badge: "Essential",
    fileName: "Standard-Invoice.pdf",
    accentColor: "#059669",
    previewSnippet: "INVOICE #INV-2026-0042\nDate: Oct 1, 2026 • Due: Oct 15, 2026\n\nBill To: Acme Global Enterprises Inc.\nItems: UI/UX System Design ($3,500.00)",
  },
  {
    id: "receipt",
    name: "Sales Receipt",
    category: "Business",
    description: "Itemized purchase receipt complete with receipt number, transaction timestamp, payment method, and tax summary.",
    badge: "Standard",
    fileName: "Sales-Receipt.pdf",
    accentColor: "#d97706",
    previewSnippet: "PAYMENT RECEIPT #REC-88421\nMerchant: Studio Commerce Ltd\nPayment Method: Visa Ending in 4242\nStatus: PAID IN FULL",
  },
  {
    id: "business-letter",
    name: "Business Letter",
    category: "Business",
    description: "Formal corporate letterhead with sender information, date, recipient address, structured body paragraphs, and sign-off.",
    badge: "Corporate",
    fileName: "Business-Letter.pdf",
    accentColor: "#475569",
    previewSnippet: "NEXUS STRATEGIC CONSULTING\n100 Wall Street, New York, NY\n\nDear Mr. Henderson,\nRe: Strategic Partnership and Technology Alliance Review...",
  },
  {
    id: "cover-letter",
    name: "Job Cover Letter",
    category: "Career",
    description: "Targeted employment cover letter highlighting applicant background, qualification matches, key milestones, and closing call-to-action.",
    badge: "Career",
    fileName: "Cover-Letter.pdf",
    accentColor: "#6366f1",
    previewSnippet: "JORDAN REED • SOFTWARE ENGINEER\njordan.reed@techmail.com\n\nDear Hiring Team,\nI am writing to express my enthusiastic interest in the Software Engineer position...",
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes & Agenda",
    category: "Productivity",
    description: "Structured minutes template with meeting agenda, attendee roll call, key discussion notes, decisions made, and assigned action items.",
    badge: "Team",
    fileName: "Meeting-Notes.pdf",
    accentColor: "#0284c7",
    previewSnippet: "PROJECT KICKOFF MEETING NOTES\nDate: Monday, Oct 5, 2026 • Time: 10:00 AM\nAttendees: Sarah, Marcus, David, Elena\nAgenda & Action Items...",
  },
  {
    id: "simple-contract",
    name: "Simple Service Contract",
    category: "Legal",
    description: "Straightforward mutual service agreement outlining scope of work, deliverables, payment milestones, confidentiality, and signature lines.",
    badge: "Legal",
    fileName: "Service-Agreement.pdf",
    accentColor: "#dc2626",
    previewSnippet: "INDEPENDENT CONTRACTOR AGREEMENT\nBetween Studio Innovations LLC ('Client') and Service Provider ('Contractor')\nScope of Work & Compensation...",
  },
  {
    id: "proposal",
    name: "Project Proposal",
    category: "Business",
    description: "Comprehensive client proposal template with project background, strategic objectives, deliverables schedule, and estimated budget.",
    badge: "Executive",
    fileName: "Project-Proposal.pdf",
    accentColor: "#7c3aed",
    previewSnippet: "ENTERPRISE TRANSFORMATION PROPOSAL\nPrepared For: Apex International Holdings\nPrepared By: Digital Solutions Group\nProject Phases & Estimated Budget...",
  },
  {
    id: "certificate",
    name: "Certificate of Completion",
    category: "Career",
    description: "Elegant certificate design with decorative border, recipient name field, course description, date of conferral, and authorized signature lines.",
    badge: "Certificate",
    fileName: "Certificate-of-Completion.pdf",
    accentColor: "#b45309",
    previewSnippet: "CERTIFICATE OF ACHIEVEMENT\nThis is proudly presented to:\n[RECIPIENT NAME]\nIn recognition of outstanding dedication and successful completion...",
  },
  {
    id: "report",
    name: "Executive Summary Report",
    category: "Business",
    description: "Polished multi-section business report format with document header, executive summary, key findings, and recommended action points.",
    badge: "Report",
    fileName: "Executive-Report.pdf",
    accentColor: "#0f766e",
    previewSnippet: "QUARTERLY PERFORMANCE & MARKET ANALYSIS\nExecutive Overview • Q3 Strategic Review\nKey Performance Indicators & Findings...",
  },
  {
    id: "todo-list",
    name: "Daily & Weekly Planner",
    category: "Productivity",
    description: "Structured task planner template with checkbox lists, priority badges, deadline trackers, and a daily notes section.",
    badge: "Productivity",
    fileName: "Weekly-Planner.pdf",
    accentColor: "#e11d48",
    previewSnippet: "WEEKLY ACTION PLANNER\nTop Priorities • Action Item Checklist\n□ Review quarterly deliverables\n□ Prepare client presentation slides...",
  },
  {
    id: "checklist",
    name: "Audit & Inspection Checklist",
    category: "Productivity",
    description: "Quality control and workplace inspection checklist with item identifiers, verification criteria, Pass/Fail check boxes, and remarks.",
    badge: "Operations",
    fileName: "Quality-Audit-Checklist.pdf",
    accentColor: "#4338ca",
    previewSnippet: "FACILITY SAFETY & COMPLIANCE CHECKLIST\nLocation: Main Office • Inspector: Quality Team\nCriteria Assessment Table: Pass / Fail / Notes...",
  },
];

/**
 * Synthesizes a real vector PDF document with genuine text elements for the given template.
 * All text is fully editable in PDF Studio.
 */
export async function generateTemplatePdf(templateId: string): Promise<{
  bytes: ArrayBuffer;
  fileName: string;
}> {
  const fallback = PDF_TEMPLATES[0];
  if (!fallback) throw new Error("No templates defined.");
  const tpl: TemplateDefinition = PDF_TEMPLATES.find((t) => t.id === templateId) || fallback;

  const doc = await PDFDocument.create();
  // Standard A4: 595.28 x 841.89
  const page = doc.addPage([595.28, 841.89]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.12, 0.14, 0.18);
  const secondaryColor = rgb(0.38, 0.42, 0.48);
  const brandRed = rgb(0.9, 0.22, 0.23);

  // Helper to draw text
  const drawT = (
    text: string,
    x: number,
    y: number,
    size: number,
    isBold = false,
    color = primaryColor
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? fontBold : fontRegular,
      color,
    });
  };

  switch (tpl.id) {
    case "invoice": {
      // Top header banner
      page.drawRectangle({
        x: 40,
        y: 775,
        width: 515,
        height: 3,
        color: brandRed,
      });

      drawT("INVOICE", 40, 740, 26, true, brandRed);
      drawT("Invoice #: INV-2026-0042", 400, 750, 11, true);
      drawT("Date: October 1, 2026", 400, 735, 10, false, secondaryColor);
      drawT("Due Date: October 15, 2026", 400, 720, 10, false, secondaryColor);

      // Company info
      drawT("ACME CREATIVE STUDIO LLC", 40, 695, 12, true);
      drawT("120 Innovation Way, Suite 400", 40, 680, 10, false, secondaryColor);
      drawT("San Francisco, CA 94105", 40, 665, 10, false, secondaryColor);
      drawT("billing@acmecreative.com", 40, 650, 10, false, secondaryColor);

      // Bill To
      drawT("BILL TO:", 320, 695, 11, true);
      drawT("Global Enterprise Partners Inc.", 320, 680, 11, true);
      drawT("Attn: Accounts Payable", 320, 665, 10, false, secondaryColor);
      drawT("500 Madison Avenue, New York, NY", 320, 650, 10, false, secondaryColor);

      // Table Header
      page.drawRectangle({
        x: 40,
        y: 595,
        width: 515,
        height: 24,
        color: rgb(0.95, 0.96, 0.98),
      });
      drawT("DESCRIPTION", 50, 602, 10, true);
      drawT("HOURS / QTY", 320, 602, 10, true);
      drawT("RATE", 410, 602, 10, true);
      drawT("AMOUNT", 490, 602, 10, true);

      // Table Rows
      const rows: [string, string, string, string][] = [
        ["UI/UX Design & User Research Phase", "40 hrs", "$95.00", "$3,800.00"],
        ["Design System & Component Library", "25 hrs", "$95.00", "$2,375.00"],
        ["Interactive Prototype & Usability Testing", "15 hrs", "$95.00", "$1,425.00"],
        ["Asset Export & Production Handoff", "8 hrs", "$90.00", "$720.00"],
      ];

      let rowY = 565;
      rows.forEach(([desc, qty, rate, amt], idx) => {
        if (idx % 2 === 1) {
          page.drawRectangle({
            x: 40,
            y: rowY - 6,
            width: 515,
            height: 24,
            color: rgb(0.98, 0.98, 0.99),
          });
        }
        drawT(desc, 50, rowY, 10, false);
        drawT(qty, 330, rowY, 10, false);
        drawT(rate, 415, rowY, 10, false);
        drawT(amt, 490, rowY, 10, true);
        rowY -= 28;
      });

      // Totals
      page.drawRectangle({ x: 340, y: rowY - 5, width: 215, height: 1, color: rgb(0.85, 0.88, 0.92) });
      rowY -= 20;
      drawT("Subtotal:", 360, rowY, 10, false, secondaryColor);
      drawT("$8,320.00", 490, rowY, 10, true);
      rowY -= 18;
      drawT("Tax (0.0%):", 360, rowY, 10, false, secondaryColor);
      drawT("$0.00", 505, rowY, 10, false);
      rowY -= 22;

      page.drawRectangle({ x: 340, y: rowY - 8, width: 215, height: 26, color: rgb(0.95, 0.96, 0.98) });
      drawT("TOTAL DUE:", 360, rowY, 11, true, brandRed);
      drawT("$8,320.00", 480, rowY, 12, true, brandRed);

      // Payment notes
      drawT("PAYMENT TERMS & INSTRUCTIONS", 40, 240, 10, true);
      drawT("Payment is due within 14 calendar days of invoice date.", 40, 222, 9, false, secondaryColor);
      drawT("Direct Bank Transfer: Account #4492-8819-2049 | Routing #021000021", 40, 208, 9, false, secondaryColor);
      drawT("Thank you for your business!", 40, 180, 10, true, brandRed);
      break;
    }

    case "receipt": {
      drawT("RECEIPT", 40, 740, 26, true, brandRed);
      drawT("Receipt #: REC-2026-9041", 400, 750, 11, true);
      drawT("Date: October 1, 2026 14:32", 400, 735, 10, false, secondaryColor);
      drawT("Payment: Visa ending in 4242", 400, 720, 10, false, secondaryColor);

      drawT("MERCHANT DETAILS", 40, 690, 11, true);
      drawT("Metro Retail & Hardware Co.", 40, 674, 10, false, secondaryColor);
      drawT("45 Market St, San Francisco, CA", 40, 660, 10, false, secondaryColor);

      page.drawRectangle({ x: 40, y: 620, width: 515, height: 2, color: rgb(0.85, 0.88, 0.92) });

      let rY = 590;
      const items: [string, string, string][] = [
        ["Wireless Ergonomic Keyboard", "1", "$89.99"],
        ["Precision Optical Mouse", "1", "$49.50"],
        ["USB-C 10-in-1 Aluminum Hub", "2", "$119.98"],
        ["Heavy Duty Monitor Desk Arm", "1", "$79.00"],
      ];

      drawT("ITEM DESCRIPTION", 50, rY, 10, true);
      drawT("QTY", 380, rY, 10, true);
      drawT("AMOUNT", 490, rY, 10, true);
      rY -= 24;

      items.forEach(([item, q, amt]) => {
        drawT(item, 50, rY, 10, false);
        drawT(q, 385, rY, 10, false);
        drawT(amt, 490, rY, 10, true);
        rY -= 22;
      });

      page.drawRectangle({ x: 40, y: rY, width: 515, height: 1, color: rgb(0.85, 0.88, 0.92) });
      rY -= 20;

      drawT("Subtotal:", 380, rY, 10, false, secondaryColor);
      drawT("$338.47", 490, rY, 10, true);
      rY -= 18;
      drawT("Sales Tax (8.5%):", 380, rY, 10, false, secondaryColor);
      drawT("$28.77", 495, rY, 10, false);
      rY -= 24;
      drawT("TOTAL PAID:", 380, rY, 12, true, brandRed);
      drawT("$367.24", 485, rY, 13, true, brandRed);

      drawT("PAID IN FULL", 50, rY, 14, true, rgb(0.05, 0.6, 0.3));
      break;
    }

    case "meeting-notes": {
      drawT("MEETING NOTES & ACTION PLAN", 40, 750, 22, true, brandRed);
      drawT("Date: October 5, 2026 • Time: 10:00 AM - 11:30 AM PST", 40, 730, 10, false, secondaryColor);
      drawT("Location: Virtual Conference Room A / Zoom", 40, 715, 10, false, secondaryColor);

      page.drawRectangle({ x: 40, y: 700, width: 515, height: 2, color: brandRed });

      drawT("ATTENDEES", 40, 675, 12, true);
      drawT("Sarah Jenkins (Lead), Marcus Chen (Engineering), Priya Sharma (Product), David Ross (Design)", 40, 658, 10, false, secondaryColor);

      drawT("AGENDA TOPICS", 40, 625, 12, true);
      drawT("1. Review of Q3 Product Roadmap & Milestone Achievements", 50, 608, 10, false);
      drawT("2. User Feedback on In-Browser PDF Editing Capabilities", 50, 592, 10, false);
      drawT("3. Infrastructure Scalability & Storage Tier Architecture", 50, 576, 10, false);

      drawT("KEY DISCUSSIONS & DECISIONS", 40, 545, 12, true);
      drawT("• Guest-first editor workflows received unanimous positive feedback in initial user trials.", 50, 528, 10, false);
      drawT("• Cloud storage saving confirmed for 30-day retention on standard community tier accounts.", 50, 512, 10, false);
      drawT("• Agreed to launch dedicated public template center with immediate editable document generation.", 50, 496, 10, false);

      drawT("ASSIGNED ACTION ITEMS", 40, 460, 12, true);
      page.drawRectangle({ x: 40, y: 440, width: 515, height: 22, color: rgb(0.95, 0.96, 0.98) });
      drawT("TASK DESCRIPTION", 50, 447, 9, true);
      drawT("OWNER", 340, 447, 9, true);
      drawT("DEADLINE", 460, 447, 9, true);

      const tasks: [string, string, string][] = [
        ["Deploy revised guest navigation and header", "Marcus C.", "Oct 8, 2026"],
        ["Draft 12 starter PDF vector templates", "David R.", "Oct 10, 2026"],
        ["Review privacy compliance documentation", "Sarah J.", "Oct 12, 2026"],
      ];

      let tY = 415;
      tasks.forEach(([task, owner, due]) => {
        drawT(`□  ${task}`, 50, tY, 9, false);
        drawT(owner, 340, tY, 9, false);
        drawT(due, 460, tY, 9, true);
        tY -= 24;
      });
      break;
    }

    case "simple-contract": {
      drawT("INDEPENDENT SERVICES AGREEMENT", 40, 750, 18, true, brandRed);
      drawT("This Agreement is entered into on October 1, 2026, by and between:", 40, 725, 10, false);

      drawT("CLIENT: Studio Technologies LLC ('Client'), 100 Mission St, San Francisco, CA", 40, 700, 10, true);
      drawT("CONTRACTOR: Professional Services Consultant ('Contractor')", 40, 685, 10, true);

      drawT("1. SCOPE OF WORK", 40, 650, 11, true);
      drawT("Contractor shall perform professional software development, technical review, and documentation", 40, 634, 10, false);
      drawT("services as mutually agreed upon in writing.", 40, 620, 10, false);

      drawT("2. COMPENSATION & PAYMENT TERMS", 40, 590, 11, true);
      drawT("Client agrees to compensate Contractor at the agreed milestone rates. Invoices shall be payable", 40, 574, 10, false);
      drawT("within 15 business days of receipt.", 40, 560, 10, false);

      drawT("3. INTELLECTUAL PROPERTY & CONFIDENTIALITY", 40, 530, 11, true);
      drawT("All deliverables created pursuant to this Agreement shall be deemed work-made-for-hire and the", 40, 514, 10, false);
      drawT("sole property of Client upon full payment of fees.", 40, 500, 10, false);

      drawT("SIGNATURES & ACCEPTANCE", 40, 420, 11, true);
      page.drawRectangle({ x: 40, y: 350, width: 220, height: 1, color: secondaryColor });
      drawT("CLIENT SIGNATURE / DATE", 40, 335, 9, true);

      page.drawRectangle({ x: 320, y: 350, width: 220, height: 1, color: secondaryColor });
      drawT("CONTRACTOR SIGNATURE / DATE", 320, 335, 9, true);
      break;
    }

    case "todo-list": {
      drawT("WEEKLY ACTION PLANNER", 40, 750, 22, true, brandRed);
      drawT("Priorities & Execution Checklist", 40, 730, 11, false, secondaryColor);
      page.drawRectangle({ x: 40, y: 715, width: 515, height: 2, color: brandRed });

      let cY = 680;
      const todoItems = [
        "Finalize client pitch deck for Thursday meeting",
        "Review and sign mutual non-disclosure agreement",
        "Export and review high-resolution production assets",
        "Submit monthly business expense invoices",
        "Schedule quarterly strategy alignment call",
        "Update portfolio case studies and metrics",
        "Draft technical specification for database migration",
        "Follow up with enterprise leads and partnerships",
      ];

      drawT("HIGH PRIORITY TASKS", 40, cY, 12, true);
      cY -= 25;
      todoItems.slice(0, 4).forEach((item) => {
        page.drawRectangle({ x: 45, y: cY - 2, width: 12, height: 12, color: rgb(1, 1, 1), borderWidth: 1, borderColor: secondaryColor });
        drawT(item, 68, cY, 10, false);
        cY -= 26;
      });

      cY -= 15;
      drawT("REGULAR & UPCOMING TASKS", 40, cY, 12, true);
      cY -= 25;
      todoItems.slice(4).forEach((item) => {
        page.drawRectangle({ x: 45, y: cY - 2, width: 12, height: 12, color: rgb(1, 1, 1), borderWidth: 1, borderColor: secondaryColor });
        drawT(item, 68, cY, 10, false);
        cY -= 26;
      });

      cY -= 20;
      drawT("NOTES & REMINDERS", 40, cY, 11, true);
      cY -= 15;
      page.drawRectangle({ x: 40, y: 150, width: 515, height: cY - 150, color: rgb(0.97, 0.98, 0.99), borderWidth: 1, borderColor: rgb(0.9, 0.92, 0.95) });
      drawT("• Keep focus on high-impact deliverables first.", 50, cY - 25, 9, false, secondaryColor);
      break;
    }

    default: {
      // Standard Resume / CV / General layout
      drawT("ALEX MORGAN", 40, 750, 24, true, brandRed);
      drawT("Senior Product Designer & Systems Architect", 40, 730, 12, false, secondaryColor);
      drawT("San Francisco, CA • alex.morgan@example.com • linkedin.com/in/alexmorgan", 40, 715, 9, false, secondaryColor);

      page.drawRectangle({ x: 40, y: 700, width: 515, height: 2, color: brandRed });

      drawT("PROFESSIONAL SUMMARY", 40, 675, 12, true);
      drawT(
        "Accomplished Product Designer with over 8 years of experience designing scalable enterprise software,",
        40,
        658,
        10,
        false
      );
      drawT(
        "design systems, and web applications. Proven track record leading multidisciplinary teams to deliver",
        40,
        644,
        10,
        false
      );
      drawT(
        "intuitive, accessible, and delightful digital user experiences.",
        40,
        630,
        10,
        false
      );

      drawT("WORK EXPERIENCE", 40, 595, 12, true);

      drawT("Lead Product Designer — CloudScale Technologies", 40, 575, 11, true);
      drawT("2022 – Present | San Francisco, CA", 40, 560, 9, false, secondaryColor);
      drawT("• Led end-to-end design for core web analytics suite used by over 500,000 monthly active users.", 50, 545, 9, false);
      drawT("• Established accessible design system component library reducing developer delivery time by 35%.", 50, 532, 9, false);
      drawT("• Collaborated directly with executive stakeholders and product managers on strategic roadmap.", 50, 519, 9, false);

      drawT("Senior UI/UX Designer — Apex Digital Lab", 40, 485, 11, true);
      drawT("2019 – 2022 | Austin, TX", 40, 470, 9, false, secondaryColor);
      drawT("• Designed responsive web workflows, interactive data visualizations, and client-facing portals.", 50, 455, 9, false);
      drawT("• Conducted over 60 moderated user research and usability sessions to optimize onboarding funnels.", 50, 442, 9, false);

      drawT("EDUCATION", 40, 405, 12, true);
      drawT("Bachelor of Science in Human-Computer Interaction", 40, 388, 10, true);
      drawT("University of California, Berkeley (2015 – 2019)", 40, 374, 9, false, secondaryColor);

      drawT("CORE SKILLS & TECHNOLOGIES", 40, 340, 12, true);
      drawT("Product Strategy • UI/UX Architecture • Design Systems • Figma • Prototyping • Accessibility", 40, 322, 9, false, secondaryColor);
      break;
    }
  }

  const pdfBytes = await doc.save();
  return {
    bytes: pdfBytes.buffer as ArrayBuffer,
    fileName: tpl.fileName,
  };
}
