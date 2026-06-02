import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { sendWhatsAppMessage, getWhatsAppRecipient, WhatsAppRateLimitError } from "@/lib/server/whatsapp";
import {
  getTaskDeadlineDiffDays,
  shouldSendDeadlineReminder,
  checkMissingMaterial,
  hasReminderBeenSent,
  buildGroupReminderMessage,
  buildPersonalReminderMessage,
  createTaskReminderLog,
  logWhatsAppDispatch,
} from "@/lib/server/deadline-reminders";
import type { Task, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  const { searchParams } = new URL(request.url);
  const secretQuery = searchParams.get("secret");

  const authHeader = request.headers.get("authorization");
  const secretHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || (secretQuery !== expectedSecret && secretHeader !== expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const groupId = getWhatsAppRecipient();

  if (!groupId) {
    return NextResponse.json({ error: "WhatsApp group ID not configured." }, { status: 500 });
  }

  const summary = {
    checkedTasks: 0,
    groupRemindersSent: 0,
    personalRemindersSent: 0,
    skippedAlreadySent: 0,
    skippedCompleted: 0,
    sent: 0,
    skipped_min_interval: 0,
    skipped_hourly_limit: 0,
    skipped_cooldown: 0,
    rate_limited: 0,
    failed: 0,
    errors: [] as string[],
  };

  const dispatchReminder = async (
    task: Task,
    recipient: string,
    recipientType: "group" | "personal",
    messageContent: string,
    reminderType: string
  ) => {
    try {
      const dispatchResult = await sendWhatsAppMessage(messageContent, recipientType === "personal" ? recipient : undefined);
      
      const whatsappLogId = await logWhatsAppDispatch({
        task,
        recipient,
        recipientType,
        messageContent,
        status: "sent",
        wablasResponse: dispatchResult.responseText,
      });

      await createTaskReminderLog({
        task,
        reminderType,
        channel: recipientType,
        recipient,
        messageContent,
        whatsappLogId,
      });

      summary.sent++;
      if (recipientType === "group") {
        summary.groupRemindersSent++;
      } else {
        summary.personalRemindersSent++;
      }
    } catch (err: unknown) {
      let status = "failed";
      const errorMsg = err instanceof Error ? err.message : String(err);
      let cooldownUntil: Date | null = null;
      let rateLimitReason: string | undefined = undefined;

      if (err instanceof WhatsAppRateLimitError) {
        status = err.status;
        cooldownUntil = err.cooldownUntil;
        rateLimitReason = err.message;
      }

      // Increment summary counts
      if (status === "skipped_min_interval") summary.skipped_min_interval++;
      else if (status === "skipped_hourly_limit") summary.skipped_hourly_limit++;
      else if (status === "skipped_cooldown") summary.skipped_cooldown++;
      else if (status === "rate_limited") summary.rate_limited++;
      else {
        summary.failed++;
        summary.errors.push(`Failed to send reminder for task ${task.id}: ${errorMsg}`);
      }

      await logWhatsAppDispatch({
        task,
        recipient,
        recipientType,
        messageContent,
        status,
        errorMessage: errorMsg,
        cooldownUntil,
        rateLimitReason,
      });
    }
  };

  try {
    // 1. Fetch active tasks (is_archived false, not approved)
    const tasksSnapshot = await db
      .collection("tasks")
      .where("is_archived", "==", false)
      .get();

    const activeTasks: Task[] = [];
    tasksSnapshot.forEach((doc) => {
      const data = doc.data();
      // Only check tasks that are not approved and have a deadline
      if (data.status !== "approved" && data.deadline) {
        activeTasks.push({ id: doc.id, ...data } as Task);
      } else {
        summary.skippedCompleted++;
      }
    });

    if (activeTasks.length === 0) {
      return NextResponse.json({
        message: "No active tasks require reminders.",
        summary,
      });
    }

    // 2. Fetch all users, events, and divisions in batch to prevent N+1 queries
    const [usersSnapshot, eventsSnapshot, divisionsSnapshot] = await Promise.all([
      db.collection("users").get(),
      db.collection("events").get(),
      db.collection("divisions").get(),
    ]);

    const usersMap = new Map<string, UserProfile>();
    usersSnapshot.forEach((doc) => {
      usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile);
    });

    const eventsMap = new Map<string, { name?: string }>();
    eventsSnapshot.forEach((doc) => {
      eventsMap.set(doc.id, doc.data() as { name?: string });
    });

    const divisionsMap = new Map<string, { name?: string }>();
    divisionsSnapshot.forEach((doc) => {
      divisionsMap.set(doc.id, doc.data() as { name?: string });
    });

    // 3. Evaluate and process each task
    for (const task of activeTasks) {
      summary.checkedTasks++;

      const picUser = task.pic_id ? usersMap.get(task.pic_id) || null : null;

      // Determine division or event name
      let divisionOrEventName = "-";
      if (task.type === "acara" && task.event_id) {
        const event = eventsMap.get(task.event_id);
        if (event && event.name) divisionOrEventName = event.name;
      } else if (task.type === "divisi" && task.division_id) {
        const division = divisionsMap.get(task.division_id);
        if (division && division.name) divisionOrEventName = division.name;
      }

      const diffDays = getTaskDeadlineDiffDays(task);

      // A. Check if it fits the scheduled deadline reminder
      const { shouldSend, type } = shouldSendDeadlineReminder(task, diffDays);

      // B. Check if it's missing materials/redaksi
      const missingMaterial = checkMissingMaterial(task);

      // C. Check stuck escalation (> 3 days in stuck or butuh_bantuan status)
      let isStuckEscalation = false;
      if (task.status === "stuck" || task.status === "butuh_bantuan") {
        const updatedAtDate =
          task.updated_at && typeof task.updated_at === "object" && "toDate" in task.updated_at
            ? (task.updated_at as { toDate: () => Date }).toDate()
            : task.updated_at instanceof Date
            ? task.updated_at
            : null;

        if (updatedAtDate) {
          const updatedDaysAgo = Math.floor((Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24));
          if (updatedDaysAgo >= 3) {
            isStuckEscalation = true;
          }
        }
      }

      if (shouldSend && type) {
        // --- 1. Send Group Reminder ---
        const isGroupAlreadySent = await hasReminderBeenSent(task.id, type, "group", groupId);
        if (!isGroupAlreadySent) {
          const groupMsg = buildGroupReminderMessage(
            task,
            type,
            picUser,
            divisionOrEventName,
            missingMaterial
          );
          await dispatchReminder(task, groupId, "group", groupMsg, type);
        } else {
          summary.skippedAlreadySent++;
        }

        // --- 2. Send Personal PIC Reminder ---
        if (picUser?.whatsapp_number) {
          const isPersonalAlreadySent = await hasReminderBeenSent(
            task.id,
            type,
            "personal",
            picUser.whatsapp_number
          );
          if (!isPersonalAlreadySent) {
            const personalMsg = buildPersonalReminderMessage(task, picUser.name);
            await dispatchReminder(task, picUser.whatsapp_number, "personal", personalMsg, type);
          } else {
            summary.skippedAlreadySent++;
          }
        }
      } else if (missingMaterial) {
        // --- Missing Material Only (Sent to Group) ---
        const isGroupAlreadySent = await hasReminderBeenSent(task.id, "missing_material", "group", groupId);
        if (!isGroupAlreadySent) {
          const groupMsg = buildGroupReminderMessage(
            task,
            "missing_material",
            picUser,
            divisionOrEventName,
            false
          );
          await dispatchReminder(task, groupId, "group", groupMsg, "missing_material");
        } else {
          summary.skippedAlreadySent++;
        }
      } else if (isStuckEscalation) {
        // --- Stuck Escalation Only (Sent to Group) ---
        const isGroupAlreadySent = await hasReminderBeenSent(task.id, "stuck_escalation", "group", groupId);
        if (!isGroupAlreadySent) {
          const groupMsg = buildGroupReminderMessage(
            task,
            "stuck_escalation",
            picUser,
            divisionOrEventName,
            false
          );
          await dispatchReminder(task, groupId, "group", groupMsg, "stuck_escalation");
        } else {
          summary.skippedAlreadySent++;
        }
      }
    }

    return NextResponse.json({
      message: "Cron completed successfully.",
      summary,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Internal Server Error in Cron processing.",
        details: errorMsg,
        summary,
      },
      { status: 500 }
    );
  }
}
