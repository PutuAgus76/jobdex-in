import type { TaskPriority } from "@/types";

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
  kritis: "Kritis",
};

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS).map(
  ([value, label]) => ({
    value: value as TaskPriority,
    label,
  }),
);
