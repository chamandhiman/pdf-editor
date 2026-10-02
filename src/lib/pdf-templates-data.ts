import type { PDFDocument, PDFPage, PDFObject, TextProps } from "@/types/pdf";
import {
  TEMPLATE_DASHBOARD_PNG,
  TEMPLATE_ARCHITECTURE_PNG,
  TEMPLATE_SPEAKER_PNG,
  TEMPLATE_LOGO_PNG,
  TEMPLATE_PARTNERSHIP_JPG,
} from "./template-assets";

export interface TemplateMetadata {
  id: string;
  name: string;
  category:
    | "Landing Pages"
    | "Architecture"
    | "Banners"
    | "Business"
    | "Finance"
    | "Certificates"
    | "Marketing"
    | "Resumes";
  style?: string;
  description: string;
  badge?: string;
  pages: number;
  tags: string[];
  accentColor: string;
  isAtsFriendly?: boolean;
  isPro?: boolean;
  createDocument: () => PDFDocument;
}

// ---------------------------------------------------------------------------
// Object Factory Helpers
// ---------------------------------------------------------------------------

let idCounter = 1;
function genId(prefix = "obj"): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

export function createTextObj(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  value: string,
  options?: Partial<TextProps>
): PDFObject {
  return {
    id: genId("txt"),
    type: "text",
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 100,
    text: {
      value,
      fontFamily: options?.fontFamily || "Helvetica, Arial, sans-serif",
      fontSize: options?.fontSize || 13,
      bold: options?.bold || false,
      italic: options?.italic || false,
      underline: options?.underline || false,
      color: options?.color || "#1e293b",
      align: options?.align || "left",
      listType: options?.listType || "none",
      listItems: options?.listItems,
    },
  };
}

export function createShapeObj(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  kind: "line" | "rectangle" | "circle" = "line",
  stroke = "#cbd5e1",
  fill = "transparent",
  thickness = 1
): PDFObject {
  return {
    id: genId("shp"),
    type: "shape",
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 100,
    shape: {
      kind,
      stroke,
      fill,
      thickness,
    },
  };
}

export function createImageObj(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  src: string,
  alt = "Template image"
): PDFObject {
  return {
    id: genId("img"),
    type: "image",
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 100,
    image: {
      src,
      alt,
    },
  };
}

function createBlankPage(pageIndex: number, width = 612, height = 792): PDFPage {
  return {
    id: `page_${pageIndex + 1}_${Date.now()}`,
    index: pageIndex,
    label: `Page ${pageIndex + 1}`,
    rotation: 0,
    width,
    height,
    template: -1,
    type: "blank",
    objects: [],
  };
}

function createTemplateDoc(
  id: string,
  name: string,
  pages: PDFPage[],
  pageSize: "A4" | "Letter" | "Legal" = "Letter",
  orientation: "Portrait" | "Landscape" = "Portrait"
): PDFDocument {
  return {
    id,
    fileName: `${name.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`,
    name,
    pageSize,
    orientation,
    pages,
    textOverrides: {},
    textColorOverrides: {},
    textBgOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 1. Modern SaaS Product Landing Page (One-Pager)
// ---------------------------------------------------------------------------
function buildSaasLandingDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Hero Backdrop
  objs.push(createShapeObj(pid, 24, 24, 564, 255, "rectangle", "#312e81", "#0f172a", 1));
  objs.push(createShapeObj(pid, 24, 24, 564, 5, "rectangle", "#6366f1", "#6366f1", 0));

  // Badge pill
  objs.push(createShapeObj(pid, 44, 40, 195, 20, "rectangle", "#818cf8", "#1e1b4b", 1));
  objs.push(
    createTextObj(pid, 50, 43, 185, 16, "✦ NEXT-GEN AI WORKSPACE", {
      fontSize: 8.5,
      bold: true,
      color: "#a5b4fc",
    })
  );

  // Hero Headline & Subhead
  objs.push(
    createTextObj(pid, 44, 68, 310, 50, "Accelerate Cloud Engineering 10x Faster", {
      fontSize: 18,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      44,
      120,
      310,
      45,
      "The all-in-one developer platform to design, simulate, and deploy microservices with autonomous AI agents and instant verification.",
      {
        fontSize: 9,
        color: "#cbd5e1",
      }
    )
  );

  // CTAs
  objs.push(createShapeObj(pid, 44, 168, 125, 28, "rectangle", "#4f46e5", "#4f46e5", 0));
  objs.push(
    createTextObj(pid, 48, 174, 117, 20, "Start Free Trial →", {
      fontSize: 10,
      bold: true,
      color: "#ffffff",
      align: "center",
    })
  );
  objs.push(createShapeObj(pid, 178, 168, 115, 28, "rectangle", "#475569", "#1e293b", 1));
  objs.push(
    createTextObj(pid, 182, 174, 107, 20, "Live Interactive Demo", {
      fontSize: 9.5,
      color: "#e2e8f0",
      align: "center",
    })
  );

  // Embedded Dashboard Mockup
  objs.push(createImageObj(pid, 365, 42, 205, 125, TEMPLATE_DASHBOARD_PNG, "SaaS Dashboard Preview"));

  // Social Proof Stats Bar inside Hero
  objs.push(createShapeObj(pid, 44, 210, 524, 48, "rectangle", "#334155", "#1e293b", 1));
  objs.push(
    createTextObj(pid, 58, 216, 130, 20, "99.99% Uptime", {
      fontSize: 12,
      bold: true,
      color: "#38bdf8",
    })
  );
  objs.push(
    createTextObj(pid, 58, 236, 130, 16, "Multi-Region SLA Guarantee", {
      fontSize: 7.5,
      color: "#94a3b8",
    })
  );

  objs.push(
    createTextObj(pid, 240, 216, 130, 20, "10M+ Events/Sec", {
      fontSize: 12,
      bold: true,
      color: "#a855f7",
    })
  );
  objs.push(
    createTextObj(pid, 240, 236, 130, 16, "Sub-millisecond latency pipeline", {
      fontSize: 7.5,
      color: "#94a3b8",
    })
  );

  objs.push(
    createTextObj(pid, 410, 216, 130, 20, "SOC-2 Type II", {
      fontSize: 12,
      bold: true,
      color: "#22c55e",
    })
  );
  objs.push(
    createTextObj(pid, 410, 236, 130, 16, "Zero-Trust automated encryption", {
      fontSize: 7.5,
      color: "#94a3b8",
    })
  );

  // Section: 3 Feature Cards
  objs.push(
    createTextObj(pid, 24, 298, 564, 20, "ENGINEERED FOR MODERN ENTERPRISE SCALE", {
      fontSize: 12,
      bold: true,
      color: "#0f172a",
    })
  );
  objs.push(
    createTextObj(
      pid,
      24,
      320,
      564,
      16,
      "Everything modern software architects and DevOps teams need in one unified control plane.",
      {
        fontSize: 9,
        color: "#64748b",
      }
    )
  );

  // Card 1
  objs.push(createShapeObj(pid, 24, 345, 176, 185, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(createShapeObj(pid, 24, 345, 176, 4, "rectangle", "#3b82f6", "#3b82f6", 0));
  objs.push(
    createTextObj(pid, 36, 360, 152, 20, "⚡ Instant Replication", {
      fontSize: 11,
      bold: true,
      color: "#1e293b",
    })
  );
  objs.push(
    createTextObj(
      pid,
      36,
      386,
      152,
      130,
      "Automatic state synchronization across global clusters with conflict-free replicated data types and zero data loss.",
      {
        fontSize: 8.5,
        color: "#475569",
      }
    )
  );

  // Card 2
  objs.push(createShapeObj(pid, 218, 345, 176, 185, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(createShapeObj(pid, 218, 345, 176, 4, "rectangle", "#8b5cf6", "#8b5cf6", 0));
  objs.push(
    createTextObj(pid, 230, 360, 152, 20, "🛡️ Zero-Trust Security", {
      fontSize: 11,
      bold: true,
      color: "#1e293b",
    })
  );
  objs.push(
    createTextObj(
      pid,
      230,
      386,
      152,
      130,
      "Mutual TLS authentication between all microservices, granular role-based access control, and automated compliance reports.",
      {
        fontSize: 8.5,
        color: "#475569",
      }
    )
  );

  // Card 3
  objs.push(createShapeObj(pid, 412, 345, 176, 185, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(createShapeObj(pid, 412, 345, 176, 4, "rectangle", "#10b981", "#10b981", 0));
  objs.push(
    createTextObj(pid, 424, 360, 152, 20, "🤖 Autonomous Copilots", {
      fontSize: 11,
      bold: true,
      color: "#1e293b",
    })
  );
  objs.push(
    createTextObj(
      pid,
      424,
      386,
      152,
      130,
      "AI copilots that detect performance regressions, generate synthetic test suites, and auto-tune database indexes in staging.",
      {
        fontSize: 8.5,
        color: "#475569",
      }
    )
  );

  // Testimonial Card
  objs.push(createShapeObj(pid, 24, 548, 564, 85, "rectangle", "#cbd5e1", "#f8fafc", 1));
  objs.push(createShapeObj(pid, 24, 548, 5, 85, "rectangle", "#4f46e5", "#4f46e5", 0));
  objs.push(
    createTextObj(
      pid,
      42,
      562,
      526,
      40,
      "\"Deploying our cloud infrastructure with this platform shortened our quarterly release cycle from 3 weeks to under 4 hours. It transformed how our 200+ engineers ship software.\"",
      {
        fontSize: 9,
        italic: true,
        color: "#334155",
      }
    )
  );
  objs.push(
    createTextObj(
      pid,
      42,
      608,
      526,
      16,
      "— Alex Reynolds, Principal Architect at HyperScale Networks",
      {
        fontSize: 8.5,
        bold: true,
        color: "#1e293b",
      }
    )
  );

  // Bottom CTA Banner
  objs.push(createShapeObj(pid, 24, 650, 564, 90, "rectangle", "#4338ca", "#312e81", 1));
  objs.push(
    createTextObj(pid, 44, 668, 360, 24, "Ready to supercharge your cloud engineering?", {
      fontSize: 13,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      44,
      696,
      360,
      20,
      "Get started in 5 minutes with our pre-built infrastructure templates.",
      {
        fontSize: 8.5,
        color: "#c7d2fe",
      }
    )
  );
  objs.push(createShapeObj(pid, 420, 678, 145, 34, "rectangle", "#ffffff", "#ffffff", 0));
  objs.push(
    createTextObj(pid, 425, 688, 135, 18, "Get Started Free", {
      fontSize: 10,
      bold: true,
      color: "#312e81",
      align: "center",
    })
  );

  p1.objects = objs;
  return {
    id: `doc_saas_landing_${Date.now()}`,
    name: "SaaS Product Landing Page",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 2. Cloud Microservices System Architecture Blueprint
// ---------------------------------------------------------------------------
function buildArchitectureDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Deep dark blueprint frame
  objs.push(createShapeObj(pid, 18, 18, 576, 756, "rectangle", "#1e293b", "#0b0f19", 1));
  objs.push(createShapeObj(pid, 18, 18, 576, 5, "rectangle", "#38bdf8", "#0284c7", 0));

  // Blueprint title & metadata
  objs.push(
    createTextObj(pid, 36, 32, 400, 14, "SYSTEM ARCHITECTURE BLUEPRINT  •  CONFIDENTIAL", {
      fontSize: 8,
      bold: true,
      color: "#38bdf8",
    })
  );
  objs.push(
    createTextObj(pid, 36, 50, 520, 24, "Distributed Event Streaming Architecture v3.2", {
      fontSize: 16,
      bold: true,
      color: "#f8fafc",
    })
  );
  objs.push(
    createTextObj(
      pid,
      36,
      76,
      540,
      18,
      "Multi-Region Mesh with Kafka Event Sourcing, Kubernetes Compute, and Sub-15ms Read Latency",
      {
        fontSize: 8.5,
        color: "#94a3b8",
      }
    )
  );

  // Spec Metrics Badges
  objs.push(createShapeObj(pid, 36, 100, 125, 26, "rectangle", "#334155", "#111827", 1));
  objs.push(
    createTextObj(pid, 42, 106, 113, 16, "Latency: <15ms p99", {
      fontSize: 8,
      bold: true,
      color: "#38bdf8",
      align: "center",
    })
  );

  objs.push(createShapeObj(pid, 172, 100, 125, 26, "rectangle", "#334155", "#111827", 1));
  objs.push(
    createTextObj(pid, 178, 106, 113, 16, "SLA: 99.999% Multi-AZ", {
      fontSize: 8,
      bold: true,
      color: "#22c55e",
      align: "center",
    })
  );

  objs.push(createShapeObj(pid, 308, 100, 125, 26, "rectangle", "#334155", "#111827", 1));
  objs.push(
    createTextObj(pid, 314, 106, 113, 16, "Throughput: 150k msg/s", {
      fontSize: 8,
      bold: true,
      color: "#a855f7",
      align: "center",
    })
  );

  objs.push(createShapeObj(pid, 444, 100, 130, 26, "rectangle", "#334155", "#111827", 1));
  objs.push(
    createTextObj(pid, 450, 106, 118, 16, "Security: mTLS & RBAC", {
      fontSize: 8,
      bold: true,
      color: "#f59e0b",
      align: "center",
    })
  );

  // Embedded Architecture Diagram
  objs.push(createShapeObj(pid, 36, 138, 540, 205, "rectangle", "#38bdf8", "#0f172a", 1));
  objs.push(
    createImageObj(pid, 40, 142, 532, 197, TEMPLATE_ARCHITECTURE_PNG, "System Architecture Schematic")
  );

  // Infrastructure Breakdown Header
  objs.push(
    createTextObj(pid, 36, 355, 450, 18, "INFRASTRUCTURE SPECIFICATIONS & COMPONENT TIERS", {
      fontSize: 10,
      bold: true,
      color: "#38bdf8",
    })
  );

  // Tier 1
  objs.push(createShapeObj(pid, 36, 380, 260, 115, "rectangle", "#1e293b", "#111827", 1));
  objs.push(createShapeObj(pid, 36, 380, 4, 115, "rectangle", "#3b82f6", "#3b82f6", 0));
  objs.push(
    createTextObj(pid, 48, 390, 240, 18, "Tier 1: Edge & Ingress Gateway", {
      fontSize: 9.5,
      bold: true,
      color: "#60a5fa",
    })
  );
  objs.push(
    createTextObj(
      pid,
      48,
      412,
      240,
      75,
      "• Cloudflare Anycast CDN with DDoS mitigation\n• Envoy API Gateway handling JWT validation\n• Global rate limiting via Redis token bucket\n• TLS 1.3 termination with HTTP/3 support",
      { fontSize: 7.5, color: "#94a3b8" }
    )
  );

  // Tier 2
  objs.push(createShapeObj(pid, 314, 380, 260, 115, "rectangle", "#1e293b", "#111827", 1));
  objs.push(createShapeObj(pid, 314, 380, 4, 115, "rectangle", "#8b5cf6", "#8b5cf6", 0));
  objs.push(
    createTextObj(pid, 326, 390, 240, 18, "Tier 2: Service Mesh & Compute", {
      fontSize: 9.5,
      bold: true,
      color: "#c084fc",
    })
  );
  objs.push(
    createTextObj(
      pid,
      326,
      412,
      240,
      75,
      "• Kubernetes (EKS) auto-scaling node pools\n• Istio service mesh enforcing mTLS encryption\n• Go & Rust microservices with gRPC transport\n• OpenTelemetry distributed tracing instrumentation",
      { fontSize: 7.5, color: "#94a3b8" }
    )
  );

  // Tier 3
  objs.push(createShapeObj(pid, 36, 506, 260, 115, "rectangle", "#1e293b", "#111827", 1));
  objs.push(createShapeObj(pid, 36, 506, 4, 115, "rectangle", "#f97316", "#f97316", 0));
  objs.push(
    createTextObj(pid, 48, 516, 240, 18, "Tier 3: Distributed Event Stream", {
      fontSize: 9.5,
      bold: true,
      color: "#fb923c",
    })
  );
  objs.push(
    createTextObj(
      pid,
      48,
      538,
      240,
      75,
      "• Apache Kafka 3-node multi-broker cluster\n• Confluent Schema Registry for protobuf contracts\n• Flink real-time streaming stateful calculations\n• Dead-letter queues with automated replay triage",
      { fontSize: 7.5, color: "#94a3b8" }
    )
  );

  // Tier 4
  objs.push(createShapeObj(pid, 314, 506, 260, 115, "rectangle", "#1e293b", "#111827", 1));
  objs.push(createShapeObj(pid, 314, 506, 4, 115, "rectangle", "#10b981", "#10b981", 0));
  objs.push(
    createTextObj(pid, 326, 516, 240, 18, "Tier 4: Distributed Persistence", {
      fontSize: 9.5,
      bold: true,
      color: "#34d399",
    })
  );
  objs.push(
    createTextObj(
      pid,
      326,
      538,
      240,
      75,
      "• CockroachDB distributed relational SQL\n• Redis Cluster for sub-millisecond session caching\n• AWS S3 immutable cold storage parquet logs\n• Automated continuous snapshotting & recovery tests",
      { fontSize: 7.5, color: "#94a3b8" }
    )
  );

  // Disaster Recovery Protocol Card
  objs.push(createShapeObj(pid, 36, 632, 538, 70, "rectangle", "#334155", "#1e293b", 1));
  objs.push(
    createTextObj(pid, 48, 640, 514, 16, "DISASTER RECOVERY & COMPLIANCE VERIFICATION", {
      fontSize: 8,
      bold: true,
      color: "#38bdf8",
    })
  );
  objs.push(
    createTextObj(
      pid,
      48,
      658,
      514,
      38,
      "RPO (Recovery Point Objective): < 1 second across regional replicas.\nRTO (Recovery Time Objective): Automated failover in under 45 seconds without operator intervention. Certified SOC2 Type II and ISO 27001.",
      { fontSize: 7.5, color: "#cbd5e1" }
    )
  );

  objs.push(
    createTextObj(
      pid,
      36,
      720,
      538,
      16,
      "Architecture Review Board • Approved by Chief Cloud Architect • Document Hash: #SYS-8904-REV3",
      { fontSize: 7, color: "#64748b", align: "center" }
    )
  );

  p1.objects = objs;
  return {
    id: `doc_arch_cloud_${Date.now()}`,
    name: "Cloud System Architecture Blueprint",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 3. Global AI Summit Keynote Banner & Event Poster
// ---------------------------------------------------------------------------
function buildKeynoteBannerDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Deep Radiant Background
  objs.push(createShapeObj(pid, 18, 18, 576, 756, "rectangle", "#4a044e", "#1e0427", 1));

  // Vibrant Banner Header
  objs.push(createShapeObj(pid, 18, 18, 576, 255, "rectangle", "#be185d", "#581c87", 1));

  // Conference Tag Pill
  objs.push(createShapeObj(pid, 36, 36, 210, 22, "rectangle", "#f43f5e", "#881337", 1));
  objs.push(
    createTextObj(pid, 40, 41, 202, 16, "✦ ANNUAL FLAGSHIP TECH SUMMIT ✦", {
      fontSize: 8,
      bold: true,
      color: "#ffe4e6",
      align: "center",
    })
  );

  // Huge Title
  objs.push(
    createTextObj(pid, 36, 68, 530, 48, "GLOBAL AI & CLOUD SUMMIT 2026", {
      fontSize: 22,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      36,
      120,
      530,
      22,
      "The Next Frontier of Intelligent Systems, Frontier Models & Quantum Compute",
      {
        fontSize: 10.5,
        color: "#fbcfe8",
      }
    )
  );

  // Date & Venue Ribbon
  objs.push(createShapeObj(pid, 36, 155, 530, 36, "rectangle", "#fda4af", "#9d174d", 1));
  objs.push(
    createTextObj(
      pid,
      46,
      165,
      510,
      20,
      "📅 OCTOBER 14–16, 2026  •  MOSCONE CENTER, SAN FRANCISCO & VIRTUAL STREAM",
      {
        fontSize: 9.5,
        bold: true,
        color: "#ffffff",
        align: "center",
      }
    )
  );

  // Registration Pill
  objs.push(createShapeObj(pid, 36, 205, 170, 28, "rectangle", "#fb7185", "#e11d48", 0));
  objs.push(
    createTextObj(pid, 40, 212, 162, 18, "EARLY BIRD REGISTRATION OPEN", {
      fontSize: 8.5,
      bold: true,
      color: "#ffffff",
      align: "center",
    })
  );

  // Keynote Speaker Spotlight Card
  objs.push(createShapeObj(pid, 36, 290, 530, 160, "rectangle", "#701a75", "#2e1065", 1));
  objs.push(createImageObj(pid, 52, 310, 115, 115, TEMPLATE_SPEAKER_PNG, "Keynote Speaker Portrait"));

  objs.push(
    createTextObj(pid, 186, 305, 360, 16, "OPENING KEYNOTE SPEAKER", {
      fontSize: 8.5,
      bold: true,
      color: "#f472b6",
    })
  );
  objs.push(
    createTextObj(pid, 186, 325, 360, 24, "Dr. Elena Rostova", {
      fontSize: 17,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(pid, 186, 352, 360, 18, "Chief AI Scientist at Synthetix Labs • Ex-DeepMind Research Lead", {
      fontSize: 9.5,
      color: "#e9d5ff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      186,
      375,
      360,
      36,
      "Keynote Topic: Autonomous Reasoning Agents & the Future of Production Software Architecture",
      {
        fontSize: 9.5,
        bold: true,
        color: "#fbcfe8",
      }
    )
  );
  objs.push(
    createTextObj(
      pid,
      186,
      414,
      360,
      28,
      "Author of 40+ peer-reviewed papers on neural algorithmic reasoning and foundational LLMs.",
      {
        fontSize: 8,
        color: "#cbd5e1",
      }
    )
  );

  // Conference Tracks Grid
  objs.push(createShapeObj(pid, 36, 465, 166, 125, "rectangle", "#6b21a8", "#3b0764", 1));
  objs.push(
    createTextObj(pid, 46, 478, 146, 18, "🤖 Track A: AI & LLMs", {
      fontSize: 10,
      bold: true,
      color: "#f472b6",
    })
  );
  objs.push(
    createTextObj(
      pid,
      46,
      502,
      146,
      80,
      "Prompt distillation, continuous inference pipelines, agentic orchestration, and hardware accelerators.",
      { fontSize: 7.5, color: "#e9d5ff" }
    )
  );

  objs.push(createShapeObj(pid, 218, 465, 166, 125, "rectangle", "#6b21a8", "#3b0764", 1));
  objs.push(
    createTextObj(pid, 228, 478, 146, 18, "☁️ Track B: Cloud & Scale", {
      fontSize: 10,
      bold: true,
      color: "#38bdf8",
    })
  );
  objs.push(
    createTextObj(
      pid,
      228,
      502,
      146,
      80,
      "Multi-cloud Kubernetes federation, zero-egress architecture, and global database partition strategies.",
      { fontSize: 7.5, color: "#e9d5ff" }
    )
  );

  objs.push(createShapeObj(pid, 400, 465, 166, 125, "rectangle", "#6b21a8", "#3b0764", 1));
  objs.push(
    createTextObj(pid, 410, 478, 146, 18, "🛡️ Track C: Security", {
      fontSize: 10,
      bold: true,
      color: "#34d399",
    })
  );
  objs.push(
    createTextObj(
      pid,
      410,
      502,
      146,
      80,
      "Post-quantum cryptography, AI red-teaming, supply chain integrity, and automated incident triage.",
      { fontSize: 7.5, color: "#e9d5ff" }
    )
  );

  // Registration Callout Box
  objs.push(createShapeObj(pid, 36, 605, 530, 95, "rectangle", "#db2777", "#831843", 1));
  objs.push(
    createTextObj(pid, 54, 620, 320, 22, "Claim Your In-Person or Digital Pass", {
      fontSize: 13,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      54,
      646,
      320,
      36,
      "Join 5,000+ technology leaders, principal engineers, and startup founders. Special 30% group discounts for engineering teams.",
      {
        fontSize: 8,
        color: "#fce7f3",
      }
    )
  );
  objs.push(createShapeObj(pid, 395, 632, 150, 36, "rectangle", "#ffffff", "#ffffff", 0));
  objs.push(
    createTextObj(pid, 400, 642, 140, 18, "REGISTER TODAY →", {
      fontSize: 9.5,
      bold: true,
      color: "#831843",
      align: "center",
    })
  );

  objs.push(
    createTextObj(
      pid,
      36,
      720,
      530,
      18,
      "PREMIER SPONSORS:  HYPERSCALE CLOUD  •  APEX AI  •  NEURONET SYSTEMS  •  SYNTHETIX LABS",
      { fontSize: 7.5, color: "#e9d5ff", align: "center" }
    )
  );

  p1.objects = objs;
  return {
    id: `doc_banner_keynote_${Date.now()}`,
    name: "AI Summit Keynote Banner & Poster",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 4. Product Launch Announcement Banner
// ---------------------------------------------------------------------------
function buildLaunchBannerDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Gradient Top Bar
  objs.push(createShapeObj(pid, 24, 24, 564, 8, "rectangle", "#0284c7", "#0284c7", 0));

  // Logo & Header
  objs.push(createImageObj(pid, 24, 46, 50, 50, TEMPLATE_LOGO_PNG, "Brand Logo"));
  objs.push(
    createTextObj(pid, 85, 48, 400, 24, "NEXUS TECHNOLOGY CORP", {
      fontSize: 12,
      bold: true,
      color: "#0f172a",
    })
  );
  objs.push(
    createTextObj(pid, 85, 72, 400, 16, "Official Major Version Announcement • Release 4.0", {
      fontSize: 8.5,
      color: "#64748b",
    })
  );

  // Big Hero Card
  objs.push(createShapeObj(pid, 24, 115, 564, 230, "rectangle", "#0284c7", "#0369a1", 1));
  objs.push(
    createTextObj(pid, 48, 140, 516, 32, "INTRODUCING NEXUS ENGINE 4.0", {
      fontSize: 22,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      48,
      178,
      516,
      40,
      "A completely re-architected execution runtime delivering 4.2x higher throughput, sub-millisecond cold starts, and 60% reduced memory footprint.",
      {
        fontSize: 10,
        color: "#e0f2fe",
      }
    )
  );

  // 3 Highlight Badges inside Hero
  objs.push(createShapeObj(pid, 48, 236, 160, 48, "rectangle", "#38bdf8", "#075985", 1));
  objs.push(
    createTextObj(pid, 54, 244, 148, 18, "🚀 4.2x Faster Runtime", {
      fontSize: 9.5,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(pid, 54, 264, 148, 14, "Benchmarked on Linux x86_64", {
      fontSize: 7.5,
      color: "#bae6fd",
    })
  );

  objs.push(createShapeObj(pid, 226, 236, 160, 48, "rectangle", "#38bdf8", "#075985", 1));
  objs.push(
    createTextObj(pid, 232, 244, 148, 18, "📉 60% Less RAM", {
      fontSize: 9.5,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(pid, 232, 264, 148, 14, "Zero-copy buffer allocation", {
      fontSize: 7.5,
      color: "#bae6fd",
    })
  );

  objs.push(createShapeObj(pid, 404, 236, 160, 48, "rectangle", "#38bdf8", "#075985", 1));
  objs.push(
    createTextObj(pid, 410, 244, 148, 18, "⚡ Instant Hot-Reload", {
      fontSize: 9.5,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(pid, 410, 264, 148, 14, "Under 25ms state refresh", {
      fontSize: 7.5,
      color: "#bae6fd",
    })
  );

  // Release CTA
  objs.push(createShapeObj(pid, 48, 298, 180, 30, "rectangle", "#ffffff", "#ffffff", 0));
  objs.push(
    createTextObj(pid, 52, 305, 172, 18, "Download Developer SDK →", {
      fontSize: 9,
      bold: true,
      color: "#0369a1",
      align: "center",
    })
  );

  // Section: Core Architectural Innovations
  objs.push(
    createTextObj(pid, 24, 375, 564, 20, "CORE ARCHITECTURAL INNOVATIONS", {
      fontSize: 12,
      bold: true,
      color: "#0f172a",
    })
  );

  objs.push(createShapeObj(pid, 24, 405, 564, 90, "rectangle", "#e2e8f0", "#f8fafc", 1));
  objs.push(
    createTextObj(pid, 40, 418, 532, 18, "1. JIT Compilation with LLVM 18 Integration", {
      fontSize: 10,
      bold: true,
      color: "#0369a1",
    })
  );
  objs.push(
    createTextObj(
      pid,
      40,
      440,
      532,
      45,
      "Transforms dynamic bytecode into optimized native machine code on the fly. Automatically optimizes hot loops with SIMD vectorization across AVX-512 and ARM Neon architectures.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 24, 510, 564, 90, "rectangle", "#e2e8f0", "#f8fafc", 1));
  objs.push(
    createTextObj(pid, 40, 523, 532, 18, "2. Native WebAssembly & Edge Sandboxing", {
      fontSize: 10,
      bold: true,
      color: "#0369a1",
    })
  );
  objs.push(
    createTextObj(
      pid,
      40,
      545,
      532,
      45,
      "Run untrusted tenant code with micro-second isolation boundaries. Built-in WASI preview 2 support enables direct filesystem streaming without virtualization overhead.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 24, 615, 564, 90, "rectangle", "#e2e8f0", "#f8fafc", 1));
  objs.push(
    createTextObj(pid, 40, 628, 532, 18, "3. Distributed State Engine & Raft Consensus", {
      fontSize: 10,
      bold: true,
      color: "#0369a1",
    })
  );
  objs.push(
    createTextObj(
      pid,
      40,
      650,
      532,
      45,
      "Zero-configuration cluster formation. Nodes automatically discover peers via mDNS or cloud metadata services with automatic leader election and log compaction.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  objs.push(
    createTextObj(
      pid,
      24,
      725,
      564,
      18,
      "Nexus 4.0 is available under Apache 2.0 license • Documentation: https://nexus-runtime.org/v4",
      { fontSize: 8, color: "#64748b", align: "center" }
    )
  );

  p1.objects = objs;
  return {
    id: `doc_banner_launch_${Date.now()}`,
    name: "Product Launch Announcement Banner",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 4b. Enterprise Executive Partner Circle Banner & Flyer (PRO EXCLUSIVE)
// ---------------------------------------------------------------------------
function buildExecutivePartnerBannerDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // 1. Premium Clean Canvas with subtle warm tone
  objs.push(createShapeObj(pid, 18, 18, 576, 756, "rectangle", "#fed7aa", "#fffaf5", 1));

  // 2. Top Header Brand Bar (Logo + 27 Years)
  // Logo text & emblem
  objs.push(createShapeObj(pid, 36, 32, 14, 14, "rectangle", "#ea580c", "#ea580c", 0));
  objs.push(
    createTextObj(pid, 56, 30, 110, 16, "netsmartz", {
      fontSize: 14,
      bold: true,
      color: "#0f172a",
    })
  );
  objs.push(
    createTextObj(pid, 56, 44, 90, 12, "SINCE 1999", {
      fontSize: 6.5,
      bold: true,
      color: "#94a3b8",
    })
  );

  // 27 Years Badge
  objs.push(
    createTextObj(pid, 168, 28, 40, 26, "27", {
      fontSize: 22,
      bold: true,
      color: "#ea580c",
    })
  );
  objs.push(
    createTextObj(pid, 204, 30, 80, 22, "CELEBRATING\nYears", {
      fontSize: 7.5,
      bold: true,
      color: "#64748b",
    })
  );

  // 3. Hero Section Title & Mission (Left side: x: 36, w: 270)
  objs.push(
    createTextObj(pid, 36, 68, 270, 36, "Netsmartz", {
      fontSize: 32,
      bold: true,
      color: "#0f172a",
    })
  );
  objs.push(
    createTextObj(pid, 36, 102, 270, 42, "Circle", {
      fontSize: 38,
      bold: true,
      color: "#ea580c",
    })
  );
  // Radiant burst accent marks near Circle
  objs.push(createShapeObj(pid, 155, 106, 12, 2, "line", "#ea580c", "#ea580c", 2));
  objs.push(createShapeObj(pid, 160, 114, 10, 2, "line", "#ea580c", "#ea580c", 2));
  objs.push(createShapeObj(pid, 153, 122, 12, 2, "line", "#ea580c", "#ea580c", 2));

  // Executive Description
  objs.push(
    createTextObj(
      pid,
      36,
      148,
      270,
      44,
      "We connect you with other Netsmartz customers when we identify a potential business fit -- helping you discover new customers, partners, suppliers and opportunities.",
      {
        fontSize: 8.5,
        bold: false,
        color: "#1e293b",
      }
    )
  );
  objs.push(
    createTextObj(
      pid,
      36,
      194,
      270,
      40,
      "This initiative leverages our existing customer network to identify business opportunities between our customers and for our customers.",
      {
        fontSize: 7.5,
        bold: false,
        color: "#64748b",
      }
    )
  );

  // 4. Hero Visual: Partnership Handshake at Sunset (Right side: x: 320 to 566)
  // Background glowing aura for hero
  objs.push(createShapeObj(pid, 330, 28, 240, 206, "circle", "#fdba74", "#ffedd5", 1));
  // Handshake photo
  objs.push(
    createImageObj(
      pid,
      365,
      38,
      195,
      165,
      TEMPLATE_PARTNERSHIP_JPG,
      "Executive Corporate Handshake at Sunset"
    )
  );

  // Orbiting Pillars badges around handshake photo
  // Pill 1: Exchange Ideas
  objs.push(createShapeObj(pid, 314, 52, 68, 22, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 316, 55, 64, 16, "Exchange Ideas", {
      fontSize: 6.5,
      bold: true,
      color: "#c2410c",
      align: "center",
    })
  );

  // Pill 2: Explore Partnerships
  objs.push(createShapeObj(pid, 410, 24, 76, 22, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 412, 27, 72, 16, "Explore Partnerships", {
      fontSize: 6.5,
      bold: true,
      color: "#c2410c",
      align: "center",
    })
  );

  // Pill 3: Discover Opportunities
  objs.push(createShapeObj(pid, 480, 68, 86, 22, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 482, 71, 82, 16, "Discover Opportunities", {
      fontSize: 6.5,
      bold: true,
      color: "#c2410c",
      align: "center",
    })
  );

  // Pill 4: Build Connections
  objs.push(createShapeObj(pid, 484, 142, 82, 22, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 486, 145, 78, 16, "Build Connections", {
      fontSize: 6.5,
      bold: true,
      color: "#c2410c",
      align: "center",
    })
  );

  // -------------------------------------------------------------------------
  // SECTION 1: How Netsmartz Circle works (4 Cards)
  // -------------------------------------------------------------------------
  // Orange Pill Banner
  objs.push(createShapeObj(pid, 36, 242, 215, 22, "rectangle", "#ea580c", "#ea580c", 0));
  objs.push(
    createTextObj(pid, 46, 246, 195, 14, "How Netsmartz Circle works", {
      fontSize: 9.5,
      bold: true,
      color: "#ffffff",
    })
  );

  // Card 1
  objs.push(createShapeObj(pid, 36, 268, 126, 130, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 85, 276, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 85, 283, 28, 14, "01", { fontSize: 9, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 42, 310, 114, 24, "We understand\nyour business", { fontSize: 8, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 42, 338, 114, 52, "We learn about your business, capabilities, products, services and the kind of opportunities you are looking for.", { fontSize: 6.5, color: "#475569", align: "center" }));

  // Card 2
  objs.push(createShapeObj(pid, 172, 268, 126, 130, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 221, 276, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 221, 283, 28, 14, "02", { fontSize: 9, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 178, 310, 114, 24, "We identify\npotential matches", { fontSize: 8, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 178, 338, 114, 52, "We look across our network of Netsmartz clients to find businesses where there could be a relevant commercial connection.", { fontSize: 6.5, color: "#475569", align: "center" }));

  // Card 3
  objs.push(createShapeObj(pid, 308, 268, 126, 130, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 357, 276, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 357, 283, 28, 14, "03", { fontSize: 9, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 314, 310, 114, 24, "We make the\nintroduction", { fontSize: 8, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 314, 338, 114, 52, "If we identify a potential fit, we approach you first and seek your approval before making an introduction.", { fontSize: 6.5, color: "#475569", align: "center" }));

  // Card 4
  objs.push(createShapeObj(pid, 444, 268, 126, 130, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 493, 276, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 493, 283, 28, 14, "04", { fontSize: 9, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 450, 310, 114, 24, "You take the\nconversation forward", { fontSize: 8, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 450, 338, 114, 52, "Once introduced, you decide whether to collaborate, buy, sell, partner or work together. We are simply the matchmaker.", { fontSize: 6.5, color: "#475569", align: "center" }));

  // -------------------------------------------------------------------------
  // SECTION 2: What can you discover through Netsmartz Circle? (3 Cards)
  // -------------------------------------------------------------------------
  // Orange Pill Banner
  objs.push(createShapeObj(pid, 36, 408, 285, 22, "rectangle", "#ea580c", "#ea580c", 0));
  objs.push(
    createTextObj(pid, 46, 412, 265, 14, "What can you discover through Netsmartz Circle?", {
      fontSize: 9.5,
      bold: true,
      color: "#ffffff",
    })
  );

  // Card 1: New Customers and market
  objs.push(createShapeObj(pid, 36, 434, 172, 105, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 108, 442, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 108, 449, 28, 14, "A", { fontSize: 9.5, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 42, 474, 160, 16, "New Customers and Market", { fontSize: 8.5, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 42, 492, 160, 40, "Get introduced to businesses from our existing client network that may need your products or services.", { fontSize: 7, color: "#475569", align: "center" }));

  // Card 2: Business Partnerships and Growth
  objs.push(createShapeObj(pid, 218, 434, 172, 105, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 290, 442, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 290, 449, 28, 14, "B", { fontSize: 9.5, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 224, 474, 160, 16, "Partnerships and Growth", { fontSize: 8.5, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 224, 492, 160, 40, "Discover companies with complementary capabilities that could create high-value partnership opportunities.", { fontSize: 7, color: "#475569", align: "center" }));

  // Card 3: New Suppliers & Vendors
  objs.push(createShapeObj(pid, 400, 434, 172, 105, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 472, 442, 28, 28, "circle", "#fdba74", "#ffedd5", 1));
  objs.push(createTextObj(pid, 472, 449, 28, 14, "C", { fontSize: 9.5, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 406, 474, 160, 16, "New Suppliers & Vendors", { fontSize: 8.5, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 406, 492, 160, 40, "Connect with trusted businesses within the Netsmartz network to drive mutual value and reliability.", { fontSize: 7, color: "#475569", align: "center" }));

  // -------------------------------------------------------------------------
  // SECTION 3: A few things to know (2 Wide Trust Cards)
  // -------------------------------------------------------------------------
  // Orange Pill Banner
  objs.push(createShapeObj(pid, 36, 549, 180, 22, "rectangle", "#ea580c", "#ea580c", 0));
  objs.push(
    createTextObj(pid, 46, 553, 160, 14, "A few things to know", {
      fontSize: 9.5,
      bold: true,
      color: "#ffffff",
    })
  );

  // Trust Card 1: Your approval comes first
  objs.push(createShapeObj(pid, 36, 575, 260, 96, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 48, 588, 28, 28, "circle", "#fed7aa", "#ffedd5", 1));
  objs.push(createTextObj(pid, 48, 595, 28, 14, "[OK]", { fontSize: 7, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 84, 584, 202, 16, "Your approval comes first.", { fontSize: 9, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 84, 602, 202, 60, "Your information stays strictly private. We will only make an introduction after your direct and explicit approval.", { fontSize: 7.5, color: "#475569" }));

  // Trust Card 2: There is no referral fee or cut
  objs.push(createShapeObj(pid, 308, 575, 262, 96, "rectangle", "#fed7aa", "#ffffff", 1));
  objs.push(createShapeObj(pid, 320, 588, 28, 28, "circle", "#fed7aa", "#ffedd5", 1));
  objs.push(createTextObj(pid, 320, 595, 28, 14, "[0%]", { fontSize: 7, bold: true, color: "#ea580c", align: "center" }));
  objs.push(createTextObj(pid, 356, 584, 204, 16, "There is no referral fee or cut", { fontSize: 9, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 356, 602, 204, 60, "This is a completely free initiative for our clients. Netsmartz will not charge any cut for making a connection or from resulting business.", { fontSize: 7.5, color: "#475569" }));

  // -------------------------------------------------------------------------
  // Bottom Callout / Executive Sign-off
  // -------------------------------------------------------------------------
  objs.push(createShapeObj(pid, 36, 681, 534, 48, "rectangle", "#fdba74", "#fff7ed", 1));
  objs.push(createTextObj(pid, 48, 688, 510, 16, "READY TO GROW YOUR BUSINESS NETWORK WITH TRUSTED PEERS?", { fontSize: 8.5, bold: true, color: "#c2410c", align: "center" }));
  objs.push(createTextObj(pid, 48, 706, 510, 14, "Contact your Account Manager or email circle@netsmartz.com | www.netsmartz.com | 1-888-666-8888", { fontSize: 7.5, color: "#475569", align: "center" }));

  objs.push(createTextObj(pid, 36, 738, 534, 14, "CONFIDENTIAL & PROPRIETARY -- NETSMARTZ CLIENT INITIATIVE 2026", { fontSize: 6.5, color: "#94a3b8", align: "center" }));

  p1.objects = objs;
  return {
    id: `doc_banner_enterprise_circle_${Date.now()}`,
    name: "Enterprise Partner Circle Flyer",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 5. Modern Gradient Corporate Invoice
// ---------------------------------------------------------------------------
function buildModernInvoiceDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Top Accent Stripe
  objs.push(createShapeObj(pid, 24, 24, 564, 6, "rectangle", "#059669", "#059669", 0));

  // Logo & Header
  objs.push(createImageObj(pid, 24, 44, 45, 45, TEMPLATE_LOGO_PNG, "Brand Logo"));
  objs.push(
    createTextObj(pid, 78, 45, 250, 20, "VERTEX SOLUTIONS INC.", {
      fontSize: 12,
      bold: true,
      color: "#0f172a",
    })
  );
  objs.push(
    createTextObj(pid, 78, 68, 250, 16, "Cloud Infrastructure & Engineering Consulting", {
      fontSize: 8.5,
      color: "#64748b",
    })
  );

  // Invoice Title & Metadata
  objs.push(
    createTextObj(pid, 400, 40, 188, 28, "INVOICE", {
      fontSize: 22,
      bold: true,
      color: "#059669",
      align: "right",
    })
  );
  objs.push(
    createTextObj(
      pid,
      350,
      70,
      238,
      40,
      "Invoice #: INV-2026-0842\nDate: October 1, 2026\nDue Date: Net 30 (Oct 31, 2026)",
      { fontSize: 8.5, color: "#475569", align: "right" }
    )
  );

  // Billed To Card
  objs.push(createShapeObj(pid, 24, 120, 564, 65, "rectangle", "#e2e8f0", "#f8fafc", 1));
  objs.push(
    createTextObj(pid, 38, 128, 260, 16, "BILLED TO:", {
      fontSize: 8,
      bold: true,
      color: "#059669",
    })
  );
  objs.push(
    createTextObj(
      pid,
      38,
      144,
      260,
      36,
      "Apex Innovations Group\nAttn: Accounts Payable\n500 Market St, Suite 1200, San Francisco, CA",
      { fontSize: 8.5, color: "#1e293b" }
    )
  );

  objs.push(
    createTextObj(pid, 340, 128, 230, 16, "PAYMENT METHOD:", {
      fontSize: 8,
      bold: true,
      color: "#059669",
    })
  );
  objs.push(
    createTextObj(
      pid,
      340,
      144,
      230,
      36,
      "Wire / ACH Transfer\nRouting: 121000358\nAccount: 9482-1049-2849",
      { fontSize: 8.5, color: "#1e293b" }
    )
  );

  // Line Items Table Header
  objs.push(createShapeObj(pid, 24, 205, 564, 26, "rectangle", "#0f172a", "#0f172a", 0));
  objs.push(
    createTextObj(pid, 36, 211, 260, 16, "DESCRIPTION", {
      fontSize: 8.5,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(pid, 320, 211, 50, 16, "HOURS", {
      fontSize: 8.5,
      bold: true,
      color: "#ffffff",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 400, 211, 70, 16, "RATE", {
      fontSize: 8.5,
      bold: true,
      color: "#ffffff",
      align: "right",
    })
  );
  objs.push(
    createTextObj(pid, 500, 211, 75, 16, "AMOUNT", {
      fontSize: 8.5,
      bold: true,
      color: "#ffffff",
      align: "right",
    })
  );

  // Row 1
  objs.push(createShapeObj(pid, 24, 233, 564, 38, "rectangle", "#f1f5f9", "#ffffff", 1));
  objs.push(
    createTextObj(
      pid,
      36,
      238,
      280,
      28,
      "Cloud Infrastructure Architecture & Setup\nMulti-region AWS EKS & Istio mesh deployment",
      { fontSize: 8.5, color: "#1e293b" }
    )
  );
  objs.push(
    createTextObj(pid, 320, 244, 50, 16, "40 hrs", {
      fontSize: 8.5,
      color: "#475569",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 400, 244, 70, 16, "$175.00", {
      fontSize: 8.5,
      color: "#475569",
      align: "right",
    })
  );
  objs.push(
    createTextObj(pid, 500, 244, 75, 16, "$7,000.00", {
      fontSize: 8.5,
      bold: true,
      color: "#0f172a",
      align: "right",
    })
  );

  // Row 2
  objs.push(createShapeObj(pid, 24, 273, 564, 38, "rectangle", "#f1f5f9", "#f8fafc", 1));
  objs.push(
    createTextObj(
      pid,
      36,
      278,
      280,
      28,
      "Frontend Application Engineering\nHigh-performance web editor and real-time state sync",
      { fontSize: 8.5, color: "#1e293b" }
    )
  );
  objs.push(
    createTextObj(pid, 320, 284, 50, 16, "80 hrs", {
      fontSize: 8.5,
      color: "#475569",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 400, 284, 70, 16, "$150.00", {
      fontSize: 8.5,
      color: "#475569",
      align: "right",
    })
  );
  objs.push(
    createTextObj(pid, 500, 284, 75, 16, "$12,000.00", {
      fontSize: 8.5,
      bold: true,
      color: "#0f172a",
      align: "right",
    })
  );

  // Row 3
  objs.push(createShapeObj(pid, 24, 313, 564, 38, "rectangle", "#f1f5f9", "#ffffff", 1));
  objs.push(
    createTextObj(
      pid,
      36,
      318,
      280,
      28,
      "Distributed Database & Cache Integration\nCockroachDB partition schema & Redis replication",
      { fontSize: 8.5, color: "#1e293b" }
    )
  );
  objs.push(
    createTextObj(pid, 320, 324, 50, 16, "25 hrs", {
      fontSize: 8.5,
      color: "#475569",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 400, 324, 70, 16, "$180.00", {
      fontSize: 8.5,
      color: "#475569",
      align: "right",
    })
  );
  objs.push(
    createTextObj(pid, 500, 324, 75, 16, "$4,500.00", {
      fontSize: 8.5,
      bold: true,
      color: "#0f172a",
      align: "right",
    })
  );

  // Row 4
  objs.push(createShapeObj(pid, 24, 353, 564, 38, "rectangle", "#f1f5f9", "#f8fafc", 1));
  objs.push(
    createTextObj(
      pid,
      36,
      358,
      280,
      28,
      "Zero-Trust Security & Compliance Audit\nmTLS certificates, RBAC policies & pen-testing verification",
      { fontSize: 8.5, color: "#1e293b" }
    )
  );
  objs.push(
    createTextObj(pid, 320, 364, 50, 16, "15 hrs", {
      fontSize: 8.5,
      color: "#475569",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 400, 364, 70, 16, "$200.00", {
      fontSize: 8.5,
      color: "#475569",
      align: "right",
    })
  );
  objs.push(
    createTextObj(pid, 500, 364, 75, 16, "$3,000.00", {
      fontSize: 8.5,
      bold: true,
      color: "#0f172a",
      align: "right",
    })
  );

  // Total Summary Box
  objs.push(createShapeObj(pid, 340, 410, 248, 120, "rectangle", "#334155", "#0f172a", 1));
  objs.push(
    createTextObj(pid, 356, 422, 120, 16, "Subtotal:", {
      fontSize: 9,
      color: "#94a3b8",
    })
  );
  objs.push(
    createTextObj(pid, 460, 422, 110, 16, "$26,500.00", {
      fontSize: 9,
      color: "#ffffff",
      align: "right",
    })
  );

  objs.push(
    createTextObj(pid, 356, 444, 120, 16, "Tax (0% Export B2B):", {
      fontSize: 9,
      color: "#94a3b8",
    })
  );
  objs.push(
    createTextObj(pid, 460, 444, 110, 16, "$0.00", {
      fontSize: 9,
      color: "#ffffff",
      align: "right",
    })
  );

  objs.push(createShapeObj(pid, 356, 468, 216, 1, "line", "#334155"));

  objs.push(
    createTextObj(pid, 356, 480, 110, 22, "TOTAL DUE:", {
      fontSize: 12,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(pid, 450, 478, 120, 24, "$26,500.00", {
      fontSize: 14,
      bold: true,
      color: "#34d399",
      align: "right",
    })
  );

  // Thank you & Payment Terms
  objs.push(
    createTextObj(pid, 24, 430, 290, 70, "Thank you for your business!\nPayment is due within 30 days of invoice date.\nPlease include invoice number INV-2026-0842 with your wire transfer.", {
      fontSize: 8.5,
      color: "#64748b",
    })
  );

  p1.objects = objs;
  return {
    id: `doc_finance_invoice_${Date.now()}`,
    name: "Modern Gradient Corporate Invoice",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 6. Certificate of Excellence & Award
// ---------------------------------------------------------------------------
function buildCertificateDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Elegant Ornate Double Border
  objs.push(createShapeObj(pid, 24, 24, 564, 744, "rectangle", "#ca8a04", "#fefce8", 3));
  objs.push(createShapeObj(pid, 34, 34, 544, 724, "rectangle", "#854d0e", "transparent", 1));

  // Top Laurel Seal Ribbon Badge
  objs.push(createShapeObj(pid, 276, 55, 60, 60, "circle", "#ca8a04", "#fef08a", 2));
  objs.push(
    createTextObj(pid, 276, 75, 60, 20, "★ ★ ★", {
      fontSize: 11,
      bold: true,
      color: "#854d0e",
      align: "center",
    })
  );

  // Title
  objs.push(
    createTextObj(pid, 50, 130, 512, 34, "CERTIFICATE OF EXCELLENCE", {
      fontSize: 22,
      bold: true,
      color: "#854d0e",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 50, 172, 512, 18, "THIS RECOGNITION IS PROUDLY PRESENTED TO", {
      fontSize: 9,
      bold: true,
      color: "#a16207",
      align: "center",
    })
  );

  // Recipient Name
  objs.push(
    createTextObj(pid, 50, 220, 512, 40, "Alex Morgan", {
      fontSize: 26,
      bold: true,
      color: "#1e293b",
      align: "center",
    })
  );
  objs.push(createShapeObj(pid, 180, 270, 252, 2, "line", "#ca8a04"));

  // Commendation
  objs.push(
    createTextObj(
      pid,
      80,
      300,
      452,
      80,
      "In recognition of exceptional leadership, technical excellence, and outstanding contributions toward the Global Cloud Transformation initiative during the 2026 fiscal cycle.",
      {
        fontSize: 11,
        italic: true,
        color: "#475569",
        align: "center",
      }
    )
  );

  // Citation details
  objs.push(
    createTextObj(
      pid,
      80,
      400,
      452,
      40,
      "Awarded this 1st day of October, 2026\nCertificate Verification Hash: #CERT-8902-ENG-EXCELLENCE",
      {
        fontSize: 8.5,
        color: "#64748b",
        align: "center",
      }
    )
  );

  // Signature Lines
  objs.push(createShapeObj(pid, 90, 540, 180, 1, "line", "#713f12"));
  objs.push(
    createTextObj(pid, 90, 550, 180, 20, "Dr. Christopher Scott", {
      fontSize: 10,
      bold: true,
      color: "#1e293b",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 90, 570, 180, 16, "Chief Executive Officer", {
      fontSize: 8,
      color: "#64748b",
      align: "center",
    })
  );

  objs.push(createShapeObj(pid, 342, 540, 180, 1, "line", "#713f12"));
  objs.push(
    createTextObj(pid, 342, 550, 180, 20, "Elena Rostova", {
      fontSize: 10,
      bold: true,
      color: "#1e293b",
      align: "center",
    })
  );
  objs.push(
    createTextObj(pid, 342, 570, 180, 16, "VP of Engineering & Architecture", {
      fontSize: 8,
      color: "#64748b",
      align: "center",
    })
  );

  p1.objects = objs;
  return {
    id: `doc_cert_award_${Date.now()}`,
    name: "Certificate of Excellence Award",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 7. Executive Business Proposal & Strategy Pitch
// ---------------------------------------------------------------------------
function buildBusinessProposalDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Deep Navy Header
  objs.push(createShapeObj(pid, 24, 24, 564, 130, "rectangle", "#1e3a8a", "#0f172a", 1));
  objs.push(
    createTextObj(pid, 48, 44, 400, 14, "STRATEGIC PROPOSAL  •  ENTERPRISE TRANSFORMATION", {
      fontSize: 8,
      bold: true,
      color: "#93c5fd",
    })
  );
  objs.push(
    createTextObj(pid, 48, 64, 500, 28, "Global Cloud Modernization & AI Integration", {
      fontSize: 18,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      48,
      98,
      500,
      20,
      "Prepared for: Apex Global Financial Partners  •  Submitted by: NextGen Cloud Solutions",
      { fontSize: 8.5, color: "#bfdbfe" }
    )
  );

  // Executive Summary Card
  objs.push(createShapeObj(pid, 24, 175, 564, 90, "rectangle", "#cbd5e1", "#f8fafc", 1));
  objs.push(
    createTextObj(pid, 40, 186, 532, 16, "EXECUTIVE SUMMARY", {
      fontSize: 9,
      bold: true,
      color: "#1e3a8a",
    })
  );
  objs.push(
    createTextObj(
      pid,
      40,
      206,
      532,
      50,
      "This proposal details the 6-month migration and modernization roadmap to transition legacy transaction systems onto a cloud-native microservices architecture. Projected outcomes include a 45% reduction in cloud infrastructure spend and a 99.999% availability guarantee across all global regions.",
      { fontSize: 8.5, color: "#334155" }
    )
  );

  // 3 Strategic Pillars
  objs.push(createShapeObj(pid, 24, 285, 176, 150, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 36, 298, 152, 18, "Phase 1: Discovery", {
      fontSize: 10,
      bold: true,
      color: "#1e3a8a",
    })
  );
  objs.push(
    createTextObj(
      pid,
      36,
      322,
      152,
      100,
      "• Inventory 120+ microservices\n• Dependency graph mapping\n• Security compliance audit\n• Risk mitigation playbook",
      { fontSize: 8, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 218, 285, 176, 150, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 230, 298, 152, 18, "Phase 2: Mesh Deploy", {
      fontSize: 10,
      bold: true,
      color: "#1e3a8a",
    })
  );
  objs.push(
    createTextObj(
      pid,
      230,
      322,
      152,
      100,
      "• Kubernetes cluster provision\n• Istio service mesh rollout\n• Automated canary pipelines\n• Kafka stream cutover",
      { fontSize: 8, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 412, 285, 176, 150, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 424, 298, 152, 18, "Phase 3: AI Copilots", {
      fontSize: 10,
      bold: true,
      color: "#1e3a8a",
    })
  );
  objs.push(
    createTextObj(
      pid,
      424,
      322,
      152,
      100,
      "• Automated telemetry triage\n• Predictive capacity scaling\n• Continuous load simulation\n• Staff enablement training",
      { fontSize: 8, color: "#475569" }
    )
  );

  // Investment & Milestones Table
  objs.push(createShapeObj(pid, 24, 455, 564, 180, "rectangle", "#e2e8f0", "#f8fafc", 1));
  objs.push(
    createTextObj(pid, 40, 468, 532, 16, "INVESTMENT & TIMELINE SCHEDULE", {
      fontSize: 9,
      bold: true,
      color: "#1e3a8a",
    })
  );

  objs.push(
    createTextObj(
      pid,
      40,
      495,
      532,
      120,
      "• Milestone 1: Architecture Review & Security Baseline (Month 1-2) — $45,000\n• Milestone 2: Infrastructure Provisioning & Pilot Migration (Month 3-4) — $85,000\n• Milestone 3: Full Production Cutover & High-Availability Validation (Month 5) — $60,000\n• Milestone 4: Operational Handover & 24/7 SRE Enablement (Month 6) — $30,000\n\nTotal Estimated Investment: $220,000 (Fixed Price Milestone Delivery)",
      { fontSize: 8.5, color: "#334155" }
    )
  );

  p1.objects = objs;
  return {
    id: `doc_biz_proposal_${Date.now()}`,
    name: "Executive Business Proposal",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 8. Creative Marketing & Agency Services One-Pager
// ---------------------------------------------------------------------------
function buildMarketingFlyerDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  // Radiant Gradient Top Banner
  objs.push(createShapeObj(pid, 24, 24, 564, 180, "rectangle", "#ea580c", "#c2410c", 1));
  objs.push(
    createTextObj(pid, 48, 44, 450, 16, "STUDIO NEXUS  •  CREATIVE DIGITAL AGENCY", {
      fontSize: 8.5,
      bold: true,
      color: "#ffedd5",
    })
  );
  objs.push(
    createTextObj(pid, 48, 68, 510, 36, "We Craft Digital Experiences That Inspire", {
      fontSize: 22,
      bold: true,
      color: "#ffffff",
    })
  );
  objs.push(
    createTextObj(
      pid,
      48,
      112,
      510,
      35,
      "Full-service brand identity, product design systems, and cloud web applications for venture-backed hyper-growth startups.",
      { fontSize: 10, color: "#fed7aa" }
    )
  );

  // 4 Service Columns
  objs.push(createShapeObj(pid, 24, 225, 266, 120, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 38, 238, 238, 18, "🎨 Brand Identity & Strategy", {
      fontSize: 10,
      bold: true,
      color: "#ea580c",
    })
  );
  objs.push(
    createTextObj(
      pid,
      38,
      260,
      238,
      70,
      "Logos, typography, color architecture, motion design guidelines, and complete multi-channel brand books.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 322, 225, 266, 120, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 336, 238, 238, 18, "💻 Product & UX Design", {
      fontSize: 10,
      bold: true,
      color: "#ea580c",
    })
  );
  objs.push(
    createTextObj(
      pid,
      336,
      260,
      238,
      70,
      "Complex SaaS applications, design systems in Figma, micro-interactions, user research, and wireframing.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 24, 365, 266, 120, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 38, 378, 238, 18, "⚡ Full-Stack Engineering", {
      fontSize: 10,
      bold: true,
      color: "#ea580c",
    })
  );
  objs.push(
    createTextObj(
      pid,
      38,
      400,
      238,
      70,
      "React, Next.js, Node.js, and serverless edge functions built for blazing load speed and 100/100 Lighthouse performance.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  objs.push(createShapeObj(pid, 322, 365, 266, 120, "rectangle", "#e2e8f0", "#ffffff", 1));
  objs.push(
    createTextObj(pid, 336, 378, 238, 18, "📈 Growth & Marketing Assets", {
      fontSize: 10,
      bold: true,
      color: "#ea580c",
    })
  );
  objs.push(
    createTextObj(
      pid,
      336,
      400,
      238,
      70,
      "High-converting landing pages, interactive product demos, pitch deck presentations, and social graphics.",
      { fontSize: 8.5, color: "#475569" }
    )
  );

  // Contact / Booking Callout
  objs.push(createShapeObj(pid, 24, 515, 564, 110, "rectangle", "#ea580c", "#fff7ed", 1));
  objs.push(
    createTextObj(pid, 44, 532, 360, 20, "Let's Build Something Exceptional Together", {
      fontSize: 12,
      bold: true,
      color: "#9a3412",
    })
  );
  objs.push(
    createTextObj(
      pid,
      44,
      558,
      360,
      36,
      "Now accepting project inquiries for Q4 2026. Schedule a free 30-minute discovery consultation with our design principals.",
      { fontSize: 8.5, color: "#c2410c" }
    )
  );
  objs.push(createShapeObj(pid, 420, 545, 140, 36, "rectangle", "#ea580c", "#ea580c", 0));
  objs.push(
    createTextObj(pid, 424, 555, 132, 18, "hello@studionexus.co", {
      fontSize: 9,
      bold: true,
      color: "#ffffff",
      align: "center",
    })
  );

  p1.objects = objs;
  return {
    id: `doc_marketing_flyer_${Date.now()}`,
    name: "Creative Agency Services One-Pager",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// Resume Document Builders (Dedicated Resume Category)
// ---------------------------------------------------------------------------
function buildAtsProfessionalDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createTextObj(pid, 40, 40, 532, 28, "Alex Morgan", { fontSize: 22, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 40, 70, 532, 18, "Senior Product Designer & Design Systems Lead", { fontSize: 11, bold: true, color: "#475569" }));
  objs.push(createTextObj(pid, 40, 92, 532, 16, "alex.morgan@email.com  •  +1 (555) 234-5678  •  San Francisco, CA  •  linkedin.com/in/alexmorgan", { fontSize: 8.5, color: "#64748b" }));
  objs.push(createShapeObj(pid, 40, 114, 532, 1, "line", "#cbd5e1"));

  objs.push(createTextObj(pid, 40, 126, 532, 16, "PROFESSIONAL SUMMARY", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 40, 144, 532, 38, "Product designer with 8+ years of experience crafting enterprise B2B SaaS workflows, scalable design systems, and data-dense user interfaces. Proven track record collaborating with product managers and engineering leads to reduce user churn by 28%.", { fontSize: 8.5, color: "#334155" }));

  objs.push(createTextObj(pid, 40, 192, 532, 16, "WORK EXPERIENCE", { fontSize: 9.5, bold: true, color: "#0f172a" }));

  objs.push(createTextObj(pid, 40, 212, 360, 16, "Senior Product Designer  •  Acme Technologies", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 400, 212, 172, 16, "2022 – Present | San Francisco, CA", { fontSize: 8, color: "#64748b", align: "right" }));
  objs.push(createTextObj(pid, 40, 230, 532, 42, "• Architected multi-brand design system in Figma adopted by 45+ engineers across 4 squads.\n• Led end-to-end redesign of analytics dashboard, increasing daily active user engagement by 34%.\n• Conducted 50+ qualitative user interviews to validate complex permission management flows.", { fontSize: 8.5, color: "#334155" }));

  objs.push(createTextObj(pid, 40, 284, 360, 16, "Product Designer  •  Nova Digital", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 400, 284, 172, 16, "2019 – 2022 | Austin, TX", { fontSize: 8, color: "#64748b", align: "right" }));
  objs.push(createTextObj(pid, 40, 302, 532, 42, "• Designed responsive self-serve onboarding flow that improved trial-to-paid conversion by 19%.\n• Partnered with front-end developers to establish WCAG 2.1 AA accessibility compliance across mobile apps.\n• Created high-fidelity interactive prototypes for executive presentations and customer advisory boards.", { fontSize: 8.5, color: "#334155" }));

  objs.push(createTextObj(pid, 40, 356, 532, 16, "EDUCATION", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 40, 376, 360, 16, "Bachelor of Science in Human-Computer Interaction  •  University of Washington", { fontSize: 9, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 400, 376, 172, 16, "2015 – 2019 | Seattle, WA", { fontSize: 8, color: "#64748b", align: "right" }));

  objs.push(createTextObj(pid, 40, 405, 532, 16, "CORE SKILLS & TECHNOLOGIES", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 40, 424, 532, 28, "Product Design, UI/UX Architecture, Design Systems (Tokens, Auto-layout), Wireframing, Rapid Prototyping, Usability Testing, HTML/CSS, React Principles, Figma, FigJam, Zeroheight.", { fontSize: 8.5, color: "#334155" }));

  p1.objects = objs;
  return {
    id: `doc_ats_pro_${Date.now()}`,
    name: "ATS Professional Resume",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildModernAtsDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createShapeObj(pid, 36, 36, 170, 720, "rectangle", "#f1f5f9", "#f8fafc", 1));

  objs.push(createTextObj(pid, 50, 50, 142, 16, "CONTACT", { fontSize: 9, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 50, 70, 142, 50, "jordan.reed@email.com\n+1 (555) 987-6543\nSeattle, WA\ngithub.com/jordanreed", { fontSize: 7.5, color: "#475569" }));

  objs.push(createTextObj(pid, 50, 135, 142, 16, "CORE SKILLS", { fontSize: 9, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 50, 155, 142, 90, "• TypeScript & Node.js\n• React & Next.js\n• GraphQL & REST APIs\n• Docker & Kubernetes\n• PostgreSQL & Redis\n• AWS (Lambda, ECS, S3)", { fontSize: 7.5, color: "#334155" }));

  objs.push(createTextObj(pid, 226, 45, 350, 24, "Jordan Reed", { fontSize: 20, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 226, 72, 350, 16, "Senior Full-Stack Cloud Engineer", { fontSize: 10, bold: true, color: "#2563eb" }));
  objs.push(createShapeObj(pid, 226, 95, 350, 1, "line", "#e2e8f0"));

  objs.push(createTextObj(pid, 226, 110, 350, 16, "PROFESSIONAL EXPERIENCE", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 226, 130, 230, 16, "Senior Software Engineer  •  CloudScale Systems", { fontSize: 9, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 460, 130, 116, 16, "2021 – Present", { fontSize: 8, color: "#64748b", align: "right" }));
  objs.push(createTextObj(pid, 226, 148, 350, 48, "• Designed microservices handling 45k requests/sec with p99 latency < 25ms.\n• Led cloud infrastructure modernization on AWS EKS reducing server costs by $18k/month.\n• Mentored 6 junior engineers and instituted rigorous automated CI/CD test gates.", { fontSize: 8, color: "#334155" }));

  p1.objects = objs;
  return {
    id: `doc_modern_ats_${Date.now()}`,
    name: "Modern Two-Column ATS Resume",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildExecutiveResumeDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createTextObj(pid, 45, 45, 522, 28, "Christopher Scott, MBA", { fontSize: 22, bold: true, color: "#1e293b", align: "center" }));
  objs.push(createTextObj(pid, 45, 75, 522, 16, "Vice President of Engineering & Technology Strategy", { fontSize: 11, bold: true, color: "#0284c7", align: "center" }));
  objs.push(createTextObj(pid, 45, 95, 522, 14, "New York, NY  •  (555) 789-0123  •  cscott@executiveleaders.com", { fontSize: 8.5, color: "#64748b", align: "center" }));
  objs.push(createShapeObj(pid, 45, 115, 522, 1, "line", "#cbd5e1"));

  objs.push(createTextObj(pid, 45, 130, 522, 16, "EXECUTIVE PROFILE", { fontSize: 10, bold: true, color: "#1e293b" }));
  objs.push(createTextObj(pid, 45, 150, 522, 40, "Strategic engineering executive with 15+ years of experience scaling distributed engineering organizations from 30 to 250+ across North America and EMEA. Delivered $120M+ enterprise SaaS platforms and managed $28M operational budgets.", { fontSize: 8.5, color: "#334155" }));

  p1.objects = objs;
  return {
    id: `doc_exec_resume_${Date.now()}`,
    name: "Executive Leadership CV",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildSoftwareEngineerDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createTextObj(pid, 36, 36, 540, 24, "David Chen", { fontSize: 20, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 36, 62, 540, 16, "Lead Backend & Distributed Systems Engineer", { fontSize: 10, bold: true, color: "#059669" }));
  objs.push(createTextObj(pid, 36, 80, 540, 14, "david.chen@dev.io  •  San Jose, CA  •  github.com/dchen-backend", { fontSize: 8, color: "#64748b" }));
  objs.push(createShapeObj(pid, 36, 100, 540, 1, "line", "#cbd5e1"));

  objs.push(createTextObj(pid, 36, 112, 540, 16, "TECHNICAL EXPERTISE", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 36, 130, 540, 28, "Languages: Go, Rust, Python, C++, TypeScript\nInfrastructure: Kafka, gRPC, Kubernetes, Redis, Cassandra, PostgreSQL, AWS, Terraform", { fontSize: 8, color: "#334155" }));

  p1.objects = objs;
  return {
    id: `doc_swe_resume_${Date.now()}`,
    name: "Software Developer Resume",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildProductDesignerDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createTextObj(pid, 40, 40, 532, 26, "Elena Rostova", { fontSize: 22, bold: true, color: "#7c3aed" }));
  objs.push(createTextObj(pid, 40, 70, 532, 16, "Principal Product & UX/UI Designer", { fontSize: 10.5, bold: true, color: "#1e293b" }));
  objs.push(createTextObj(pid, 40, 90, 532, 14, "portfolio.elenarostova.design  •  San Francisco, CA  •  elena@rostova.design", { fontSize: 8, color: "#64748b" }));
  objs.push(createShapeObj(pid, 40, 110, 532, 2, "line", "#7c3aed"));

  p1.objects = objs;
  return {
    id: `doc_ux_designer_${Date.now()}`,
    name: "Product & UX Designer Resume",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildCorporateFinanceDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createTextObj(pid, 40, 40, 532, 26, "Devon Taylor, CFA", { fontSize: 22, bold: true, color: "#047857", align: "center" }));
  objs.push(createTextObj(pid, 40, 70, 532, 16, "Senior Financial Analyst & Corporate Strategy", { fontSize: 10.5, bold: true, color: "#0f172a", align: "center" }));
  objs.push(createTextObj(pid, 40, 90, 532, 14, "devon.taylor@finance.org  •  Chicago, IL  •  (555) 432-1098", { fontSize: 8, color: "#64748b", align: "center" }));
  objs.push(createShapeObj(pid, 40, 110, 532, 1, "line", "#047857"));

  p1.objects = objs;
  return {
    id: `doc_corp_finance_${Date.now()}`,
    name: "Corporate Finance Resume",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildStudentResumeDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createTextObj(pid, 40, 40, 532, 24, "Samantha Bailey", { fontSize: 20, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 40, 68, 532, 16, "Computer Science Graduate & Junior Software Developer", { fontSize: 10, bold: true, color: "#d97706" }));
  objs.push(createTextObj(pid, 40, 88, 532, 14, "samantha.bailey@alumni.edu  •  Boston, MA", { fontSize: 8, color: "#64748b" }));
  objs.push(createShapeObj(pid, 40, 108, 532, 1, "line", "#cbd5e1"));

  p1.objects = objs;
  return {
    id: `doc_student_resume_${Date.now()}`,
    name: "Student / Graduate Resume",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

function buildCoverLetterDoc(): PDFDocument {
  const p1 = createBlankPage(0, 612, 792);
  const pid = p1.id;
  const objs: PDFObject[] = [];

  objs.push(createShapeObj(pid, 40, 40, 532, 4, "rectangle", "#2563eb", "#2563eb", 0));
  objs.push(createTextObj(pid, 40, 55, 300, 20, "Alex Morgan", { fontSize: 16, bold: true, color: "#0f172a" }));
  objs.push(createTextObj(pid, 40, 78, 300, 14, "alex.morgan@email.com  •  (555) 234-5678", { fontSize: 8.5, color: "#64748b" }));

  objs.push(createTextObj(pid, 40, 120, 532, 14, "October 1, 2026", { fontSize: 9, color: "#475569" }));
  objs.push(createTextObj(pid, 40, 145, 300, 30, "Hiring Committee\nAcme Technologies Inc.\nSan Francisco, CA", { fontSize: 9, color: "#1e293b" }));

  objs.push(createTextObj(pid, 40, 195, 532, 16, "Dear Hiring Team,", { fontSize: 9.5, bold: true, color: "#0f172a" }));
  objs.push(
    createTextObj(
      pid,
      40,
      220,
      532,
      120,
      "I am writing to express my enthusiastic interest in the Principal Product Designer position at Acme Technologies. With over 8 years of experience designing multi-platform enterprise SaaS solutions and design systems, I have continually delivered interfaces that empower users while driving core business outcomes.\n\nAt my previous roles, I led end-to-end design initiatives that reduced customer onboarding drop-off by 28% and established company-wide accessibility guidelines adopted across multiple product lines.",
      { fontSize: 9, color: "#334155" }
    )
  );

  p1.objects = objs;
  return {
    id: `doc_cover_letter_${Date.now()}`,
    name: "Job Application Cover Letter",
    pages: [p1],
    textOverrides: {},
    textStyleOverrides: {},
    deletedTextItems: {},
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// MASTER TEMPLATES CATALOG
// ---------------------------------------------------------------------------
export const TEMPLATES_CATALOG: TemplateMetadata[] = [
  // 1. LANDING PAGES & ONE-PAGERS
  {
    id: "landing-saas-01",
    name: "SaaS Product Landing Page",
    category: "Landing Pages",
    badge: "Modern SaaS",
    pages: 1,
    tags: ["Landing Page", "SaaS", "Dashboard", "Startup", "One-Pager"],
    accentColor: "#4f46e5",
    description: "Modern tech landing page featuring dark hero banner, dashboard mockup graphic, feature pillars, customer quote, and CTA.",
    createDocument: buildSaasLandingDoc,
  },
  {
    id: "marketing-flyer-01",
    name: "Creative Agency One-Pager",
    category: "Landing Pages",
    badge: "Agency",
    pages: 1,
    tags: ["Agency", "Services", "Portfolio", "Marketing", "Creative"],
    accentColor: "#ea580c",
    description: "Vibrant creative agency portfolio flyer with services grid, client logos, consultation callout, and brand accents.",
    createDocument: buildMarketingFlyerDoc,
  },

  // 2. INFORMATION ARCHITECTURE & TECH SYSTEMS
  {
    id: "arch-cloud-01",
    name: "Cloud Architecture Blueprint",
    category: "Architecture",
    badge: "Tech Schematic",
    pages: 1,
    tags: ["Architecture", "System Diagram", "Cloud", "Microservices", "Kafka"],
    accentColor: "#0284c7",
    description: "Comprehensive dark blueprint with interactive system flow diagram, SLA tags, and 4-tier infrastructure component breakdown.",
    createDocument: buildArchitectureDoc,
  },

  // 3. BANNERS & KEYNOTE POSTERS
  {
    id: "banner-keynote-01",
    name: "AI Summit Keynote Banner",
    category: "Banners",
    badge: "Event Keynote",
    pages: 1,
    tags: ["Banner", "Conference", "Keynote", "Poster", "Gradient"],
    accentColor: "#db2777",
    description: "High-impact widescreen conference poster with radiant violet-magenta gradient, speaker portrait spotlight, and registration callout.",
    createDocument: buildKeynoteBannerDoc,
  },
  {
    id: "banner-launch-01",
    name: "Product Release Announcement",
    category: "Banners",
    badge: "Launch Poster",
    pages: 1,
    tags: ["Announcement", "Launch", "Product", "Banner", "Metrics"],
    accentColor: "#0284c7",
    description: "Electric blue product release poster with brand logo, speed benchmark highlights, and release notes overview.",
    createDocument: buildLaunchBannerDoc,
  },
  {
    id: "banner-enterprise-circle",
    name: "Executive Partner Network Flyer",
    category: "Banners",
    badge: "PRO EXCLUSIVE",
    isPro: true,
    pages: 1,
    tags: ["Banner", "Executive", "Partnership", "Infographic", "Flyer", "Pro", "Corporate"],
    accentColor: "#ea580c",
    description: "Executive partnership network flyer with high-impact sunset skyline hero, multi-step process workflows, discovery pillars, and privacy guarantees.",
    createDocument: buildExecutivePartnerBannerDoc,
  },

  // 4. BUSINESS & PITCH
  {
    id: "biz-proposal-01",
    name: "Executive Business Proposal",
    category: "Business",
    badge: "Strategy",
    pages: 1,
    tags: ["Proposal", "Business", "Pitch", "Executive", "Strategy"],
    accentColor: "#1e3a8a",
    description: "Corporate strategic proposal with executive project overview, phase breakdown, milestone investment schedule, and deliverables.",
    createDocument: buildBusinessProposalDoc,
  },

  // 5. INVOICES & FINANCE
  {
    id: "finance-invoice-01",
    name: "Modern Gradient Corporate Invoice",
    category: "Finance",
    badge: "Finance Pro",
    pages: 1,
    tags: ["Invoice", "Billing", "Corporate", "Finance", "Table"],
    accentColor: "#059669",
    description: "Modern corporate billing invoice with company brand mark, itemized work table, banking wire info, and highlighted total due.",
    createDocument: buildModernInvoiceDoc,
  },

  // 6. CERTIFICATES & AWARDS
  {
    id: "cert-award-01",
    name: "Certificate of Excellence Award",
    category: "Certificates",
    badge: "Gold Award",
    pages: 1,
    tags: ["Certificate", "Award", "Excellence", "Diploma", "Gold"],
    accentColor: "#ca8a04",
    description: "Ornate certificate of achievement with gold double-border geometry, honor ribbon seal, custom recipient name, and signature lines.",
    createDocument: buildCertificateDoc,
  },

  // 7. RESUMES & CVS (Dedicated Resume Section)
  {
    id: "ats-professional-01",
    name: "ATS Professional Resume",
    category: "Resumes",
    badge: "ATS Friendly",
    isAtsFriendly: true,
    pages: 1,
    tags: ["ATS", "Clean", "Single Column", "Standard", "Tech"],
    accentColor: "#2563eb",
    description: "Clean single-column standard resume layout optimized for applicant tracking systems with structured work history and skills.",
    createDocument: buildAtsProfessionalDoc,
  },
  {
    id: "modern-ats-02",
    name: "Modern Two-Column ATS Resume",
    category: "Resumes",
    badge: "Modern Split",
    isAtsFriendly: true,
    pages: 1,
    tags: ["Two Column", "Sidebar", "ATS", "Developer"],
    accentColor: "#0284c7",
    description: "Two-column resume layout featuring a dedicated sidebar for contact info and technical skills, paired with a timeline experience block.",
    createDocument: buildModernAtsDoc,
  },
  {
    id: "executive-resume-03",
    name: "Executive Leadership CV",
    category: "Resumes",
    badge: "Executive",
    pages: 1,
    tags: ["Executive", "VP", "Director", "Leadership"],
    accentColor: "#0f172a",
    description: "Refined executive layout with centered typography, career milestone metrics, and executive board qualifications.",
    createDocument: buildExecutiveResumeDoc,
  },
  {
    id: "software-engineer-04",
    name: "Software Developer Resume",
    category: "Resumes",
    badge: "Tech Pro",
    isAtsFriendly: true,
    pages: 1,
    tags: ["Software", "Backend", "Engineer", "Go", "Rust"],
    accentColor: "#059669",
    description: "Technical resume focusing on architectural projects, systems engineering stack, GitHub repositories, and quantitative scale.",
    createDocument: buildSoftwareEngineerDoc,
  },
  {
    id: "product-designer-05",
    name: "Product & UX Designer Resume",
    category: "Resumes",
    badge: "Design",
    pages: 1,
    tags: ["Product Design", "UX", "UI", "Figma", "Portfolio"],
    accentColor: "#7c3aed",
    description: "Design-centric resume with portfolio highlights, design system leadership, UX research milestones, and cross-functional impact.",
    createDocument: buildProductDesignerDoc,
  },
  {
    id: "corporate-finance",
    name: "Corporate Finance Resume",
    category: "Resumes",
    badge: "Finance",
    pages: 1,
    tags: ["Finance", "Banking", "CFA", "Investment"],
    accentColor: "#047857",
    description: "Investment banking and corporate FP&A standard layout highlighting deal sizes and capital metrics.",
    createDocument: buildCorporateFinanceDoc,
  },
  {
    id: "student-graduate",
    name: "Student / Graduate Resume",
    category: "Resumes",
    badge: "Entry Level",
    isAtsFriendly: true,
    pages: 1,
    tags: ["Student", "Internship", "Academic", "College"],
    accentColor: "#d97706",
    description: "Education and project-forward resume designed for university graduates, interns, and early-career job seekers.",
    createDocument: buildStudentResumeDoc,
  },
  {
    id: "job-cover-letter",
    name: "Job Application Cover Letter",
    category: "Resumes",
    badge: "Cover Letter",
    pages: 1,
    tags: ["Cover Letter", "Hiring", "Application", "Formal"],
    accentColor: "#2563eb",
    description: "Polished corporate letterhead with candidate introduction, relevant achievements, and formal sign-off.",
    createDocument: buildCoverLetterDoc,
  },
];

export const PDF_STUDIO_TEMPLATES = TEMPLATES_CATALOG;

export function getTemplateById(id: string): TemplateMetadata | undefined {
  return TEMPLATES_CATALOG.find((t) => t.id === id);
}
