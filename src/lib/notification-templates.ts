import { TASK_STATUS_LABELS } from "@/lib/task-status";
import { WA_LABEL } from "@/lib/server/whatsapp-labels";
import type { Task, TaskStatus, UserProfile } from "@/types";

type NotificationTemplateInput = {
  task: Task;
  actor?: UserProfile | null;
  pic?: UserProfile | null;
  coordinator?: UserProfile | null;
  status?: TaskStatus;
  note?: string;
  stuckNotes?: string;
  revisionNotes?: string;
  uploadUrl?: string;
  thumbnailUrl?: string;
};

export type WhatsAppEventType =
  | "task_created"
  | "task_status_changed"
  | "task_help_needed"
  | "task_result_uploaded"
  | "task_revision_requested"
  | "task_approved";

export function buildWhatsAppMessage(
  eventType: WhatsAppEventType,
  input: NotificationTemplateInput,
) {
  const actorName = input.actor?.name ?? "User tidak ditemukan";
  const picName = input.pic?.name ?? "PIC tidak ditemukan";
  const coordinatorName = input.coordinator?.name ?? actorName;
  const deadline = formatTaskDate(input.task.deadline);
  const statusLabel = input.status
    ? TASK_STATUS_LABELS[input.status]
    : TASK_STATUS_LABELS[input.task.status];

  if (eventType === "task_help_needed") {
    return [
      WA_LABEL.reminder + " Perlu Bantuan",
      "",
      `Anggota: ${actorName}`,
      `Tugas: ${input.task.name}`,
      `Status: ${statusLabel}`,
      `Kendala: ${input.stuckNotes || input.note || "-"}`,
      `Deadline: ${deadline}`,
    ].join("\n");
  }

  if (eventType === "task_result_uploaded") {
    return [
      WA_LABEL.reminder + " Hasil Desain Diupload",
      "",
      `Anggota: ${actorName}`,
      `Tugas: ${input.task.name}`,
      "Status: Menunggu Approval",
      `Preview: ${input.thumbnailUrl || "-"}`,
      `Link: ${input.uploadUrl || "-"}`,
    ].join("\n");
  }

  if (eventType === "task_revision_requested") {
    return [
      WA_LABEL.reminder + " Revisi Diperlukan",
      "",
      `Tugas: ${input.task.name}`,
      `PIC: ${picName}`,
      `Catatan Revisi: ${input.revisionNotes || input.note || "-"}`,
    ].join("\n");
  }

  if (eventType === "task_approved") {
    return [
      WA_LABEL.reminder + " Tugas Disetujui",
      "",
      `Tugas: ${input.task.name}`,
      `PIC: ${picName}`,
      `Disetujui oleh: ${coordinatorName}`,
    ].join("\n");
  }

  if (eventType === "task_created") {
    return [
      WA_LABEL.reminder + " Tugas Baru",
      "",
      `Tugas: ${input.task.name}`,
      `PIC: ${picName}`,
      `Koordinator: ${coordinatorName}`,
      `Deadline: ${deadline}`,
    ].join("\n");
  }

  return [
    WA_LABEL.reminder + " Update Tugas",
    "",
    `Nama: ${actorName}`,
    `Tugas: ${input.task.name}`,
    `Status: ${statusLabel}`,
    `Catatan: ${input.note || "-"}`,
    `Deadline: ${deadline}`,
  ].join("\n");
}

function formatTaskDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format((value as { toDate: () => Date }).toDate());
}
