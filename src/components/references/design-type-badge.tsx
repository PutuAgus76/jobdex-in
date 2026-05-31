"use client";

import { Badge } from "@/components/ui/badge";
import { DESIGN_TYPE_LABELS } from "@/lib/design-types";
import type { DesignType } from "@/types";

export function DesignTypeBadge({ type }: { type: DesignType }) {
  return <Badge variant="info">{DESIGN_TYPE_LABELS[type] ?? type}</Badge>;
}
