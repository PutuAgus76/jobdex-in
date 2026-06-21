"use client";

import { ReferenceCard } from "@/components/references/reference-card";
import type { ReferenceListItem } from "@/types";

type ReferencesGridProps = {
  references: ReferenceListItem[];
  canEditReference: (reference: ReferenceListItem) => boolean;
  onView: (reference: ReferenceListItem) => void;
  onEdit: (reference: ReferenceListItem) => void;
  onArchive: (reference: ReferenceListItem) => void;
};

export function ReferencesGrid({
  references,
  canEditReference,
  onView,
  onEdit,
  onArchive,
}: ReferencesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {references.map((reference) => (
        <ReferenceCard
          key={reference.id}
          reference={reference}
          canEdit={canEditReference(reference)}
          onView={onView}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
