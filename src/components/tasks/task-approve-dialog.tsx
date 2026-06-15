"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2 } from "lucide-react";

type TaskApproveDialogProps = {
  open: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
};

export function TaskApproveDialog({
  open,
  onClose,
  onApprove,
}: TaskApproveDialogProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  async function handleApprove() {
    setError("");
    setIsSubmitting(true);

    try {
      await onApprove();
      onClose();
    } catch {
      setError("Gagal approve task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-md rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Approve Task</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Task akan berstatus approved dan approval status menjadi approved.
          </p>
        </div>
        <div className="p-5">
          {error ? (
            <p className="mb-4 rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              Batal
            </Button>
            <Button type="button" variant="success" size="sm" disabled={isSubmitting} onClick={handleApprove}>
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Menyetujui..." : "Approve"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
