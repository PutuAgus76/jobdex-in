"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPalettePreview } from "@/components/references/color-palette-preview";
import { DesignTypeBadge } from "@/components/references/design-type-badge";
import type { DesignReference } from "@/types";

type ReferenceCardProps = {
  reference: DesignReference;
  canEdit: boolean;
  onView: (reference: DesignReference) => void;
  onEdit: (reference: DesignReference) => void;
  onArchive: (reference: DesignReference) => void;
};

export function ReferenceCard({
  reference,
  canEdit,
  onView,
  onEdit,
  onArchive,
}: ReferenceCardProps) {
  return (
    <Card className="overflow-hidden">
      {reference.thumbnail_url ? (
        <div className="h-44 border-b border-slate-200 bg-slate-100">
          <img
            src={reference.thumbnail_url}
            alt={reference.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center border-b border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
          Tanpa thumbnail
        </div>
      )}
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <DesignTypeBadge type={reference.design_type} />
          <Badge variant={reference.is_archived ? "warning" : "success"}>
            {reference.is_archived ? "Archived" : "Aktif"}
          </Badge>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-950">{reference.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {reference.event_name || "Tanpa nama acara"} · {reference.year}
          </p>
        </div>
        <ColorPalettePreview colors={reference.color_palette ?? []} />
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
          {reference.style_notes || reference.notes || "Tidak ada catatan."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => onView(reference)}>
            Detail
          </Button>
          {reference.drive_url ? (
            <Button asChild size="sm" variant="secondary">
              <a href={reference.drive_url} target="_blank" rel="noreferrer">
                Buka Drive
              </a>
            </Button>
          ) : null}
          {canEdit ? (
            <>
              <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(reference)}>
                Edit
              </Button>
              {!reference.is_archived ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onArchive(reference)}
                >
                  Archive
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
