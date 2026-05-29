import type { EventStatus } from "@/types";

export const EVENT_STATUSES = {
  PERSIAPAN: "persiapan",
  BERLANGSUNG: "berlangsung",
  SELESAI: "selesai",
  DIBATALKAN: "dibatalkan",
} as const satisfies Record<string, EventStatus>;

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  persiapan: "Persiapan",
  berlangsung: "Berlangsung",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const EVENT_STATUS_OPTIONS: Array<{
  value: EventStatus;
  label: string;
}> = [
  {
    value: "persiapan",
    label: EVENT_STATUS_LABELS.persiapan,
  },
  {
    value: "berlangsung",
    label: EVENT_STATUS_LABELS.berlangsung,
  },
  {
    value: "selesai",
    label: EVENT_STATUS_LABELS.selesai,
  },
  {
    value: "dibatalkan",
    label: EVENT_STATUS_LABELS.dibatalkan,
  },
];
