"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type TaskRevisionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (revisionNotes: string) => Promise<void>;
};

export function TaskRevisionDialog({
  open,
  onClose,
  onSubmit,
}: TaskRevisionDialogProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!notes.trim()) {
      setError("Catatan revisi wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(notes.trim());
      onClose();
    } catch {
      setError("Gagal meminta revisi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Minta Revisi</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Status task akan menjadi perlu revisi.
          </p>
        </div>
        <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Catatan revisi</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-28 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
            />
          </label>
          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Minta revisi"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
