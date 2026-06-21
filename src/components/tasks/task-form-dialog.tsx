"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
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
import {
  getMainCategories,
  getSubcategories,
  getCategoryRule,
  getDefaultArchiveSettings,
  MAIN_CATEGORIES,
  inferJobdeskCategoryFromText,
} from "@/lib/jobdesk-categories";
import { useAuth } from "@/hooks/use-auth";
import { runRuleBasedDetection, mapOutputToSensitivity, type DetectJobdeskCategoryResult } from "@/lib/jobdesk-category-detection";

function formatDetectionReason(result: DetectJobdeskCategoryResult): string {
  if (result.source === "rule_based") {
    const subLabel = result.category_key && result.subcategory_key
      ? getCategoryRule(result.category_key, result.subcategory_key)?.subcategoryLabel ?? ""
      : "";
    const keyword = result.matched_keywords?.[0] || "";
    const confPercent = Math.round(result.confidence * 100);
    return `Terdeteksi sebagai ${subLabel} berdasarkan kata kunci "${keyword}" dengan confidence ${confPercent}%.`;
  }
  if (result.source === "reference_similarity") {
    return `Terdeteksi mengikuti pola referensi lama: ${result.matched_reference_title || result.reason}.`;
  }
  if (result.source === "ai_fallback") {
    return result.reason || "AI menyarankan kategori ini karena rule-based belum yakin.";
  }
  return result.reason || "Belum bisa mendeteksi kategori dengan yakin. Silakan pilih kategori manual.";
}

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
  const { user } = useAuth();
  const [isDetecting, setIsDetecting] = useState(false);
  const [localSuggestion, setLocalSuggestion] = useState<{
    categoryKey: string;
    subcategoryKey: string;
    categoryLabel: string;
    subcategoryLabel: string;
    reason: string;
  } | null>(null);

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

  // Run category suggestion on initialization for existing task without category
  const initialSuggestion = (() => {
    if (task && !task.category_key) {
      const result = inferJobdeskCategoryFromText({
        title: task.name,
        description: task.description,
      });
      if (result) {
        const catLabel = MAIN_CATEGORIES.find((c) => c.key === result.categoryKey)?.label ?? "";
        const subLabel = getCategoryRule(result.categoryKey, result.subcategoryKey)?.subcategoryLabel ?? "";
        return {
          categoryKey: result.categoryKey,
          subcategoryKey: result.subcategoryKey,
          categoryLabel: catLabel,
          subcategoryLabel: subLabel,
          reason: result.reason,
        };
      }
    }
    return null;
  })();

  const initialDefaults = initialSuggestion
    ? getDefaultArchiveSettings(initialSuggestion.categoryKey, initialSuggestion.subcategoryKey)
    : null;

  const [categoryKey, setCategoryKey] = useState(task?.category_key ?? initialSuggestion?.categoryKey ?? "");
  const [subcategoryKey, setSubcategoryKey] = useState(task?.subcategory_key ?? initialSuggestion?.subcategoryKey ?? "");
  const [outputTypes, setOutputTypes] = useState(
    task?.category_key
      ? (task?.output_types ?? []).join(", ")
      : (initialDefaults?.outputTypes.join(", ") ?? "")
  );
  const [archiveEnabled, setArchiveEnabled] = useState(
    task?.category_key
      ? (task?.archive_enabled ?? true)
      : (initialDefaults ? initialDefaults.archiveEnabled : true)
  );
  const [referenceCandidateEnabled, setReferenceCandidateEnabled] = useState(
    task?.category_key
      ? (task?.reference_candidate_enabled ?? false)
      : (initialDefaults ? initialDefaults.referenceCandidateEnabled : false)
  );
  const [requiresFile, setRequiresFile] = useState(
    task?.category_key
      ? (task?.requires_file ?? false)
      : (initialDefaults ? initialDefaults.requiresFile : false)
  );
  const [requiresSourceLink, setRequiresSourceLink] = useState(
    task?.category_key
      ? (task?.requires_source_link ?? false)
      : (initialDefaults ? initialDefaults.requiresSourceLink : false)
  );
  const [sourceLink, setSourceLink] = useState(task?.source_link ?? "");
  const [archiveNotes, setArchiveNotes] = useState(task?.archive_notes ?? "");
  const [dataSensitivity, setDataSensitivity] = useState(
    task?.category_key
      ? (task?.data_sensitivity ?? "normal")
      : (initialDefaults ? initialDefaults.dataSensitivity : "normal")
  );

  const [suggestion, setSuggestion] = useState<{
    categoryKey: string;
    subcategoryKey: string;
    categoryLabel: string;
    subcategoryLabel: string;
    reason: string;
  } | null>(initialSuggestion);

  const handleManualDetect = async () => {
    if (!name.trim()) {
      setError("Nama task wajib diisi untuk mendeteksi kategori.");
      return;
    }

    setIsDetecting(true);
    setError("");
    setSuggestion(null);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error("Sesi login Anda tidak valid atau kedaluwarsa.");
      }

      const event = events.find((e) => e.id === eventId);
      const eventName = event ? event.name : "";

      const res = await fetch("/api/tasks/detect-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: name,
          description: description,
          eventName: eventName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mendeteksi kategori.");
      }

      const result = await res.json();

      if (result) {
        const formattedReason = formatDetectionReason(result);

        if (result.category_key && result.subcategory_key) {
          const catLabel = MAIN_CATEGORIES.find((c) => c.key === result.category_key)?.label ?? "";
          const subLabel = getCategoryRule(result.category_key, result.subcategory_key)?.subcategoryLabel ?? "";

          setSuggestion({
            categoryKey: result.category_key,
            subcategoryKey: result.subcategory_key,
            categoryLabel: catLabel,
            subcategoryLabel: subLabel,
            reason: formattedReason,
          });

          // Populate the fields
          setCategoryKey(result.category_key);
          setSubcategoryKey(result.subcategory_key);
          setArchiveEnabled(result.archive_enabled);
          setReferenceCandidateEnabled(result.reference_candidate_enabled);
          
          // Map data sensitivity
          const mappedSensitivity = mapOutputToSensitivity(result.data_sensitivity);
          setDataSensitivity(mappedSensitivity);

          // Get and set requiresFile, requiresSourceLink, and outputTypes using the client-side helper
          const defaults = getDefaultArchiveSettings(result.category_key, result.subcategory_key);
          setRequiresFile(defaults.requiresFile);
          setRequiresSourceLink(defaults.requiresSourceLink);
          setOutputTypes(defaults.outputTypes.join(", "));
        } else {
          // If category/subcategory is null, reset suggestion and show feedback in suggestion state
          setSuggestion({
            categoryKey: "",
            subcategoryKey: "",
            categoryLabel: "",
            subcategoryLabel: "",
            reason: formattedReason,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendeteksi kategori.");
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (!name.trim()) {
      const timer = setTimeout(() => {
        setLocalSuggestion(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      const result = runRuleBasedDetection(name, description);
      if (result && result.category_key && result.subcategory_key) {
        // Only show suggestion if it's different from current manual selection
        if (
          result.category_key !== categoryKey ||
          result.subcategory_key !== subcategoryKey
        ) {
          const catLabel = MAIN_CATEGORIES.find((c) => c.key === result.category_key)?.label ?? "";
          const subLabel = getCategoryRule(result.category_key, result.subcategory_key)?.subcategoryLabel ?? "";
          setLocalSuggestion({
            categoryKey: result.category_key,
            subcategoryKey: result.subcategory_key,
            categoryLabel: catLabel,
            subcategoryLabel: subLabel,
            reason: `Terdeteksi dari kata kunci "${result.matched_keywords?.[0] || ""}"`,
          });
          return;
        }
      }
      setLocalSuggestion(null);
    }, 500);

    return () => clearTimeout(timer);
  }, [name, description, categoryKey, subcategoryKey]);

  const handleCategoryChange = (catKey: string) => {
    setCategoryKey(catKey);
    setSubcategoryKey("");
    setOutputTypes("");
    setArchiveEnabled(true);
    setReferenceCandidateEnabled(false);
    setRequiresFile(false);
    setRequiresSourceLink(false);
    setDataSensitivity("normal");
  };

  const handleSubcategoryChange = (subKey: string) => {
    setSubcategoryKey(subKey);
    if (categoryKey && subKey) {
      const defaults = getDefaultArchiveSettings(categoryKey, subKey);
      setArchiveEnabled(defaults.archiveEnabled);
      setReferenceCandidateEnabled(defaults.referenceCandidateEnabled);
      setRequiresFile(defaults.requiresFile);
      setRequiresSourceLink(defaults.requiresSourceLink);
      setOutputTypes(defaults.outputTypes.join(", "));
      setDataSensitivity(defaults.dataSensitivity);
    }
  };

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
          category_key: categoryKey,
          category_label: MAIN_CATEGORIES.find((c) => c.key === categoryKey)?.label ?? "",
          subcategory_key: subcategoryKey,
          subcategory_label: categoryKey && subcategoryKey ? getCategoryRule(categoryKey, subcategoryKey)?.subcategoryLabel ?? "" : "",
          output_types: outputTypes.split(",").map((t) => t.trim()).filter(Boolean),
          archive_enabled: archiveEnabled,
          reference_candidate_enabled: referenceCandidateEnabled,
          requires_file: requiresFile,
          requires_source_link: requiresSourceLink,
          source_link: sourceLink.trim(),
          archive_notes: archiveNotes.trim(),
          data_sensitivity: dataSensitivity as "normal" | "internal" | "sensitive",
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

          {/* Section: Pengarsipan & Referensi */}
          <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">
                  Pengarsipan &amp; Referensi
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Rule otomatis berjalan berdasarkan kategori dan subkategori pilihan. Anda tetap dapat mengubah pilihan pengarsipan/referensi secara manual.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualDetect}
                disabled={isDetecting}
                className="text-xs shrink-0"
              >
                {isDetecting ? "Mendeteksi..." : "Deteksi otomatis dari judul"}
              </Button>
            </div>

            {suggestion && categoryKey === suggestion.categoryKey && subcategoryKey === suggestion.subcategoryKey ? (
              <div className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs font-medium ${
                suggestion.categoryKey
                  ? "border-sky-100 bg-sky-50/50 text-sky-800 dark:border-sky-950/30 dark:bg-sky-950/20 dark:text-sky-350"
                  : "border-amber-100 bg-amber-50/50 text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-350"
              }`}>
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  suggestion.categoryKey
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                }`}>
                  {suggestion.categoryKey ? "Kategori disarankan otomatis" : "Deteksi Kategori"}
                </span>
                <span className="font-medium">
                  {suggestion.reason}
                </span>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kategori Utama">
                <select
                  className={selectClassName}
                  value={categoryKey}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                >
                  <option value="">Pilih kategori utama (opsional)</option>
                  {getMainCategories().map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Subkategori">
                <select
                  className={selectClassName}
                  value={subcategoryKey}
                  onChange={(event) => handleSubcategoryChange(event.target.value)}
                  disabled={!categoryKey}
                >
                  <option value="">Pilih subkategori</option>
                  {categoryKey && getSubcategories(categoryKey).map((sub) => (
                    <option key={sub.key} value={sub.key}>{sub.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {localSuggestion && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Saran:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryKey(localSuggestion.categoryKey);
                    setSubcategoryKey(localSuggestion.subcategoryKey);
                    const defaults = getDefaultArchiveSettings(localSuggestion.categoryKey, localSuggestion.subcategoryKey);
                    setArchiveEnabled(defaults.archiveEnabled);
                    setReferenceCandidateEnabled(defaults.referenceCandidateEnabled);
                    setRequiresFile(defaults.requiresFile);
                    setRequiresSourceLink(defaults.requiresSourceLink);
                    setOutputTypes(defaults.outputTypes.join(", "));
                    setDataSensitivity(defaults.dataSensitivity);
                    setLocalSuggestion(null);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  {localSuggestion.categoryLabel} &gt; {localSuggestion.subcategoryLabel}
                </button>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  ({localSuggestion.reason})
                </span>
              </div>
            )}

            {categoryKey && subcategoryKey ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 p-3 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <input
                      type="checkbox"
                      id="archiveEnabled"
                      checked={archiveEnabled}
                      onChange={(e) => setArchiveEnabled(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="archiveEnabled" className="text-xs font-semibold text-slate-900 dark:text-slate-100 select-none cursor-pointer">
                      Masuk Arsip Acara
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Direkomendasikan
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <input
                      type="checkbox"
                      id="referenceCandidateEnabled"
                      checked={referenceCandidateEnabled}
                      onChange={(e) => setReferenceCandidateEnabled(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="referenceCandidateEnabled" className="text-xs font-semibold text-slate-900 dark:text-slate-100 select-none cursor-pointer">
                      Kandidat Referensi
                      <span className="block text-[10px] text-slate-500 font-medium">
                        {dataSensitivity === "sensitive" ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Sensitif (Tidak disarankan)</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Direkomendasikan</span>
                        )}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <input
                      type="checkbox"
                      id="requiresFile"
                      checked={requiresFile}
                      onChange={(e) => setRequiresFile(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="requiresFile" className="text-xs font-semibold text-slate-900 dark:text-slate-100 select-none cursor-pointer">
                      Wajib File Hasil
                      <span className="block text-[10px] text-slate-500 font-medium">
                        Soft warning saat upload
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 p-3 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <input
                      type="checkbox"
                      id="requiresSourceLink"
                      checked={requiresSourceLink}
                      onChange={(e) => setRequiresSourceLink(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="requiresSourceLink" className="text-xs font-semibold text-slate-900 dark:text-slate-100 select-none cursor-pointer">
                      Wajib Link Sumber
                      <span className="block text-[10px] text-slate-500 font-medium">
                        Canva/Figma/Docs/Sheets
                      </span>
                    </label>
                  </div>

                  <Field label="Sensitivitas Data">
                    <select
                      className="h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none"
                      value={dataSensitivity}
                      onChange={(e) => setDataSensitivity(e.target.value as "normal" | "internal" | "sensitive")}
                    >
                      <option value="normal">Normal (Public/Shareable)</option>
                      <option value="internal">Internal (Panitia saja)</option>
                      <option value="sensitive">Sensitive (Data Pribadi/Bayar)</option>
                    </select>
                  </Field>

                  <Field label="Jenis Output">
                    <Input
                      placeholder="image, pdf, canva_link"
                      value={outputTypes}
                      onChange={(e) => setOutputTypes(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Link Sumber (Figma/Canva/Workspace/Drive)">
                    <Input
                      placeholder="https://..."
                      value={sourceLink}
                      onChange={(e) => setSourceLink(e.target.value)}
                    />
                  </Field>

                  <Field label="Catatan Arsip / Serah Terima">
                    <Input
                      placeholder="Contoh: Upload format PDF..."
                      value={archiveNotes}
                      onChange={(e) => setArchiveNotes(e.target.value)}
                    />
                  </Field>
                </div>
              </>
            ) : null}
          </div>

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
