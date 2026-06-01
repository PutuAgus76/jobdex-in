"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatColorPalette,
  isReasonableReferenceYear,
  isValidHexColor,
  isValidUrl,
  parseColorPalette,
} from "@/lib/color-utils";
import { DESIGN_TYPE_OPTIONS } from "@/lib/design-types";
import type {
  DesignReference,
  DesignReferenceInput,
  DesignType,
  Event,
} from "@/types";

type ReferenceFormDialogProps = {
  open: boolean;
  reference: DesignReference | null;
  events?: Event[];
  onClose: () => void;
  onSave: (input: DesignReferenceInput, referenceId?: string) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function ReferenceFormDialog(props: ReferenceFormDialogProps) {
  if (!props.open) {
    return null;
  }

  return <ReferenceForm key={props.reference?.id ?? "new"} {...props} />;
}

const parseMultipleLinks = (text: string): string[] => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const formatMultipleLinks = (links: string[] | undefined): string => {
  if (!links) return "";
  return links.join("\n");
};

function ReferenceForm({
  reference,
  events = [],
  onClose,
  onSave,
}: ReferenceFormDialogProps) {
  const [title, setTitle] = useState(reference?.title ?? "");
  const [scope, setScope] = useState<"divisi" | "acara">(reference?.scope ?? "divisi");
  const [category, setCategory] = useState<
    "divisi" | "acara" | "canva" | "drive" | "video" | "dokumen" | "lainnya"
  >(reference?.category ?? "lainnya");
  const [selectedEventId, setSelectedEventId] = useState(reference?.event_id ?? "");
  const [designType, setDesignType] = useState<DesignType>(
    reference?.design_type ?? "poster",
  );
  const [year, setYear] = useState(String(reference?.year ?? new Date().getFullYear()));
  const [thumbnailUrl, setThumbnailUrl] = useState(reference?.thumbnail_url ?? "");
  const [styleNotes, setStyleNotes] = useState(reference?.style_notes ?? "");
  const [colorPalette, setColorPalette] = useState(
    formatColorPalette(reference?.color_palette ?? []),
  );
  const [notes, setNotes] = useState(reference?.notes ?? "");
  const summaryNotes = reference?.summary_notes ?? "";
  const [fileInventoryNotes, setFileInventoryNotes] = useState(
    reference?.file_inventory_notes ?? "",
  );

  // Textarea multi links states
  const [driveLinksText, setDriveLinksText] = useState(
    formatMultipleLinks(reference?.drive_links ?? (reference?.drive_url ? [reference.drive_url] : [])),
  );
  const [canvaLinksText, setCanvaLinksText] = useState(
    formatMultipleLinks(reference?.canva_links ?? []),
  );
  const [docLinksText, setDocLinksText] = useState(
    formatMultipleLinks(reference?.doc_links ?? []),
  );
  const [otherLinksText, setOtherLinksText] = useState(
    formatMultipleLinks(reference?.other_links ?? []),
  );

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedYear = Number(year);
    const colors = parseColorPalette(colorPalette);

    if (!title.trim()) {
      setError("Judul referensi wajib diisi.");
      return;
    }

    if (!isReasonableReferenceYear(parsedYear)) {
      setError("Tahun wajib berupa angka 2020 sampai 2035.");
      return;
    }

    if (thumbnailUrl && !isValidUrl(thumbnailUrl)) {
      setError("Thumbnail URL harus valid jika diisi.");
      return;
    }

    if (!colors.every(isValidHexColor)) {
      setError("Color palette harus berupa hex color, contoh: #185FA5, #E6F1FB.");
      return;
    }

    const driveLinks = parseMultipleLinks(driveLinksText);
    const canvaLinks = parseMultipleLinks(canvaLinksText);
    const docLinks = parseMultipleLinks(docLinksText);
    const otherLinks = parseMultipleLinks(otherLinksText);

    // Validate links format
    const allParsedLinks = [...driveLinks, ...canvaLinks, ...docLinks, ...otherLinks];
    for (const url of allParsedLinks) {
      if (!isValidUrl(url)) {
        setError(`Tautan "${url}" harus berupa URL yang valid (diawali http/https).`);
        return;
      }
    }

    setIsSubmitting(true);

    // Get event name if scope is acara and event exists
    let resolvedEventName = "";
    if (scope === "acara" && selectedEventId) {
      const foundEvent = events.find((e) => e.id === selectedEventId);
      if (foundEvent) {
        resolvedEventName = foundEvent.name;
      }
    }

    try {
      await onSave(
        {
          title: title.trim(),
          event_name: resolvedEventName,
          design_type: designType,
          year: parsedYear,
          drive_url: driveLinks[0] || "",
          thumbnail_url: thumbnailUrl.trim(),
          style_notes: styleNotes.trim(),
          color_palette: colors,
          notes: notes.trim(),

          // New fields
          scope,
          category,
          event_id: scope === "acara" ? selectedEventId : "",
          drive_links: driveLinks,
          canva_links: canvaLinks,
          doc_links: docLinks,
          other_links: otherLinks,
          summary_notes: summaryNotes.trim(),
          file_inventory_notes: fileInventoryNotes.trim(),
        },
        reference?.id,
      );
      onClose();
    } catch {
      setError("Gagal menyimpan referensi. Periksa izin akses dan Firestore Rules.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-4xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl my-auto">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
                {reference ? "Edit Referensi" : "Tambah Referensi"}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Catat inspirasi desain, link Drive, Canva, Google Docs, dan visual notes.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        <form className="grid max-h-[78vh] gap-4 overflow-y-auto p-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Judul referensi">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Branding Raker 2026" />
            </Field>
            <div className="grid gap-4 grid-cols-2">
              <Field label="Skope">
                <select
                  className={selectClassName}
                  value={scope}
                  onChange={(event) => setScope(event.target.value as "divisi" | "acara")}
                >
                  <option value="divisi">Divisi (Humas & Medkreatif)</option>
                  <option value="acara">Acara khusus</option>
                </select>
              </Field>
              <Field label="Kategori">
                <select
                  className={selectClassName}
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value as
                        | "divisi"
                        | "acara"
                        | "canva"
                        | "drive"
                        | "video"
                        | "dokumen"
                        | "lainnya",
                    )
                  }
                >
                  <option value="drive">Google Drive</option>
                  <option value="canva">Canva</option>
                  <option value="dokumen">Dokumen Docs/PDF</option>
                  <option value="video">Video</option>
                  <option value="divisi">Arsip Divisi</option>
                  <option value="acara">Arsip Acara</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {scope === "acara" ? (
              <Field label="Pilih Acara">
                <select
                  className={selectClassName}
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                >
                  <option value="">-- Pilih Acara --</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Nama Acara (Opsional)">
                <Input
                  value={scope === "divisi" ? "Divisi Humas & Media Kreatif" : ""}
                  disabled
                  placeholder="Skope divisi otomatis terisi"
                />
              </Field>
            )}

            <Field label="Jenis desain (Visual)">
              <select
                className={selectClassName}
                value={designType}
                onChange={(event) => setDesignType(event.target.value as DesignType)}
              >
                {DESIGN_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tahun Kegiatan">
              <Input
                type="number"
                min={2020}
                max={2035}
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </Field>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Tautan Referensi Ganda (Salin link satu per baris)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <TextArea
                label="Google Drive Link(s)"
                value={driveLinksText}
                onChange={setDriveLinksText}
                placeholder="https://drive.google.com/drive/folders/...&#10;https://drive.google.com/open?id=..."
              />
              <TextArea
                label="Canva Link(s)"
                value={canvaLinksText}
                onChange={setCanvaLinksText}
                placeholder="https://www.canva.com/design/...&#10;https://www.canva.com/templates/..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-3">
              <TextArea
                label="Google Docs / Google Sheets Link(s)"
                value={docLinksText}
                onChange={setDocLinksText}
                placeholder="https://docs.google.com/document/d/...&#10;https://docs.google.com/spreadsheets/d/..."
              />
              <TextArea
                label="Tautan Lainnya (Video / Website)"
                value={otherLinksText}
                onChange={setOtherLinksText}
                placeholder="https://youtube.com/watch?...&#10;https://pinterest.com/pin/..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Thumbnail Cover URL">
              <Input
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                placeholder="Tampilkan preview gambar dengan menempelkan link image langsung (.png/.jpg)"
              />
            </Field>
            <Field label="Color Palette (Pisahkan dengan koma)">
              <Input
                value={colorPalette}
                onChange={(event) => setColorPalette(event.target.value)}
                placeholder="#185FA5, #EF9F27, #FFFFFF"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TextArea
              label="Style Notes / Supergrafis / Visual Direction"
              value={styleNotes}
              onChange={setStyleNotes}
              placeholder="Modern, clean, biru elegan, doodle art, neon lights, grid lines"
            />
            <TextArea
              label="Rangkuman Analisis Gemini (File Inventory)"
              value={fileInventoryNotes}
              onChange={setFileInventoryNotes}
              placeholder="Hasil interogasi Gemini mengenai folder Drive:&#10;- nama_folder/logo.png: Logo resolusi tinggi&#10;- assets/supergrafis.pdf: Elemen grafis"
            />
            <TextArea
              label="Catatan & Catatan Tambahan"
              value={notes}
              onChange={setNotes}
              placeholder="Catatan tambahan mengenai penggunaan aset referensi"
            />
          </div>

          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan referensi"}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-24 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
      />
    </label>
  );
}
