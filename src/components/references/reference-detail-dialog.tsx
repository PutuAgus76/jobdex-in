"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPalettePreview } from "@/components/references/color-palette-preview";
import { DesignTypeBadge } from "@/components/references/design-type-badge";
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
    ["Nama acara", reference.event_name || "-"],
    ["Tahun", String(reference.year)],
    ["Created by", usersById.get(reference.created_by)?.name ?? "User tidak ditemukan"],
    ["Created at", formatDateTime(reference.created_at)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-4xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
          <div>
            <div className="flex flex-wrap gap-2">
              <DesignTypeBadge type={reference.design_type} />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-slate-50">{reference.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

        <div className="grid max-h-[78vh] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            {reference.thumbnail_url ? (
              <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                {/* Manual thumbnail URLs can come from arbitrary hosts; avoid broad Next image allowlists. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reference.thumbnail_url}
                  alt={reference.title}
                  className="max-h-[460px] w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-[8px] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm text-slate-500 dark:text-slate-400">
                Tidak ada thumbnail.
              </div>
            )}
            {reference.drive_url ? (
              <Button asChild variant="secondary">
                <a href={reference.drive_url} target="_blank" rel="noreferrer">
                  Buka Google Drive
                </a>
              </Button>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <dl className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
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
            <Block label="Style notes/supergrafis" value={reference.style_notes} />
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
