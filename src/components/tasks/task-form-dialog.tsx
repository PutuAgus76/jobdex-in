"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, FolderOpen, Save } from "lucide-react";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-priority";
import { TASK_STATUS_OPTIONS } from "@/lib/task-status";
import { getTaskDateInputValue } from "@/lib/firebase/tasks";
import { NeoDatePicker } from "@/components/ui/neo-date-picker";
import {
  formatColorPalette,
  isValidHexColor,
  isValidUrl,
  parseColorPalette,
} from "@/lib/task-utils";
import type { Event, Task, TaskInput, TaskPriority, TaskStatus, TaskType, UserProfile } from "@/types";

type TaskFormDialogProps = {
  open: boolean;
  task: Task | null;
  users: UserProfile[];
  events: Event[];
  fallbackCoordinatorId: string;
  defaultEventId?: string;
  onClose: () => void;
  onSave: (input: TaskInput, taskId?: string) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function TaskFormDialog(props: TaskFormDialogProps) {
  if (!props.open) {
    return null;
  }

  return <TaskForm key={props.task?.id ?? props.defaultEventId ?? "new"} {...props} />;
}

function TaskForm({
  task,
  users,
  events,
  fallbackCoordinatorId,
  defaultEventId,
  onClose,
  onSave,
}: TaskFormDialogProps) {
  const [type, setType] = useState<TaskType>(task?.type ?? (defaultEventId ? "acara" : "divisi"));
  const [eventId, setEventId] = useState(task?.event_id ?? defaultEventId ?? "");
  const [name, setName] = useState(task?.name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [picId, setPicId] = useState(task?.pic_id ?? users[0]?.id ?? "");
  const [coordinatorId, setCoordinatorId] = useState(task?.coordinator_id ?? fallbackCoordinatorId);
  const [deadline, setDeadline] = useState(task ? getTaskDateInputValue(task.deadline) : "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "belum_dimulai");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "sedang");
  const [copywriting, setCopywriting] = useState(task?.copywriting ?? "");
  const [copywritingDocsUrl, setCopywritingDocsUrl] = useState(task?.copywriting_docs_url ?? "");
  const [designReferenceUrl, setDesignReferenceUrl] = useState(task?.design_reference_url ?? "");
  const [driveReferenceUrl, setDriveReferenceUrl] = useState(task?.drive_reference_url ?? "");
  const [colorPalette, setColorPalette] = useState(formatColorPalette(task?.color_palette ?? []));
  const [visualDirection, setVisualDirection] = useState(task?.visual_direction ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const colors = parseColorPalette(colorPalette);

    if (!name.trim()) {
      setError("Nama task wajib diisi.");
      return;
    }

    if (type === "acara" && !eventId) {
      setError("Event wajib dipilih untuk task acara.");
      return;
    }

    if (!picId || !coordinatorId || !deadline) {
      setError("PIC, koordinator, dan deadline wajib diisi.");
      return;
    }

    if (![copywritingDocsUrl, designReferenceUrl, driveReferenceUrl].every(isValidUrl)) {
      setError("URL harus valid dan diawali http/https jika diisi.");
      return;
    }

    if (!colors.every(isValidHexColor)) {
      setError("Color palette harus berupa hex color, contoh: #0f172a, #22c55e.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(
        {
          type,
          event_id: type === "acara" ? eventId : "",
          name: name.trim(),
          description: description.trim(),
          pic_id: picId,
          coordinator_id: coordinatorId,
          deadline,
          status,
          priority,
          copywriting,
          copywriting_docs_url: copywritingDocsUrl.trim(),
          design_reference_url: designReferenceUrl.trim(),
          drive_reference_url: driveReferenceUrl.trim(),
          color_palette: colors,
          visual_direction: visualDirection.trim(),
        },
        task?.id,
      );
      onClose();
    } catch {
      setError("Gagal menyimpan task. Periksa izin akses dan Firestore Rules.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-4xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
                {task ? "Edit Job Desk" : "Tambah Job Desk"}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Upload, status log, dan approval workflow masuk fase berikutnya.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              Tutup
            </Button>
          </div>
        </div>

        <form className="grid max-h-[78vh] gap-4 overflow-y-auto p-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama task">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Tipe task">
              <select className={selectClassName} value={type} onChange={(event) => setType(event.target.value as TaskType)}>
                <option value="divisi">Divisi</option>
                <option value="acara">Acara</option>
              </select>
            </Field>
          </div>

          {type === "acara" ? (
            <Field label="Event">
              <select className={selectClassName} value={eventId} onChange={(event) => setEventId(event.target.value)}>
                <option value="">Pilih event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </Field>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="PIC">
              <select className={selectClassName} value={picId} onChange={(event) => setPicId(event.target.value)}>
                <option value="">Pilih PIC</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name || user.email}</option>
                ))}
              </select>
            </Field>
            <Field label="Koordinator">
              <select className={selectClassName} value={coordinatorId} onChange={(event) => setCoordinatorId(event.target.value)}>
                <option value="">Pilih koordinator</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name || user.email}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Deadline">
              <NeoDatePicker value={deadline} onChange={setDeadline} />
            </Field>
            <Field label="Status">
              <select className={selectClassName} value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Prioritas">
              <select className={selectClassName} value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <TextArea label="Deskripsi" value={description} onChange={setDescription} />
          <TextArea label="Redaksi/copywriting" value={copywriting} onChange={setCopywriting} />

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Link Google Docs redaksi">
              <Input value={copywritingDocsUrl} onChange={(event) => setCopywritingDocsUrl(event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Link referensi desain">
              <Input value={designReferenceUrl} onChange={(event) => setDesignReferenceUrl(event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Link Google Drive referensi">
              <Input value={driveReferenceUrl} onChange={(event) => setDriveReferenceUrl(event.target.value)} placeholder="https://..." />
            </Field>
          </div>

          <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  Butuh inspirasi desain?
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Buka arsip referensi desain untuk melihat style lama, link Drive, dan palette.
                </p>
              </div>
              <Button asChild type="button" variant="secondary" size="sm">
                <Link href="/dashboard/references" target="_blank" className="flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4" />
                  Buka Referensi
                </Link>
              </Button>
            </div>
          </div>

          <Field label="Color palette">
            <Input value={colorPalette} onChange={(event) => setColorPalette(event.target.value)} placeholder="#0f172a, #22c55e" />
          </Field>
          <TextArea label="Arahan visual/supergrafis" value={visualDirection} onChange={setVisualDirection} />

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
              {isSubmitting ? "Menyimpan..." : "Simpan task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
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
        className="min-h-24 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
      />
    </label>
  );
}
