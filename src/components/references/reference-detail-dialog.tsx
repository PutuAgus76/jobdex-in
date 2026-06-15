"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPalettePreview } from "@/components/references/color-palette-preview";
import { DesignTypeBadge } from "@/components/references/design-type-badge";
import { Badge } from "@/components/ui/badge";
import type { DesignReference, UserProfile } from "@/types";
import { FolderOpen, Palette, FileText, Link as LinkIcon, Sparkles } from "lucide-react";

type ReferenceDetailDialogProps = {
  reference: DesignReference | null;
  usersById: Map<string, UserProfile>;
  onClose: () => void;
};

function formatDateTime(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format((value as { toDate: () => Date }).toDate());
}

export function ReferenceDetailDialog({
  reference,
  usersById,
  onClose,
}: ReferenceDetailDialogProps) {
  if (!reference) {
    return null;
  }

  const rows = [
    ["Judul", reference.title],
    ["Skope", reference.scope === "acara" ? "Acara khusus" : "Divisi"],
    ["Kategori", reference.category ? reference.category.toUpperCase() : "LAINNYA"],
    ["Nama acara", reference.event_name || "-"],
    ["Tahun", String(reference.year)],
    ["Created by", usersById.get(reference.created_by)?.name ?? "User tidak ditemukan"],
    ["Created at", formatDateTime(reference.created_at)],
  ];

  // Links list resolving (Drive, Canva, Doc, Other)
  const driveLinks = reference.drive_links || (reference.drive_url ? [reference.drive_url] : []);
  const canvaLinks = reference.canva_links || [];
  const docLinks = reference.doc_links || [];
  const otherLinks = reference.other_links || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-lg my-auto">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
          <div>
            <div className="flex flex-wrap gap-2 items-center">
              <DesignTypeBadge type={reference.design_type} />
              <Badge variant={reference.scope === "acara" ? "success" : "info"}>
                {reference.scope === "acara" ? "Acara" : "Divisi"}
              </Badge>
              {reference.category ? (
                <Badge variant="default" className="uppercase">
                  {reference.category}
                </Badge>
              ) : null}
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-slate-50">{reference.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

        <div className="grid max-h-[78vh] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            {reference.thumbnail_url ? (
              <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-100 dark:bg-slate-950 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reference.thumbnail_url}
                  alt={reference.title}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-[8px] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm text-slate-500 dark:text-slate-400">
                Tidak ada thumbnail.
              </div>
            )}

            {/* Multiple Links Renderers */}
            <div className="space-y-4">
              {driveLinks.length > 0 ? (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Folder Drive Utama</p>
                  <div className="flex flex-col gap-2">
                    {driveLinks.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-650 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all jd-safe-text min-w-0"
                      >
                        <FolderOpen className="size-4 shrink-0 text-blue-500" />
                        <span>Buka Folder Drive {driveLinks.length > 1 ? `#${idx + 1}` : ""}</span>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {canvaLinks.length > 0 ? (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Canva Template/Design(s)</p>
                  <div className="flex flex-col gap-2">
                    {canvaLinks.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-purple-650 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-semibold border border-purple-200 dark:border-purple-900/50 rounded-lg p-3 bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all jd-safe-text min-w-0"
                      >
                        <Palette className="size-4 shrink-0 text-purple-500" />
                        <span>Canva Design Tautan {canvaLinks.length > 1 ? `#${idx + 1}` : ""}</span>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {docLinks.length > 0 ? (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Google Docs / Google Sheets</p>
                  <div className="flex flex-col gap-2">
                    {docLinks.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-emerald-655 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-3 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all jd-safe-text min-w-0"
                      >
                        <FileText className="size-4 shrink-0 text-emerald-500" />
                        <span>Google Docs Tautan {docLinks.length > 1 ? `#${idx + 1}` : ""}</span>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {otherLinks.length > 0 ? (
                <section className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tautan Referensi Lainnya</p>
                  <div className="flex flex-col gap-2">
                    {otherLinks.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-amber-655 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all jd-safe-text min-w-0"
                      >
                        <LinkIcon className="size-4 shrink-0 text-amber-500" />
                        <span>Tautan Referensi {otherLinks.length > 1 ? `#${idx + 1}` : ""}</span>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Folder Structured File Inventory Section */}
            {reference.file_inventory && reference.file_inventory.length > 0 ? (
              <section className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FolderOpen className="size-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Daftar File dalam Folder ({reference.file_inventory.length})</span>
                </p>
                <div className="grid gap-3 max-h-[300px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm">
                  {reference.file_inventory.map((file, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-900 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight jd-safe-text" title={file.name}>
                          {idx + 1}. {file.name}
                        </p>
                        {file.mime_type && (
                          <span className="mt-1 inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                            {file.mime_type}
                          </span>
                        )}
                      </div>
                      {file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center bg-sky-600 hover:bg-sky-700 text-white rounded-md px-3 text-xs font-semibold shadow-sm transition-colors shrink-0"
                        >
                          Buka File
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <dl className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
                      <dd className="text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <section>
              <p className="mb-2 text-sm font-semibold text-slate-950 dark:text-slate-50">Color palette</p>
              <ColorPalettePreview colors={reference.color_palette ?? []} />
            </section>

            <Block label="Style notes / supergrafis" value={reference.style_notes} />
            
            {/* Dedicated Gemini Catatan Analysis Section */}
            <section className="border border-sky-100 dark:border-sky-900/50 rounded-lg bg-sky-50/50 dark:bg-sky-950/10 p-4 shadow-sm">
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-200 flex items-center gap-1.5 mb-2">
                <Sparkles className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Hasil Catatan & Analisis Gemini (File Inventory)</span>
              </p>
              {reference.file_inventory_notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-350">
                  {reference.file_inventory_notes}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400 dark:text-slate-500">
                  Belum ada rangkuman analisis folder / file inventory dari Gemini.
                </p>
              )}
            </section>

            <Block label="Catatan tambahan" value={reference.notes} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string }) {
  return (
    <section>
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
        {value || "-"}
      </p>
    </section>
  );
}
