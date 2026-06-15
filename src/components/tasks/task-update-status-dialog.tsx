"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import { X, Save } from "lucide-react";
import type { Task, TaskStatus } from "@/types";

type TaskUpdateStatusDialogProps = {
  open: boolean;
  task: Task;
  allowedStatuses: TaskStatus[];
  presetStatus?: TaskStatus;
  onClose: () => void;
  onSubmit: (status: TaskStatus, note: string, stuckNotes?: string) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function TaskUpdateStatusDialog({
  open,
  task,
  allowedStatuses,
  presetStatus,
  onClose,
  onSubmit,
}: TaskUpdateStatusDialogProps) {
  const [status, setStatus] = useState<TaskStatus>(
    presetStatus ?? allowedStatuses[0] ?? task.status,
  );
  const [note, setNote] = useState("");
  const [stuckNotes, setStuckNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const needsStuckNotes = status === "stuck" || status === "butuh_bantuan";

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!status || status === task.status) {
      setError("Status baru wajib dipilih dan tidak boleh sama.");
      return;
    }

    if (!allowedStatuses.includes(status)) {
      setError("Status ini tidak tersedia untuk role Anda.");
      return;
    }

    if (needsStuckNotes && !stuckNotes.trim()) {
      setError("Catatan kendala wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(status, note.trim(), stuckNotes.trim());
      onClose();
    } catch {
      setError("Gagal memperbarui status task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Update Status</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.name}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              Tutup
            </Button>
          </div>
        </div>
        <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status baru</span>
            <select
              className={selectClassName}
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              {allowedStatuses.map((item) => (
                <option key={item} value={item}>
                  {TASK_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Catatan opsional" value={note} onChange={setNote} />
          {needsStuckNotes ? (
            <TextArea
              label="Catatan kendala"
              value={stuckNotes}
              onChange={setStuckNotes}
            />
          ) : null}
          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan status"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
      />
    </label>
  );
}
