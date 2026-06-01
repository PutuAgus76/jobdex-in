import React, { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  parseReferenceExcelFile,
  normalizeExcelRows,
  convertDriveTreeToReferenceItems,
} from "@/lib/reference-excel-import";
import { bulkCreateDesignReferences } from "@/lib/firebase/design-reference-bulk";
import { showConfirm, showSuccess, showError, showWarning } from "@/lib/swal";
import type { DesignReference, DesignReferenceInput, UserProfile, Event } from "@/types";
import Swal from "sweetalert2";

interface ReferenceBulkImportDialogProps {
  open: boolean;
  events: Event[];
  existingReferences: DesignReference[];
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const inputClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-400";

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-500";

const textareaClassName =
  "w-full rounded-[8px] border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-500 min-h-[140px]";

// Helper for parsing pasted texts
function parsePasteTable(text: string): DesignReferenceInput[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const items: DesignReferenceInput[] = [];

  const idxTitle = header.findIndex((h) => h.includes("judul") || h.includes("title"));
  const idxScope = header.findIndex((h) => h.includes("scope") || h.includes("skope"));
  const idxEvent = header.findIndex((h) => h.includes("acara") || h.includes("event"));
  const idxYear = header.findIndex((h) => h.includes("tahun") || h.includes("year"));
  const idxCategory = header.findIndex((h) => h.includes("kategori") || h.includes("category"));
  const idxDrive = header.findIndex((h) => h.includes("drive"));
  const idxCanva = header.findIndex((h) => h.includes("canva"));
  const idxDocs = header.findIndex((h) => h.includes("docs") || h.includes("doc"));
  const idxNotes = header.findIndex((h) => h.includes("catatan") || h.includes("notes"));
  const idxVisual = header.findIndex(
    (h) => h.includes("arahan") || h.includes("visual") || h.includes("style")
  );

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split("\t").map((p) => p.trim());

    const title = idxTitle !== -1 ? parts[idxTitle] : "";
    const rawScope = idxScope !== -1 ? parts[idxScope] : "";
    const eventName = idxEvent !== -1 ? parts[idxEvent] : "";
    const yearVal = idxYear !== -1 ? parseInt(parts[idxYear], 10) : 0;
    const categoryVal = idxCategory !== -1 ? parts[idxCategory] : "";
    const driveVal = idxDrive !== -1 ? parts[idxDrive] : "";
    const canvaVal = idxCanva !== -1 ? parts[idxCanva] : "";
    const docsVal = idxDocs !== -1 ? parts[idxDocs] : "";
    const notesVal = idxNotes !== -1 ? parts[idxNotes] : "";
    const visualVal = idxVisual !== -1 ? parts[idxVisual] : "";

    if (!title && !driveVal) continue;

    const scope =
      rawScope.toLowerCase() === "acara" || rawScope.toLowerCase() === "event" ? "acara" : "divisi";
    const drive_links = driveVal ? [driveVal] : [];
    const canva_links = canvaVal ? [canvaVal] : [];
    const doc_links = docsVal ? [docsVal] : [];

    items.push({
      title: title || "Arsip Tanpa Judul",
      scope,
      event_name: eventName,
      year: yearVal || new Date().getFullYear(),
      design_type: "lainnya",
      drive_url: driveVal,
      thumbnail_url: "",
      style_notes: visualVal,
      color_palette: [],
      notes: notesVal,
      category: (categoryVal.toLowerCase() || "lainnya") as DesignReference["category"],
      drive_links,
      canva_links,
      doc_links,
      other_links: [],
      summary_notes: "Diimpor via Paste Tabel Google Sheets.",
      file_inventory_notes: "",
    });
  }

  return items;
}

function parsePastedReferences(text: string): DesignReferenceInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Check if it's tab-separated
  if (trimmed.includes("\t") && trimmed.split("\n")[0].split("\t").length > 2) {
    return parsePasteTable(trimmed);
  }

  const blockTexts = trimmed
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const items: DesignReferenceInput[] = [];

  for (const blockText of blockTexts) {
    const lines = blockText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let title = "";
    let scope: "divisi" | "acara" = "divisi";
    let event_name = "";
    let year = new Date().getFullYear();
    let category: DesignReference["category"] = "lainnya";
    let drive_url = "";
    let drive_links: string[] = [];
    let canva_links: string[] = [];
    let doc_links: string[] = [];
    let notes = "";
    let style_notes = "";

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const rawKey = line.slice(0, colonIndex).trim().toLowerCase();
      const val = line.slice(colonIndex + 1).trim();

      if (rawKey === "judul" || rawKey === "title") {
        title = val;
      } else if (rawKey === "scope" || rawKey === "skope") {
        scope = val.toLowerCase() === "acara" || val.toLowerCase() === "event" ? "acara" : "divisi";
      } else if (rawKey === "acara" || rawKey === "event") {
        event_name = val;
      } else if (rawKey === "tahun" || rawKey === "year") {
        year = parseInt(val, 10) || year;
      } else if (rawKey === "kategori" || rawKey === "category") {
        const lowerVal = val.toLowerCase();
        if (["divisi", "acara", "canva", "drive", "video", "dokumen", "lainnya"].includes(lowerVal)) {
          category = lowerVal as DesignReference["category"];
        } else {
          category = "lainnya";
        }
      } else if (rawKey === "drive") {
        drive_url = val;
        drive_links = [val];
      } else if (rawKey === "canva") {
        canva_links = [val];
      } else if (rawKey === "docs" || rawKey === "doc") {
        doc_links = [val];
      } else if (rawKey === "catatan" || rawKey === "notes") {
        notes = val;
      } else if (rawKey === "arahan visual" || rawKey === "style" || rawKey === "visual") {
        style_notes = val;
      }
    }

    if (title || drive_url) {
      items.push({
        title: title || "Arsip Tanpa Judul",
        scope,
        event_name,
        year,
        design_type: "lainnya",
        drive_url,
        thumbnail_url: "",
        style_notes,
        color_palette: [],
        notes,
        category,
        drive_links,
        canva_links,
        doc_links,
        other_links: [],
        summary_notes: "Diimpor via Paste Blok.",
        file_inventory_notes: "",
      });
    }
  }

  return items;
}

export function ReferenceBulkImportDialog({
  open,
  events,
  existingReferences,
  currentUser,
  onClose,
  onSuccess,
}: ReferenceBulkImportDialogProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "excel">("paste");

  // Paste Data states
  const [pastedText, setPastedText] = useState("");

  // Excel File states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRowsData, setExcelRowsData] = useState<Record<string, unknown>[]>([]);
  const [importMode, setImportMode] = useState<"per_row" | "per_parent_folder" | "one_large_archive">(
    "per_parent_folder"
  );

  // Default Metadata inputs
  const [defaultScope, setDefaultScope] = useState<"divisi" | "acara">("acara");
  const [defaultEventId, setDefaultEventId] = useState("");
  const [defaultYear, setDefaultYear] = useState(String(new Date().getFullYear()));
  const [defaultCategory, setDefaultCategory] = useState<
    "divisi" | "acara" | "canva" | "drive" | "video" | "dokumen" | "lainnya"
  >("drive");
  const [defaultNotes, setDefaultNotes] = useState("");
  const [defaultStyleNotes, setDefaultStyleNotes] = useState("");

  // Preview / Processing states
  const [previewItems, setPreviewItems] = useState<DesignReferenceInput[]>([]);
  const [previewGenerated, setPreviewGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultEventName = useMemo(() => {
    if (defaultScope !== "acara" || !defaultEventId) return "";
    return events.find((e) => e.id === defaultEventId)?.name || "";
  }, [defaultScope, defaultEventId, events]);

  // Duplicate Check logic
  const { duplicateIndices, hasDuplicates } = useMemo(() => {
    const indices = new Set<number>();
    previewItems.forEach((item, idx) => {
      const isDup = existingReferences.some((ref) => {
        // Match metadata
        const matchMeta =
          ref.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
          ref.year === item.year &&
          (ref.event_name || "").trim().toLowerCase() === (item.event_name || "").trim().toLowerCase();

        // Match links
        const existingLinks = [
          ref.drive_url,
          ...(ref.drive_links || []),
          ...(ref.canva_links || []),
          ...(ref.doc_links || []),
          ...(ref.other_links || []),
        ]
          .filter(Boolean)
          .map((l) => l.trim().toLowerCase());

        const itemLinks = [
          item.drive_url,
          ...(item.drive_links || []),
          ...(item.canva_links || []),
          ...(item.doc_links || []),
          ...(item.other_links || []),
        ]
          .filter(Boolean)
          .map((l) => l.trim().toLowerCase());

        const hasLinkOverlap = itemLinks.some((link) => existingLinks.includes(link));

        return matchMeta || hasLinkOverlap;
      });

      if (isDup) {
        indices.add(idx);
      }
    });

    return { duplicateIndices: indices, hasDuplicates: indices.size > 0 };
  }, [previewItems, existingReferences]);

  // Handler for Excel file choice
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      void showError("Silakan unggah berkas bertipe Excel (.xlsx).", "Format File Salah");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const rows = await parseReferenceExcelFile(file);
      setExcelFile(file);
      setExcelRowsData(rows);
      setPreviewGenerated(false);
      setPreviewItems([]);
    } catch {
      void showError("Gagal memproses file Excel.", "Error Parsing");
    }
  }

  // Handle Preview Data Generation
  function handleGeneratePreview() {
    let items: DesignReferenceInput[] = [];

    const options = {
      mode: importMode,
      scope: defaultScope,
      event_id: defaultScope === "acara" ? defaultEventId : "",
      event_name: defaultEventName,
      year: parseInt(defaultYear, 10) || new Date().getFullYear(),
      categoryDefault: defaultCategory,
      notesDefault: defaultNotes,
      styleNotesDefault: defaultStyleNotes,
    };

    if (activeTab === "paste") {
      if (!pastedText.trim()) {
        void showError("Harap tempel teks data Sheets terlebih dahulu.", "Data Kosong");
        return;
      }
      items = parsePastedReferences(pastedText);
    } else {
      if (!excelFile || excelRowsData.length === 0) {
        void showError("Harap pilih dan unggah file Excel (.xlsx) terlebih dahulu.", "File Belum Dipilih");
        return;
      }
      const normalized = normalizeExcelRows(excelRowsData);
      items = convertDriveTreeToReferenceItems(normalized, options);
    }

    if (items.length === 0) {
      void showError(
        "Tidak ada baris data valid yang berhasil diparse. Periksa kembali struktur input Anda.",
        "Gagal Memproses Data"
      );
      return;
    }

    if (items.length > 100) {
      void showError("Import maksimal 100 arsip sekali simpan.", "Batas Maksimal Terlewati");
      return;
    }

    // Apply defaults to items if metadata not explicitly set from paste
    const finalItems = items.map((it) => {
      // If it parsed default placeholders, override with our dialog defaults if empty
      return {
        ...it,
        scope: it.scope || defaultScope,
        event_id: it.event_id || (defaultScope === "acara" ? defaultEventId : ""),
        event_name: it.event_name || defaultEventName,
        year: it.year || parseInt(defaultYear, 10) || new Date().getFullYear(),
        style_notes: it.style_notes || defaultStyleNotes,
        notes: it.notes || defaultNotes,
        category: it.category || defaultCategory,
      };
    });

    setPreviewItems(finalItems);
    setPreviewGenerated(true);
  }

  // Handle Saving the Import Items
  async function handleSaveImport() {
    if (previewItems.length === 0) return;

    let itemsToSave = [...previewItems];
    if (skipDuplicates && duplicateIndices.size > 0) {
      itemsToSave = previewItems.filter((_, idx) => !duplicateIndices.has(idx));
    }

    if (itemsToSave.length === 0) {
      void showWarning("Semua item dalam preview terdeteksi duplikat dan diabaikan sesuai preferensi Anda.", "Tidak Ada Data Disimpan");
      return;
    }

    const confirmed = await showConfirm({
      title: "Konfirmasi Impor Massal",
      text: `Apakah Anda yakin ingin menyimpan ${itemsToSave.length} arsip referensi ke database?`,
      confirmButtonText: "Ya, Simpan Semua",
      cancelButtonText: "Batal",
      icon: "question",
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      await bulkCreateDesignReferences(itemsToSave, currentUser);
      void showSuccess(`Berhasil mengimpor ${itemsToSave.length} arsip referensi desain!`, "Impor Sukses");
      await onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error("[Bulk Import References] Save failed:", error);

      const err = error as Record<string, unknown>;
      const errorCode = err?.code ? `Error Code: ${err.code}` : "";
      const errorMessage = err?.message ? `Error Message: ${err.message}` : "";
      const errorFallback = !errorCode && !errorMessage ? `Raw Error: ${JSON.stringify(error) || String(error)}` : "";

      void Swal.fire({
        title: "Gagal menyimpan",
        html: `
          <div class="text-left space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <p>Data massal gagal disimpan ke database.</p>
            ${errorCode ? `<pre class="bg-slate-100 dark:bg-slate-950 p-2 rounded text-xs overflow-x-auto text-rose-600 dark:text-rose-400 font-mono mt-1">${errorCode}</pre>` : ""}
            ${errorMessage ? `<pre class="bg-slate-100 dark:bg-slate-950 p-2 rounded text-xs overflow-x-auto text-rose-600 dark:text-rose-400 font-mono mt-1">${errorMessage}</pre>` : ""}
            ${errorFallback ? `<pre class="bg-slate-100 dark:bg-slate-950 p-2 rounded text-xs overflow-x-auto text-rose-600 dark:text-rose-400 font-mono mt-1">${errorFallback}</pre>` : ""}
          </div>
        `,
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "jd-btn jd-btn-danger px-6 py-2 rounded-[8px]",
          popup: "rounded-[8px] bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
        },
        buttonsStyling: false,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    setPastedText("");
    setExcelFile(null);
    setExcelRowsData([]);
    setPreviewItems([]);
    setPreviewGenerated(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl overflow-hidden my-auto border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Bulk Import Arsip Referensi</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Impor puluhan folder/file referensi desain secara instan melalui tabel atau Drive Tree.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Tutup
          </Button>
        </div>

        {/* Scrollable Container */}
        <div className="max-h-[72vh] overflow-y-auto p-5 space-y-6">
          {/* Metadata Defaults */}
          <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Atur Default Metadata</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Scope Acara/Divisi</label>
                <select
                  className={selectClassName}
                  value={defaultScope}
                  onChange={(e) => setDefaultScope(e.target.value as "divisi" | "acara")}
                >
                  <option value="divisi">Divisi (Humas & Media Kreatif)</option>
                  <option value="acara">Acara</option>
                </select>
              </div>

              {defaultScope === "acara" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Pilihan Acara</label>
                  <select
                    className={selectClassName}
                    value={defaultEventId}
                    onChange={(e) => setDefaultEventId(e.target.value)}
                  >
                    <option value="">Pilih acara</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Tahun Kegiatan</label>
                <Input
                  type="number"
                  className={inputClassName}
                  value={defaultYear}
                  onChange={(e) => setDefaultYear(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Kategori Default</label>
                <select
                  className={selectClassName}
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value as "divisi" | "acara" | "canva" | "drive" | "video" | "dokumen" | "lainnya")}
                >
                  <option value="drive">Google Drive</option>
                  <option value="canva">Canva</option>
                  <option value="video">Video Dokumentasi</option>
                  <option value="dokumen">Dokumen/Docs</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Style Notes / Visual Direction Default</label>
                <Input
                  className={inputClassName}
                  value={defaultStyleNotes}
                  onChange={(e) => setDefaultStyleNotes(e.target.value)}
                  placeholder="Contoh: Modern HSL, dark mode, vibrant yellow glow"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan Default</label>
                <Input
                  className={inputClassName}
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  placeholder="Keterangan pendukung atau deskripsi umum untuk kumpulan arsip"
                />
              </div>
            </div>
          </div>

          {/* Selector Tabs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Pilih Metode Input</h3>
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
                  activeTab === "paste"
                    ? "border-slate-900 text-slate-950 dark:border-slate-100 dark:text-slate-50"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
                onClick={() => {
                  setActiveTab("paste");
                  setPreviewGenerated(false);
                }}
              >
                Paste Data Sheets
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
                  activeTab === "excel"
                    ? "border-slate-900 text-slate-950 dark:border-slate-100 dark:text-slate-50"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
                onClick={() => {
                  setActiveTab("excel");
                  setPreviewGenerated(false);
                }}
              >
                Upload Excel (.xlsx)
              </button>
            </div>

            {/* TAB CONTENT: PASTE */}
            {activeTab === "paste" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tempel data Anda dari Google Sheets (termasuk baris header). Format kolom yang dikenali: <br />
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400 text-[10px]">
                    Judul | Scope | Acara | Tahun | Kategori | Drive | Canva | Docs | Catatan | Arahan Visual
                  </code>
                </p>
                <textarea
                  className={textareaClassName}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Tempel kolom-kolom tab-separated atau data blok key-value di sini..."
                />
              </div>
            )}

            {/* TAB CONTENT: EXCEL */}
            {activeTab === "excel" && (
              <div className="grid gap-4 sm:grid-cols-2 rounded-[8px] border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/20">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">File Excel (.xlsx) hasil Apps Script</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white dark:file:bg-slate-100 dark:file:text-slate-900 hover:file:opacity-90"
                  />
                  {excelFile && (
                    <p className="text-xs text-emerald-600 font-medium">
                      ✓ Terbaca: {excelRowsData.length} baris data mentah.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Mode Pengelompokan Arsip</label>
                  <select
                    className={selectClassName}
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as "per_row" | "per_parent_folder" | "one_large_archive")}
                  >
                    <option value="per_parent_folder">Kelompokkan Per Folder Induk (Direkomendasikan)</option>
                    <option value="per_row">Per Baris (Satu baris = Satu arsip)</option>
                    <option value="one_large_archive">Satu Arsip Besar (Semua file digabung)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    * Per Folder Induk mengemas semua file dalam folder yang sama menjadi satu arsip referensi dengan daftar file lengkap di inventori.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-start">
              <Button type="button" onClick={handleGeneratePreview}>
                Generate Preview Data
              </Button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          {previewGenerated && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-[8px] p-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Hasil Analisis Preview Impor</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Ditemukan {previewItems.length} arsip referensi siap disimpan.
                  </p>
                </div>

                {hasDuplicates && (
                  <label className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded"
                    />
                    Abaikan item kemungkinan duplikat ({duplicateIndices.size} item)
                  </label>
                )}
              </div>

              {/* Preview Cards / Table */}
              <div className="overflow-x-auto rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">Judul Referensi</th>
                      <th className="px-3 py-2">Scope</th>
                      <th className="px-3 py-2">Tahun / Acara</th>
                      <th className="px-3 py-2">Tautan (Drive/Canva/Docs/Lain)</th>
                      <th className="px-3 py-2">Catatan Visual</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {previewItems.map((item, idx) => {
                      const isDup = duplicateIndices.has(idx);
                      const isTitleEmpty = !item.title || item.title === "Arsip Tanpa Judul";
                      const isLinkEmpty =
                        (item.drive_links?.length || 0) === 0 &&
                        (item.canva_links?.length || 0) === 0 &&
                        (item.doc_links?.length || 0) === 0 &&
                        (item.other_links?.length || 0) === 0;

                      let statusBadge = (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Valid
                        </span>
                      );

                      if (isDup) {
                        statusBadge = (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            Duplikat?
                          </span>
                        );
                      } else if (isTitleEmpty) {
                        statusBadge = (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                            Judul Kosong
                          </span>
                        );
                      } else if (isLinkEmpty) {
                        statusBadge = (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                            Link Kosong
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 ${
                            isDup && skipDuplicates ? "opacity-45 bg-slate-50/50 dark:bg-slate-900/20" : ""
                          }`}
                        >
                          <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">{item.title}</td>
                          <td className="px-3 py-3 capitalize text-slate-500 dark:text-slate-400">{item.scope}</td>
                          <td className="px-3 py-3">
                            <span className="font-medium">{item.year}</span> <br />
                            <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                              {item.event_name || "Divisi Humas"}
                            </span>
                          </td>
                           <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                            {item.file_inventory && item.file_inventory.length > 0 ? (
                              <div className="space-y-1 text-[10px]">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  Folder: <span className={item.drive_links && item.drive_links.length > 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                    {item.drive_links && item.drive_links.length > 0 ? "ada" : "tidak ada"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-700 dark:text-slate-300">
                                    File: {item.file_inventory.length}
                                  </span>
                                  {item.file_inventory.filter((f) => f.mime_type?.toLowerCase().includes("audio")).length > 0 && (
                                    <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                      Audio: {item.file_inventory.filter((f) => f.mime_type?.toLowerCase().includes("audio")).length}
                                    </span>
                                  )}
                                  {item.file_inventory.filter((f) => f.mime_type?.toLowerCase().includes("video")).length > 0 && (
                                    <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                                      Video: {item.file_inventory.filter((f) => f.mime_type?.toLowerCase().includes("video")).length}
                                    </span>
                                  )}
                                  {item.file_inventory.filter((f) => f.mime_type?.toLowerCase().includes("image")).length > 0 && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                      Image: {item.file_inventory.filter((f) => f.mime_type?.toLowerCase().includes("image")).length}
                                    </span>
                                  )}
                                  {item.file_inventory.filter((f) => 
                                    f.mime_type?.toLowerCase().includes("document") || 
                                    f.mime_type?.toLowerCase().includes("pdf") ||
                                    f.mime_type?.toLowerCase().includes("sheet")
                                  ).length > 0 && (
                                    <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                      Docs: {item.file_inventory.filter((f) => 
                                        f.mime_type?.toLowerCase().includes("document") || 
                                        f.mime_type?.toLowerCase().includes("pdf") ||
                                        f.mime_type?.toLowerCase().includes("sheet")
                                      ).length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 text-[10px]">
                                <span className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">
                                  Drive: {item.drive_links?.length || 0}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">
                                  Canva: {item.canva_links?.length || 0}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">
                                  Docs: {item.doc_links?.length || 0}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 max-w-[200px] truncate text-slate-500 dark:text-slate-400">
                            {item.style_notes || "-"}
                          </td>
                          <td className="px-3 py-3 text-center">{statusBadge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-5 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/40">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSaveImport}
            disabled={isSaving || previewItems.length === 0}
          >
            {isSaving ? "Menyimpan..." : "Simpan Semua"}
          </Button>
        </div>
      </div>
    </div>
  );
}
