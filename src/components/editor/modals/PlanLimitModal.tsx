import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, FolderOpen, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface PlanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgradeClick: () => void;
}

export function PlanLimitModal({
  open,
  onOpenChange,
  onUpgradeClick,
}: PlanLimitModalProps) {
  const navigate = useNavigate();

  const handleManageDocuments = () => {
    onOpenChange(false);
    // Open dashboard in a new tab so user never loses current editor session
    window.open("/dashboard", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 text-center">
        <DialogHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-2">
            <AlertCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            You've reached the Free plan limit.
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Free accounts can store 1 active document in cloud storage. To save this new document, please upgrade to Pro or delete your previous document.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-2.5">
          <Button
            variant="brand"
            size="sm"
            className="w-full gap-2 font-semibold h-10 text-xs"
            onClick={() => {
              onOpenChange(false);
              onUpgradeClick();
            }}
            style={{ borderRadius: "4px" }}
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 font-medium h-10 text-xs border-border/80"
            onClick={handleManageDocuments}
            style={{ borderRadius: "4px" }}
          >
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Manage Documents
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
            style={{ borderRadius: "4px" }}
          >
            Cancel
          </Button>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          Existing documents are never automatically deleted or overwritten.
        </p>
      </DialogContent>
    </Dialog>
  );
}
