import type { DesignType } from "@/types";

export const DESIGN_TYPE_LABELS: Record<DesignType, string> = {
  poster: "Poster",
  name_tag: "Name Tag",
  twibbon: "Twibbon",
  feed_ig: "Feed IG",
  story_ig: "Story IG",
  banner: "Banner",
  sertifikat: "Sertifikat",
  dokumentasi: "Dokumentasi",
  animasi: "Animasi",
  merchandise: "Merchandise",
  lainnya: "Lainnya",
};

export const DESIGN_TYPE_OPTIONS = Object.entries(DESIGN_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as DesignType,
    label,
  }),
);
