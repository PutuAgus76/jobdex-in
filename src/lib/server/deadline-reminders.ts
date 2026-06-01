import "server-only";

import { getAdminDb, FieldValue } from "@/lib/server/firebase-admin";
import { getTaskDeadlineDiffDays, getRiskLevelFromTask } from "@/lib/task-risk";
import type { Task, UserProfile } from "@/types";

export { getTaskDeadlineDiffDays };

/**
 * Returns the risk level of the task (none | yellow | orange | red)
 */
export function getTaskRiskLevel(task: Task) {
  return getRiskLevelFromTask(task);
}

/**
 * Helper to format date in Indonesian style (e.g. 3 Juni 2026)
 */
export function formatIndonesianDate(dateObj: unknown): string {
  const date =
    dateObj && typeof dateObj === "object" && "toDate" in dateObj
      ? (dateObj as { toDate: () => Date }).toDate()
      : dateObj instanceof Date
      ? dateObj
      : typeof dateObj === "string"
      ? new Date(dateObj)
      : null;

  if (!date) return "-";

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Helper to format task priorities for Indonesian display
 */
export function getFormattedPriority(priority: string): string {
  switch (priority) {
    case "rendah":
      return "Rendah";
    case "sedang":
      return "Sedang";
    case "tinggi":
      return "Tinggi";
    case "kritis":
      return "Kritis";
    default:
      return priority;
  }
}

/**
 * Helper to format task status for Indonesian display
 */
export function getFormattedStatus(status: string): string {
  switch (status) {
    case "belum_dimulai":
      return "Belum Dimulai";
    case "sedang_dikerjakan":
      return "Sedang Dikerjakan";
    case "butuh_bantuan":
      return "Butuh Bantuan";
    case "stuck":
      return "Stuck";
    case "menunggu_materi":
      return "Menunggu Materi";
    case "draft_selesai":
      return "Draft Selesai";
    case "perlu_revisi":
      return "Perlu Revisi";
    case "revisi_dikerjakan":
      return "Revisi Dikerjakan";
    case "menunggu_approval":
      return "Menunggu Approval";
    case "approved":
      return "Approved";
    case "ditunda":
      return "Ditunda";
    default:
      return status;
  }
}

/**
 * Checks whether a reminder should be sent based on task deadline difference days and priority
 */
export function shouldSendDeadlineReminder(
  task: Task,
  diffDays: number
): {
  shouldSend: boolean;
  type: "h_7" | "h_5" | "h_3" | "h_1" | "today" | "overdue" | null;
} {
  // Excluded statuses
  if (
    task.status === "approved" ||
    task.status === ("selesai" as unknown as typeof task.status) ||
    task.status === ("archived" as unknown as typeof task.status) ||
    task.is_archived
  ) {
    return { shouldSend: false, type: null };
  }

  const priority = task.priority;

  if (priority === "rendah" || priority === "sedang") {
    if (diffDays === 5) {
      // H-5: jika belum_dimulai
      if (task.status === "belum_dimulai") {
        return { shouldSend: true, type: "h_5" };
      }
    } else if (diffDays === 1) {
      // H-1
      return { shouldSend: true, type: "h_1" };
    } else if (diffDays === 0) {
      // Hari-H
      return { shouldSend: true, type: "today" };
    } else if (diffDays < 0) {
      // Overdue
      return { shouldSend: true, type: "overdue" };
    }
  } else if (priority === "tinggi" || priority === "kritis") {
    if (diffDays === 7) {
      return { shouldSend: true, type: "h_7" };
    } else if (diffDays === 5) {
      return { shouldSend: true, type: "h_5" };
    } else if (diffDays === 3) {
      return { shouldSend: true, type: "h_3" };
    } else if (diffDays === 1) {
      return { shouldSend: true, type: "h_1" };
    } else if (diffDays === 0) {
      return { shouldSend: true, type: "today" };
    } else if (diffDays < 0) {
      return { shouldSend: true, type: "overdue" };
    }
  }

  return { shouldSend: false, type: null };
}

/**
 * Calculates days elapsed since task creation
 */
export function getDaysSinceCreation(task: Task): number {
  const createdAtDate =
    task.created_at && typeof task.created_at === "object" && "toDate" in task.created_at
      ? (task.created_at as { toDate: () => Date }).toDate()
      : task.created_at instanceof Date
      ? task.created_at
      : null;

  if (!createdAtDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const created = new Date(createdAtDate);
  created.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - created.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if task is missing redaksi/materi (copywriting/copywriting_docs_url) after >= 2 days of creation
 */
export function checkMissingMaterial(task: Task): boolean {
  if (
    task.status === "approved" ||
    task.status === ("selesai" as unknown as typeof task.status) ||
    task.status === ("archived" as unknown as typeof task.status) ||
    task.is_archived
  ) {
    return false;
  }

  const isCopywritingEmpty = !task.copywriting?.trim();
  const isCopywritingDocsEmpty = !task.copywriting_docs_url?.trim();

  if (isCopywritingEmpty && isCopywritingDocsEmpty) {
    const daysSinceCreation = getDaysSinceCreation(task);
    return daysSinceCreation >= 2;
  }

  return false;
}

/**
 * Anti-spam check to prevent duplicated reminder dispatches
 */
export async function hasReminderBeenSent(
  taskId: string,
  type: string,
  channel: "group" | "personal",
  recipient: string
): Promise<boolean> {
  const db = getAdminDb();

  const snapshot = await db
    .collection("task_reminder_logs")
    .where("task_id", "==", taskId)
    .where("reminder_type", "==", type)
    .where("channel", "==", channel)
    .where("recipient", "==", recipient)
    .get();

  if (snapshot.empty) {
    return false;
  }

  if (type === "overdue") {
    let mostRecentSentAt: Date | null = null;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const sentAtDate =
        data.sent_at && typeof data.sent_at === "object" && "toDate" in data.sent_at
          ? (data.sent_at as { toDate: () => Date }).toDate()
          : data.sent_at instanceof Date
          ? data.sent_at
          : null;
      if (sentAtDate) {
        if (!mostRecentSentAt || sentAtDate.getTime() > mostRecentSentAt.getTime()) {
          mostRecentSentAt = sentAtDate;
        }
      }
    });

    if (mostRecentSentAt) {
      const hoursSinceLastSent = (Date.now() - (mostRecentSentAt as Date).getTime()) / (1000 * 60 * 60);
      // Limit overdue notification to at most once per 23 hours
      return hoursSinceLastSent < 23;
    }
  }

  return true;
}

/**
 * Builds formatted Group WhatsApp Reminder message
 */
export function buildGroupReminderMessage(
  task: Task,
  type: string,
  pic: UserProfile | null,
  divisionOrEventName: string,
  missingMaterial: boolean
): string {
  const picName = pic ? pic.name : "-";
  const picWhatsapp = pic?.whatsapp_number ? ` (${pic.whatsapp_number})` : "";
  const formattedDeadline = formatIndonesianDate(task.deadline);
  const formattedStatus = getFormattedStatus(task.status);
  const formattedPriority = getFormattedPriority(task.priority);

  if (type === "stuck_escalation") {
    const constraint = task.stuck_notes ? `Kendala: ${task.stuck_notes}` : "Kendala: Tidak disebutkan";
    return `[JobDex.in Warning]

🚧 Job Desk Masih Stuck

Tugas: ${task.name}
PIC: ${picName}${picWhatsapp}
Deadline: ${formattedDeadline}
Status: ${formattedStatus}
Acara/Divisi: ${divisionOrEventName}
${constraint}

Saran:
Koordinator dapat membantu membuka kendala atau mengalihkan sebagian tugas jika sudah terlalu lama.`;
  }

  if (task.status === "menunggu_approval") {
    return `[JobDex.in Reminder]

⏳ Menunggu Approval

Tugas: ${task.name}
PIC: ${picName}${picWhatsapp}
Deadline: ${formattedDeadline}
Status: Menunggu Approval
Acara/Divisi: ${divisionOrEventName}

Catatan:
Tugas sudah dikirim dan menunggu pengecekan. Koordinator dapat segera approve atau minta revisi.`;
  }

  let header = "[JobDex.in Reminder]";
  let icon = "📌";
  let typeTitle = "";

  if (type === "h_7") {
    icon = "📌";
    typeTitle = "H-7 Deadline Job Desk";
  } else if (type === "h_5") {
    icon = "📌";
    typeTitle = "H-5 Deadline Job Desk";
  } else if (type === "h_3") {
    header = "[JobDex.in Warning]";
    icon = "⚠️";
    typeTitle = `H-3 Deadline Job Desk Prioritas ${formattedPriority}`;
  } else if (type === "h_1") {
    header = "[JobDex.in Warning]";
    icon = "⚠️";
    typeTitle = "H-1 Deadline Job Desk (Urgent)";
  } else if (type === "today") {
    header = "[JobDex.in Warning]";
    icon = "⚠️";
    typeTitle = "Hari-H Deadline Job Desk";
  } else if (type === "overdue") {
    header = "[JobDex.in Overdue]";
    icon = "🚨";
    typeTitle = "Job Desk Lewat Deadline";
  } else if (type === "missing_material") {
    header = "[JobDex.in Reminder]";
    icon = "⚠️";
    typeTitle = "Kelengkapan Redaksi / Materi Belum Tersedia";
  }

  if (missingMaterial && type !== "missing_material") {
    let dayText = "";
    if (type === "h_7") dayText = "H-7 Deadline";
    else if (type === "h_5") dayText = "H-5 Deadline";
    else if (type === "h_3") dayText = "H-3 Deadline";
    else if (type === "h_1") dayText = "H-1 Deadline";
    else if (type === "today") dayText = "Hari-H Deadline";
    else if (type === "overdue") dayText = "Overdue";

    return `[JobDex.in Reminder]

⚠️ ${dayText} + Redaksi Belum Tersedia

Tugas: ${task.name}
PIC: ${picName}${picWhatsapp}
Deadline: ${formattedDeadline}
Status: ${formattedStatus}
Prioritas: ${formattedPriority}
Acara/Divisi: ${divisionOrEventName}

Catatan:
* ${
      type === "overdue"
        ? "Tugas ini telah melewati deadline."
        : `Tugas ini memiliki status ${formattedStatus}. Mohon mulai dikerjakan agar tidak mepet deadline.`
    }
* Redaksi/materi belum tersedia.
  Koordinator disarankan segera mengirimkan redaksi agar PIC bisa mulai mengerjakan.`;
  }

  if (type === "missing_material") {
    return `${header}

${icon} ${typeTitle}

Tugas: ${task.name}
PIC: ${picName}${picWhatsapp}
Deadline: ${formattedDeadline}
Status: ${formattedStatus}
Prioritas: ${formattedPriority}
Acara/Divisi: ${divisionOrEventName}

Catatan:
* Redaksi/materi belum tersedia untuk tugas ini.
  Koordinator disarankan segera mengirimkan redaksi agar PIC bisa mulai mengerjakan.`;
  }

  if (type === "overdue") {
    return `${header}

${icon} ${typeTitle}

Tugas: ${task.name}
PIC: ${picName}${picWhatsapp}
Deadline: ${formattedDeadline}
Status: ${formattedStatus}
Prioritas: ${formattedPriority}
Acara/Divisi: ${divisionOrEventName}

Mohon segera ditindaklanjuti oleh PIC atau koordinator.`;
  }

  let catatanAtauSaran = "";
  if (type === "h_3" || type === "h_1" || type === "today") {
    catatanAtauSaran = `Saran:
Koordinator disarankan mengecek progress PIC. Jika PIC tidak memungkinkan mengerjakan, pertimbangkan bantuan atau pengalihan tugas.`;
  } else {
    catatanAtauSaran = `Catatan:
Tugas ini ${
      task.status === "belum_dimulai" ? "belum dimulai" : `memiliki status ${formattedStatus}`
    }. Mohon mulai dikerjakan agar tidak mepet deadline.`;
  }

  return `${header}

${icon} ${typeTitle}

Tugas: ${task.name}
PIC: ${picName}${picWhatsapp}
Deadline: ${formattedDeadline}
Status: ${formattedStatus}
Prioritas: ${formattedPriority}
Acara/Divisi: ${divisionOrEventName}

${catatanAtauSaran}`;
}

/**
 * Builds formatted Personal WhatsApp Reminder message to PIC
 */
export function buildPersonalReminderMessage(task: Task, picName: string): string {
  const formattedDeadline = formatIndonesianDate(task.deadline);
  const formattedStatus = getFormattedStatus(task.status);
  const formattedPriority = getFormattedPriority(task.priority);

  return `[JobDex.in Reminder Pribadi]

Halo ${picName}, kamu punya job desk yang perlu diperhatikan:

Tugas: ${task.name}
Deadline: ${formattedDeadline}
Status: ${formattedStatus}
Prioritas: ${formattedPriority}

Mohon update progress di JobDex.in jika sudah dikerjakan.`;
}

/**
 * Inserts log entry in task_reminder_logs collection
 */
export async function createTaskReminderLog(data: {
  task: Task;
  reminderType: string;
  channel: "group" | "personal";
  recipient: string;
  messageContent: string;
  whatsappLogId?: string;
}): Promise<void> {
  const db = getAdminDb();
  const logRef = db.collection("task_reminder_logs").doc();

  await logRef.set({
    id: logRef.id,
    task_id: data.task.id,
    reminder_type: data.reminderType,
    channel: data.channel,
    recipient: data.recipient,
    sent_at: FieldValue.serverTimestamp(),
    status_at_send: data.task.status,
    priority_at_send: data.task.priority,
    deadline: data.task.deadline,
    message_content: data.messageContent,
    ...(data.whatsappLogId ? { whatsapp_log_id: data.whatsappLogId } : {}),
  });
}

/**
 * Logs dispatch attempt to whatsapp_logs collection
 */
export async function logWhatsAppDispatch(data: {
  task: Task;
  recipient: string;
  recipientType: "group" | "personal";
  messageContent: string;
  status: "sent" | "failed";
  wablasResponse?: string;
  errorMessage?: string;
}): Promise<string> {
  const db = getAdminDb();
  const logRef = db.collection("whatsapp_logs").doc();

  await logRef.set({
    id: logRef.id,
    organization_id: data.task.organization_id || "main_org",
    task_id: data.task.id,
    event_type: "deadline_reminder",
    message_content: data.messageContent,
    recipient: data.recipient,
    recipient_type: data.recipientType,
    is_group: data.recipientType === "group",
    status: data.status,
    ...(data.wablasResponse ? { wablas_response: data.wablasResponse } : {}),
    ...(data.errorMessage ? { error_message: data.errorMessage } : {}),
    retry_count: 0,
    created_at: FieldValue.serverTimestamp(),
  });

  return logRef.id;
}
