"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPalettePreview } from "@/components/references/color-palette-preview";
import { DesignTypeBadge } from "@/components/references/design-type-badge";
import type { DesignReference } from "@/types";

import { Eye, FolderOpen, Palette, Pencil, Archive } from "lucide-react";

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
    <Card className="flex flex-col justify-between m-1 overflow-hidden">
      {reference.thumbnail_url ? (
        <div className="h-44 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-955">
          {/* Manual thumbnail URLs can come from arbitrary hosts; avoid broad Next image allowlists. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reference.thumbnail_url}
            alt={reference.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center border-b border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Tanpa thumbnail
        </div>
      )}
      <CardContent className="space-y-4 p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DesignTypeBadge type={reference.design_type} />
            <Badge variant={reference.is_archived ? "warning" : "success"}>
              {reference.is_archived ? "Archived" : "Aktif"}
            </Badge>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{reference.title}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {reference.event_name || "Tanpa nama acara"} - {reference.year}
            </p>
          </div>
          <ColorPalettePreview colors={reference.color_palette ?? []} />
          <p className="line-clamp-2 min-h-10 text-xs font-medium leading-relaxed text-slate-650 dark:text-slate-300">
            {reference.style_notes || reference.notes || "Tidak ada catatan."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
          <Button type="button" size="sm" variant="info" onClick={() => onView(reference)}>
            <Eye className="size-3.5" />
            <span>Detail</span>
          </Button>
          {(() => {
            const driveUrl = (reference.drive_links && reference.drive_links[0]) || 
                             reference.drive_url || 
                             (reference.file_inventory && reference.file_inventory[0]?.url) || 
                             "";
            const canvaLinks = reference.canva_links || [];
            return (
              <>
                {driveUrl ? (
                  <Button asChild size="sm" variant="secondary">
                    <a href={driveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                      <FolderOpen className="size-3.5" />
                      <span>Drive</span>
                    </a>
                  </Button>
                ) : null}
                {canvaLinks.length > 0 ? (
                  <Button asChild size="sm" variant="secondary">
                    <a href={canvaLinks[0]} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                      <Palette className="size-3.5" />
                      <span>Canva</span>
                    </a>
                  </Button>
                ) : null}
              </>
            );
          })()}
          {canEdit ? (
            <>
              <Button type="button" size="sm" variant="warning" onClick={() => onEdit(reference)}>
                <Pencil className="size-3.5" />
                <span>Edit</span>
              </Button>
              {!reference.is_archived ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => onArchive(reference)}
                >
                  <Archive className="size-3.5" />
                  <span>Archive</span>
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
