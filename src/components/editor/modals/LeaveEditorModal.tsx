import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, Save, Loader2 } from "lucide-react";

interface LeaveEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
  onSaveAndExit: () => void | Promise<void>;
  isSaving?: boolean;
}

export function LeaveEditorModal({
  open,
  onOpenChange,
  onConfirmLeave,
  onSaveAndExit,
  isSaving = false,
}: LeaveEditorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-3 border border-amber-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Exit Editor?
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You will lose any unsaved edits, added text, signatures, or changes you made. Save your document before leaving, or leave without saving.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            variant="brand"
            className="w-full gap-2 font-bold shadow-md shadow-brand/20 py-2.5"
            disabled={isSaving}
            onClick={onSaveAndExit}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save and Exit
          </Button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button
              variant="outline"
              disabled={isSaving}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-border/80"
              onClick={() => {
                onOpenChange(false);
                onConfirmLeave();
              }}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Discard & Leave
            </Button>

            <Button
              variant="secondary"
              disabled={isSaving}
              className="text-xs font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Keep Editing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
