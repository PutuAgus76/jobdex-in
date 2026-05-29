import type { TaskStatus } from "@/types";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  belum_dimulai: "Belum Dimulai",
  sedang_dikerjakan: "Sedang Dikerjakan",
  butuh_bantuan: "Butuh Bantuan",
  stuck: "Stuck",
  menunggu_materi: "Menunggu Materi",
  draft_selesai: "Draft Selesai",
  perlu_revisi: "Perlu Revisi",
  revisi_dikerjakan: "Revisi Dikerjakan",
  menunggu_approval: "Menunggu Approval",
  approved: "Approved",
  ditunda: "Ditunda",
};

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as TaskStatus,
    label,
  }),
);
