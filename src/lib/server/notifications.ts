import "server-only";

import { buildWhatsAppMessage, type WhatsAppEventType } from "@/lib/notification-templates";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import {
  getWhatsAppRecipient,
  getWhatsAppRecipientType,
  isWhatsAppGroupRecipient,
  sendWhatsAppMessage,
} from "@/lib/server/whatsapp";
import type { Task, TaskStatus, UserProfile, WhatsAppLogStatus } from "@/types";

type NotifyTaskEventInput = {
  eventType: WhatsAppEventType;
  taskId: string;
  actorId: string;
  status?: TaskStatus;
  note?: string;
  stuckNotes?: string;
  revisionNotes?: string;
  uploadUrl?: string;
  thumbnailUrl?: string;
};

async function getUserProfile(userId: string) {
  if (!userId) {
    return null;
  }

  const snapshot = await getAdminDb().collection("users").doc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as UserProfile;
}

async function createWhatsAppLog({
  task,
  eventType,
  message,
  status,
  wablasResponse,
  errorMessage,
}: {
  task: Task;
  eventType: WhatsAppEventType;
  message: string;
  status: WhatsAppLogStatus;
  wablasResponse?: string;
  errorMessage?: string;
}) {
  const logRef = getAdminDb().collection("whatsapp_logs").doc();

  await logRef.set({
    id: logRef.id,
    organization_id: task.organization_id || "main_org",
    task_id: task.id,
    event_type: eventType,
    message_content: message,
    recipient: getWhatsAppRecipient(),
    recipient_type: getWhatsAppRecipientType(),
    is_group: isWhatsAppGroupRecipient(),
    status,
    ...(wablasResponse ? { wablas_response: wablasResponse } : {}),
    ...(errorMessage ? { error_message: errorMessage } : {}),
    retry_count: 0,
    created_at: FieldValue.serverTimestamp(),
  });
}

export async function notifyTaskEvent(input: NotifyTaskEventInput) {
  const db = getAdminDb();
  const taskSnapshot = await db.collection("tasks").doc(input.taskId).get();

  if (!taskSnapshot.exists) {
    throw new Error("Task tidak ditemukan untuk notifikasi.");
  }

  const task = {
    id: taskSnapshot.id,
    ...taskSnapshot.data(),
  } as Task;

  const [actor, pic, coordinator] = await Promise.all([
    getUserProfile(input.actorId),
    getUserProfile(task.pic_id),
    getUserProfile(task.coordinator_id),
  ]);

  const message = buildWhatsAppMessage(input.eventType, {
    task,
    actor,
    pic,
    coordinator,
    status: input.status,
    note: input.note,
    stuckNotes: input.stuckNotes,
    revisionNotes: input.revisionNotes,
    uploadUrl: input.uploadUrl,
    thumbnailUrl: input.thumbnailUrl,
  });

  try {
    const result = await sendWhatsAppMessage(message);
    await createWhatsAppLog({
      task,
      eventType: input.eventType,
      message,
      status: "sent",
      wablasResponse: result.responseText,
    });

    return { sent: true };
  } catch (error) {
    await createWhatsAppLog({
      task,
      eventType: input.eventType,
      message,
      status: "failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Notifikasi WhatsApp gagal dikirim.",
    });

    return { sent: false };
  }
}
