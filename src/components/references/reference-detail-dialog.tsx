"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPalettePreview } from "@/components/references/color-palette-preview";
import { DesignTypeBadge } from "@/components/references/design-type-badge";
import { Badge } from "@/components/ui/badge";
import type { DesignReference, UserProfile } from "@/types";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-5xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl my-auto">
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
              <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
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
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Google Drive Link(s)</p>
                  <div className="flex flex-col gap-2">
                    {driveLinks.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold break-all border border-slate-100 dark:border-slate-800 rounded-[6px] p-2 bg-slate-50/55 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors"
                      >
                        📁 Google Drive Tautan {driveLinks.length > 1 ? `#${idx + 1}` : ""}
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
                        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 font-semibold break-all border border-slate-100 dark:border-slate-800 rounded-[6px] p-2 bg-slate-50/55 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors"
                      >
                        🎨 Canva Design Tautan {canvaLinks.length > 1 ? `#${idx + 1}` : ""}
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
                        className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 font-semibold break-all border border-slate-100 dark:border-slate-800 rounded-[6px] p-2 bg-slate-50/55 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors"
                      >
                        📝 Google Docs Tautan {docLinks.length > 1 ? `#${idx + 1}` : ""}
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
                        className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 font-semibold break-all border border-slate-100 dark:border-slate-800 rounded-[6px] p-2 bg-slate-50/55 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors"
                      >
                        🔗 Tautan Referensi {otherLinks.length > 1 ? `#${idx + 1}` : ""}
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
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
            <section className="rounded-[8px] border border-blue-200 dark:border-blue-800/80 bg-blue-50/45 dark:bg-blue-950/20 p-4">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 mb-2">
                ✨ Hasil Catatan & Analisis Gemini (File Inventory)
              </p>
              {reference.file_inventory_notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
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
