import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, MessageSquare, Send, CheckCircle2, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { SaasHeader } from "@/components/saas/SaasHeader";
import { SaasFooter } from "@/components/saas/SaasFooter";
import { setUploadedPdf } from "@/lib/pdf-store";

export function ContactPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }

    const toastId = toast.loading(`Loading ${file.name}...`);
    try {
      const buffer = await file.arrayBuffer();
      setUploadedPdf(buffer, file.name);

      toast.success("Document loaded successfully", { id: toastId });
      navigate({
        to: "/editor",
        search: { file: file.name },
      });
    } catch (err) {
      console.error("Failed to load PDF:", err);
      toast.error("Failed to read PDF file.", { id: toastId });
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      toast.success("Your message has been received! Our support team will get back to you.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
        }}
      />

      <SaasHeader onOpenUploadModal={handleTriggerUpload} />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-4">
              <Mail className="w-3.5 h-3.5" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Contact PDF Studio
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Have a feature request, enterprise question, or feedback on our PDF tools? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Details */}
            <div className="md:col-span-1 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-foreground text-sm">Product Inquiries</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  General feedback and technical questions.
                </p>
                <p className="text-xs font-semibold text-brand mt-2">
                  support@pdfstudio.app
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-foreground text-sm">Enterprise & Team</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume licensing and dedicated self-hosted deployments.
                </p>
                <p className="text-xs font-semibold text-foreground mt-2">
                  enterprise@pdfstudio.app
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-foreground text-sm">Quick Answers</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Check our documentation and FAQ page for instant answers.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/faq" })}
                  className="mt-3 text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  Visit FAQ →
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                {isSent ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Message Sent</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      Thank you for reaching out. We have received your inquiry and will respond within 1 business day.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSent(false);
                        setName("");
                        setEmail("");
                        setMessage("");
                      }}
                      className="mt-6 px-6 py-2.5 rounded-xl border border-input bg-card text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        <option value="support">Technical Support</option>
                        <option value="feedback">Product Feedback & Feature Request</option>
                        <option value="enterprise">Enterprise & Team Licensing</option>
                        <option value="other">General Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Message
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your inquiry or feedback..."
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm shadow hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SaasFooter />
    </div>
  );
}
