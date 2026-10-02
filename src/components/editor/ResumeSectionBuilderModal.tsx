import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { EditorState } from "./useEditorState";
import { createTextObj, createShapeObj } from "@/lib/pdf-templates-data";
import { toast } from "sonner";
import {
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Languages,
  FileText,
  PlusCircle,
  Sparkles,
  BookOpen,
  HeartHandshake,
  LayoutList,
} from "lucide-react";

interface ResumeSectionBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: EditorState;
}

interface SectionOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  buildObjects: (pageId: string, y: number, width: number) => { objects: any[]; height: number };
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    id: "experience",
    name: "Work Experience",
    description: "Job title, company, dates, and 3 achievement bullet points",
    icon: Briefcase,
    buildObjects: (pid, y, w) => {
      const objs = [];
      // Section Header
      objs.push(createTextObj(pid, 54, y, w, 16, "WORK EXPERIENCE", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      // Job Title & Company
      objs.push(createTextObj(pid, 54, y + 26, w - 150, 16, "Senior Role Title — Company / Organization", { fontSize: 10.5, bold: true, color: "#0f172a" }));
      objs.push(createTextObj(pid, 54 + w - 145, y + 26, 145, 16, "2023 – Present | City, State", { fontSize: 9.5, color: "#64748b", align: "right" }));
      // Bullet points
      objs.push(
        createTextObj(
          pid,
          54,
          y + 44,
          w,
          48,
          "• Led strategic cross-functional initiatives delivering measurable improvements in core business KPIs.\n• Partnered with leadership to optimize team workflows, reducing turnaround time by 30%.\n• Authored technical documentation and established automated testing protocols.",
          { fontSize: 9.5, color: "#334155", listType: "bullet" }
        )
      );
      return { objects: objs, height: 100 };
    },
  },
  {
    id: "education",
    name: "Education",
    description: "Degree, university name, graduation date, and honors",
    icon: GraduationCap,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "EDUCATION", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(createTextObj(pid, 54, y + 26, w - 150, 16, "Bachelor of Science in Field of Study", { fontSize: 10.5, bold: true, color: "#0f172a" }));
      objs.push(createTextObj(pid, 54 + w - 145, y + 26, 145, 16, "2019 – 2023 | University Name", { fontSize: 9.5, color: "#64748b", align: "right" }));
      objs.push(createTextObj(pid, 54, y + 44, w, 16, "Magna Cum Laude • Dean's Honors List • Capstone Excellence Award", { fontSize: 9.5, color: "#475569" }));
      return { objects: objs, height: 68 };
    },
  },
  {
    id: "skills",
    name: "Skills & Technologies",
    description: "Categorized skills, software proficiencies, and tools",
    icon: Wrench,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "CORE COMPETENCIES & TECHNICAL SKILLS", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 26,
          w,
          40,
          "• Core Skills: Strategic Planning, Project Management, Data Analysis, Client Communication\n• Software & Tools: Microsoft Suite, Google Workspace, Figma, Jira, Tableau, SQL",
          { fontSize: 9.5, color: "#334155" }
        )
      );
      return { objects: objs, height: 74 };
    },
  },
  {
    id: "projects",
    name: "Key Projects",
    description: "Project title, tech stack, and impact overview",
    icon: FolderGit2,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "KEY PROJECTS", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(createTextObj(pid, 54, y + 26, w, 16, "Project Title — Core Focus & Scope (Tools / Technologies Used)", { fontSize: 10, bold: true, color: "#0f172a" }));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 44,
          w,
          36,
          "• Developed full-featured solution adopted by 10,000+ users with 99.8% customer satisfaction.\n• Implemented secure cloud storage and real-time synchronization pipelines.",
          { fontSize: 9.5, color: "#334155", listType: "bullet" }
        )
      );
      return { objects: objs, height: 86 };
    },
  },
  {
    id: "summary",
    name: "Professional Summary",
    description: "High-impact 3-line career summary paragraph",
    icon: FileText,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "PROFESSIONAL SUMMARY", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 26,
          w,
          44,
          "Accomplished professional with proven track record of driving operational efficiency, leading cross-functional teams, and delivering complex client engagements on schedule and under budget.",
          { fontSize: 9.5, color: "#334155" }
        )
      );
      return { objects: objs, height: 76 };
    },
  },
  {
    id: "certifications",
    name: "Certifications & Credentials",
    description: "Industry certifications, issuing organizations, and years",
    icon: Award,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "CERTIFICATIONS & CREDENTIALS", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 26,
          w,
          36,
          "• Certified ScrumMaster (CSM) — Scrum Alliance (2024)\n• Project Management Professional (PMP) — Project Management Institute (2023)",
          { fontSize: 9.5, color: "#334155" }
        )
      );
      return { objects: objs, height: 68 };
    },
  },
  {
    id: "languages",
    name: "Languages",
    description: "Fluency levels and language proficiencies",
    icon: Languages,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "LANGUAGES", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 26,
          w,
          24,
          "• English (Native / Bilingual)  • Spanish (Professional Working)  • French (Conversational)",
          { fontSize: 9.5, color: "#334155" }
        )
      );
      return { objects: objs, height: 56 };
    },
  },
  {
    id: "volunteer",
    name: "Volunteer & Community",
    description: "Community involvement, nonprofit service, and causes",
    icon: HeartHandshake,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "COMMUNITY LEADERSHIP & VOLUNTEER", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 26,
          w,
          36,
          "• Volunteer Mentor — Code for Good: Taught web development fundamentals to high school students.\n• Event Committee Lead — Annual Community Food Drive: Coordinated 40+ volunteers.",
          { fontSize: 9.5, color: "#334155" }
        )
      );
      return { objects: objs, height: 68 };
    },
  },
  {
    id: "custom",
    name: "Custom Section",
    description: "Custom heading with editable bullet point items",
    icon: PlusCircle,
    buildObjects: (pid, y, w) => {
      const objs = [];
      objs.push(createTextObj(pid, 54, y, w, 16, "ADDITIONAL SECTION TITLE", { fontSize: 11, bold: true, color: "#0f172a" }));
      objs.push(createShapeObj(pid, 54, y + 18, w, 1, "line", "#e2e8f0", "transparent", 1));
      objs.push(
        createTextObj(
          pid,
          54,
          y + 26,
          w,
          36,
          "• Add your custom achievements, honors, publications, or organizational affiliations here.\n• Click to edit or format text freely.",
          { fontSize: 9.5, color: "#334155", listType: "bullet" }
        )
      );
      return { objects: objs, height: 68 };
    },
  },
];

export function ResumeSectionBuilderModal({
  open,
  onOpenChange,
  editor,
}: ResumeSectionBuilderModalProps) {
  const [selectedId, setSelectedId] = useState<string>("experience");

  const handleInsertSection = () => {
    const section = SECTION_OPTIONS.find((s) => s.id === selectedId) || SECTION_OPTIONS[0]!;

    const activePageNum = editor.activePage;
    let targetPage = editor.document.pages[activePageNum - 1] || editor.document.pages[0];
    if (!targetPage) return;

    // Calculate lowest object on target page
    const maxBottom = targetPage.objects.reduce(
      (max, obj) => Math.max(max, obj.y + obj.height),
      48
    );

    let targetPageNum = activePageNum;
    let targetY = maxBottom + 22;

    // Smart multi-page overflow: if page runs out of height (leaves less than 40px margin)
    if (targetY + 90 > targetPage.height - 40) {
      // Check if next page exists
      if (activePageNum < editor.document.pages.length) {
        targetPageNum = activePageNum + 1;
        targetPage = editor.document.pages[targetPageNum - 1]!;
        const nextBottom = targetPage.objects.reduce(
          (max, obj) => Math.max(max, obj.y + obj.height),
          45
        );
        targetY = nextBottom + 18;
      } else {
        // Automatically add next page with initial objects atomically!
        const { objects } = section.buildObjects(
          "temp_page",
          52,
          Math.min(504, targetPage.width - 108)
        );
        editor.addPageWithInitialObjects(objects);
        onOpenChange(false);
        toast.success(`Added "${section.name}" to Page ${editor.document.pages.length + 1}`);
        return;
      }
    }

    const { objects } = section.buildObjects(
      targetPage.id,
      targetY,
      Math.min(504, targetPage.width - 108)
    );

    // Add each object to the page
    for (const obj of objects) {
      editor.addObject(obj);
    }

    editor.setActivePage(targetPageNum);
    onOpenChange(false);
    toast.success(`Added "${section.name}" to Page ${targetPageNum}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-6 rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-brand mb-1">
            <LayoutList className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Document Builder</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Add Section to Resume
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a pre-formatted section to insert. The builder intelligently positions the section and flows to the next page if space runs out.
          </DialogDescription>
        </DialogHeader>

        {/* Section List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 mt-4">
          {SECTION_OPTIONS.map((sec) => {
            const Icon = sec.icon;
            const isSelected = selectedId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedId(sec.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-brand bg-brand-soft/40 shadow-sm ring-1 ring-brand/50"
                    : "border-border/70 hover:border-border hover:bg-muted/40"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isSelected ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{sec.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {sec.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Inserts at bottom of active page
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              size="sm"
              className="gap-1.5 font-bold shadow-sm shadow-brand/20"
              onClick={handleInsertSection}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Insert Section</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
