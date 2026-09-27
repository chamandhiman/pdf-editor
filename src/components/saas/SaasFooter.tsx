import { Link } from "@tanstack/react-router";
import { ShieldCheck, Heart, FileCheck2 } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

import type { PDFToolDef } from "@/lib/pdf-tools-data";

interface SaasFooterProps {
  onSelectTool?: (tool: PDFToolDef) => void;
}

export function SaasFooter({ onSelectTool }: SaasFooterProps = {}) {
  return (
    <footer className="border-t border-border bg-card/60 text-card-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <BrandMark />
              <span className="text-base font-bold tracking-tight text-foreground">
                PDF Studio
              </span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Everything you need to work with PDFs. Edit, convert, organize, sign and manage
              documents online — fast, private, and browser-powered.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Client-side session security</span>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  to="/editor"
                  search={{ file: "Sample-Document.pdf" }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  PDF Editor
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link
                  to="/editor"
                  search={{ file: "Sample-Document.pdf" }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign PDF
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  OCR PDF
                </Link>
              </li>
              <li>
                <Link to="/tools" className="font-semibold text-brand hover:underline">
                  All PDF Tools (30+)
                </Link>
              </li>
            </ul>
          </div>

          {/* Convert Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Convert
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  PDF to Word
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  PDF to Excel
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  PDF to PowerPoint
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  PDF to JPG
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  Word to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  Excel to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-foreground">
                  JPG to PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Document Workspace
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ & Guides
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact Support
                </Link>
              </li>
              <li>
                <a href="#why-pdf-studio" className="text-muted-foreground hover:text-foreground">
                  Why PDF Studio
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal & Privacy
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                  Security Architecture
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} PDF Studio. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Built for modern, private document workflows</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
