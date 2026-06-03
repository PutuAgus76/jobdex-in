"use client";

import { Badge } from "@/components/ui/badge";
import { DESIGN_TYPE_LABELS } from "@/lib/design-types";
import type { DesignType } from "@/types";

export function DesignTypeBadge({ type }: { type: DesignType }) {
  const variant =
    type === "poster" || type === "banner"
      ? "orange"
      : type === "feed_ig" || type === "story_ig"
      ? "purple"
      : type === "sertifikat" || type === "twibbon"
      ? "success"
      : "info";

  return <Badge variant={variant}>{DESIGN_TYPE_LABELS[type] ?? type}</Badge>;
}
