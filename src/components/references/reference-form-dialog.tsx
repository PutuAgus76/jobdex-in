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
} from "@/types";

type ReferenceFormDialogProps = {
  open: boolean;
  reference: DesignReference | null;
  onClose: () => void;
  onSave: (input: DesignReferenceInput, referenceId?: string) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export function ReferenceFormDialog(props: ReferenceFormDialogProps) {
  if (!props.open) {
    return null;
  }

  return <ReferenceForm key={props.reference?.id ?? "new"} {...props} />;
}

function ReferenceForm({
  reference,
  onClose,
  onSave,
}: ReferenceFormDialogProps) {
  const [title, setTitle] = useState(reference?.title ?? "");
  const [eventName, setEventName] = useState(reference?.event_name ?? "");
  const [designType, setDesignType] = useState<DesignType>(
    reference?.design_type ?? "poster",
  );
  const [year, setYear] = useState(String(reference?.year ?? new Date().getFullYear()));
  const [driveUrl, setDriveUrl] = useState(reference?.drive_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(reference?.thumbnail_url ?? "");
  const [styleNotes, setStyleNotes] = useState(reference?.style_notes ?? "");
  const [colorPalette, setColorPalette] = useState(
    formatColorPalette(reference?.color_palette ?? []),
  );
  const [notes, setNotes] = useState(reference?.notes ?? "");
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

    if (!designType) {
      setError("Jenis desain wajib dipilih.");
      return;
    }

    if (!isReasonableReferenceYear(parsedYear)) {
      setError("Tahun wajib berupa angka 2020 sampai 2035.");
      return;
    }

    if (![driveUrl, thumbnailUrl].every(isValidUrl)) {
      setError("URL harus valid dan diawali http/https jika diisi.");
      return;
    }

    if (!colors.every(isValidHexColor)) {
      setError("Color palette harus berupa hex color, contoh: #185FA5, #E6F1FB.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(
        {
          title: title.trim(),
          event_name: eventName.trim(),
          design_type: designType,
          year: parsedYear,
          drive_url: driveUrl.trim(),
          thumbnail_url: thumbnailUrl.trim(),
          style_notes: styleNotes.trim(),
          color_palette: colors,
          notes: notes.trim(),
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
      <div className="w-full max-w-3xl rounded-[8px] bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {reference ? "Edit Referensi" : "Tambah Referensi"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Catat inspirasi desain, link Drive, palette, dan arahan visual.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        <form className="grid max-h-[78vh] gap-4 overflow-y-auto p-5" onSubmit={handleSubmit}>
          <Field label="Judul referensi">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nama acara">
              <Input value={eventName} onChange={(event) => setEventName(event.target.value)} />
            </Field>
            <Field label="Jenis desain">
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
            <Field label="Tahun">
              <Input
                type="number"
                min={2020}
                max={2035}
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Link Google Drive">
              <Input
                value={driveUrl}
                onChange={(event) => setDriveUrl(event.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </Field>
            <Field label="Thumbnail URL">
              <Input
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Color palette">
            <Input
              value={colorPalette}
              onChange={(event) => setColorPalette(event.target.value)}
              placeholder="#185FA5, #378ADD, #E6F1FB"
            />
          </Field>
          <TextArea label="Style notes/supergrafis" value={styleNotes} onChange={setStyleNotes} />
          <TextArea label="Catatan tambahan" value={notes} onChange={setNotes} />

          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
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
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
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
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}
