import { canManageTask } from "@/lib/permissions";
import type { Task, TaskStatus, UserProfile } from "@/types";

export const PIC_STATUS_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  belum_dimulai: ["sedang_dikerjakan"],
  sedang_dikerjakan: [
    "butuh_bantuan",
    "stuck",
    "menunggu_materi",
    "draft_selesai",
  ],
  draft_selesai: ["menunggu_approval"],
  perlu_revisi: ["revisi_dikerjakan"],
  revisi_dikerjakan: ["menunggu_approval"],
};

export function canUpdateTaskStatus(profile: UserProfile, task: Task) {
  return canManageTask(profile, task) || task.pic_id === profile.id;
}

export function canApproveTaskWorkflow(profile: UserProfile, task: Task) {
  return canManageTask(profile, task);
}

export function getAllowedStatusOptions(profile: UserProfile, task: Task) {
  if (canManageTask(profile, task)) {
    return [
      "belum_dimulai",
      "sedang_dikerjakan",
      "butuh_bantuan",
      "stuck",
      "menunggu_materi",
      "draft_selesai",
      "perlu_revisi",
      "revisi_dikerjakan",
      "menunggu_approval",
      "approved",
      "ditunda",
    ] as TaskStatus[];
  }

  if (task.pic_id !== profile.id) {
    return [];
  }

  return PIC_STATUS_TRANSITIONS[task.status] ?? [];
}
