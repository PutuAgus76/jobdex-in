import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import {
  getWhatsAppRecipient,
  sendWhatsAppMessage,
  WhatsAppRateLimitError,
} from "@/lib/server/whatsapp";
import {
  buildDigestReminderMessage,
  buildReminderDigest,
  createTaskReminderDigestLog,
  getDigestDateKey,
  getTaskIdsAlreadyInDigestToday,
  logWhatsAppDigestDispatch,
  processSmartFollowupReminders,
} from "@/lib/server/deadline-reminders";
import { groupTasksByTarget } from "@/lib/server/group-routing";
import type { GroupRouteTarget } from "@/lib/server/group-routing";
import type { ReminderDigest } from "@/lib/server/deadline-reminders";
import type { Task, UserProfile, Event } from "@/types";

export const dynamic = "force-dynamic";

function isCompletedTask(data: Partial<Task>) {
  return (
    data.status === "approved" ||
    data.status === ("selesai" as Task["status"]) ||
    data.approval_status === "approved"
  );
}

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
  const secretHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;
  const expectedSecret = process.env.CRON_SECRET;

  if (
    !expectedSecret ||
    (secretQuery !== expectedSecret && secretHeader !== expectedSecret)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const globalDefaultGroupId = getWhatsAppRecipient();

  if (!globalDefaultGroupId) {
    return NextResponse.json(
      { error: "WhatsApp group ID not configured." },
      { status: 500 },
    );
  }

  const skipped = {
    alreadyInDigestToday: 0,
    completed: 0,
    archived: 0,
    rateLimited: 0,
  };
  const errors: string[] = [];

  try {
    const tasksSnapshot = await db.collection("tasks").get();
    const checkedTasks = tasksSnapshot.size;
    const activeTasks: Task[] = [];

    tasksSnapshot.forEach((doc) => {
      const data = doc.data() as Partial<Task>;

      if (data.is_archived) {
        skipped.archived++;
        return;
      }

      if (isCompletedTask(data)) {
        skipped.completed++;
        return;
      }

      activeTasks.push({ id: doc.id, ...data } as Task);
    });

    const [usersSnapshot, eventsSnapshot, divisionsSnapshot] =
      await Promise.all([
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

    // Populate eventsCache for group routing
    const eventsCache = new Map<string, Event>();
    eventsSnapshot.forEach((doc) => {
      eventsCache.set(doc.id, { id: doc.id, ...doc.data() } as Event);
    });

    // Group tasks using the new routing helper
    const taskGroups = await groupTasksByTarget(activeTasks, eventsCache);

    // Process smart individual and escalation reminders
    try {
      await processSmartFollowupReminders(sendWhatsAppMessage);
    } catch (err) {
      console.error("Failed to process smart follow-up reminders:", err);
      errors.push(`Smart Reminders: ${err instanceof Error ? err.message : "unknown error"}`);
    }

    const digestDateKey = getDigestDateKey();
    let digestSent = false;
    let digestTaskCount = 0;
    let newTaskIdsInDigest = 0;
    let alreadyInDigestToday = 0;
    const sentMentionedPhones = new Set<string>();

    const categoriesSum = {
      overdue: 0,
      today: 0,
      h_1: 0,
      h_2_h_3: 0,
      h_5_h_7: 0,
      waitingApproval: 0,
      stuck: 0,
    };

    let eligibleTasksCount = 0;
    const eligibleTaskIds = new Set<string>();

    // Pre-calculate digests for counting and aggregation
    const groupDigests: Array<{
      targetGroupId: string;
      target: GroupRouteTarget;
      digest: ReminderDigest;
    }> = [];

    for (const [targetGroupId, groupData] of taskGroups.entries()) {
      const { target, tasks: groupTasks } = groupData;
      const digest = buildReminderDigest(
        groupTasks,
        usersMap,
        eventsMap,
        divisionsMap,
      );

      if (digest.taskIds.length > 0) {
        groupDigests.push({ targetGroupId, target, digest });

        for (const taskId of digest.taskIds) {
          eligibleTaskIds.add(taskId);
        }

        categoriesSum.overdue += digest.categories.overdue;
        categoriesSum.today += digest.categories.today;
        categoriesSum.h_1 += digest.categories.h_1;
        categoriesSum.h_2_h_3 += digest.categories.h_2_h_3;
        categoriesSum.h_5_h_7 += digest.categories.h_5_h_7;
        categoriesSum.waitingApproval += digest.categories.waitingApproval;
        categoriesSum.stuck += digest.categories.stuck;
      }
    }

    eligibleTasksCount = eligibleTaskIds.size;

    // Send group digests
    for (const { targetGroupId, target, digest } of groupDigests) {
      // Check globally across all digest types today (anti-spam)
      const alreadySentTaskIds = await getTaskIdsAlreadyInDigestToday({
        groupId: targetGroupId,
        digestDateKey,
      });

      const newTaskIds = digest.taskIds.filter((taskId: string) => !alreadySentTaskIds.has(taskId));

      if (newTaskIds.length === 0) {
        alreadyInDigestToday += digest.taskIds.length;
        continue;
      }

      // If new tasks are present, send the full digest message for the group
      const messageContent = buildDigestReminderMessage(digest);

      try {
        const dispatchResult = await sendWhatsAppMessage(
          messageContent,
          undefined,
          targetGroupId,
          { mentions: digest.mentionedPhones },
        );

        const whatsappLogId = await logWhatsAppDigestDispatch({
          organizationId: digest.tasks[0]?.task.organization_id ?? "main_org",
          recipient: targetGroupId,
          messageContent,
          status: "sent",
          taskIds: digest.taskIds,
          categories: digest.categories,
          mentionedPhones: digest.mentionedPhones,
          wablasResponse: dispatchResult.responseText,
        });

        await createTaskReminderDigestLog({
          digestType: digest.digestType,
          groupId: targetGroupId,
          digestDateKey,
          taskIds: digest.taskIds,
          allCurrentTaskIds: digest.taskIds,
          newTaskIds: newTaskIds,
          categories: digest.categories,
          mentionedPhones: digest.mentionedPhones,
          status: "sent",
          messageContent,
          whatsappLogId,
          target_group_id: target.groupId,
          target_group_type: target.groupType,
          linked_event_id: target.linkedEventId || undefined,
          linked_division_id: target.linkedDivisionId || undefined,
          fallback_reason: target.fallbackReason || undefined,
        });

        digestSent = true;
        digestTaskCount += digest.taskIds.length;
        newTaskIdsInDigest += newTaskIds.length;
        for (const phone of digest.mentionedPhones) {
          sentMentionedPhones.add(phone);
        }
      } catch (error: unknown) {
        let status = "failed";
        let cooldownUntil: Date | null = null;
        let rateLimitReason: string | undefined;
        const errorMessage =
          error instanceof Error ? error.message : "Gagal mengirim digest.";

        if (error instanceof WhatsAppRateLimitError) {
          status = error.status;
          cooldownUntil = error.cooldownUntil;
          rateLimitReason = error.message;
          skipped.rateLimited++;
        } else {
          errors.push(`Group ${targetGroupId}: ${errorMessage}`);
        }

        const whatsappLogId = await logWhatsAppDigestDispatch({
          organizationId: digest.tasks[0]?.task.organization_id ?? "main_org",
          recipient: targetGroupId,
          messageContent,
          status,
          taskIds: digest.taskIds,
          categories: digest.categories,
          mentionedPhones: digest.mentionedPhones,
          errorMessage,
          cooldownUntil,
          rateLimitReason,
        });

        await createTaskReminderDigestLog({
          digestType: digest.digestType,
          groupId: targetGroupId,
          digestDateKey,
          taskIds: digest.taskIds,
          allCurrentTaskIds: digest.taskIds,
          newTaskIds: newTaskIds,
          categories: digest.categories,
          mentionedPhones: digest.mentionedPhones,
          status: "failed",
          messageContent,
          whatsappLogId,
          target_group_id: target.groupId,
          target_group_type: target.groupType,
          linked_event_id: target.linkedEventId || undefined,
          linked_division_id: target.linkedDivisionId || undefined,
          fallback_reason: target.fallbackReason || undefined,
        });
      }
    }

    // Skip output if all checked groups were skipped
    if (!digestSent && alreadyInDigestToday > 0) {
      return NextResponse.json({
        digestSent: false,
        digestSkippedReason: "already_sent_today_no_new_tasks",
        alreadyInDigestToday,
      });
    }

    skipped.alreadyInDigestToday = alreadyInDigestToday;

    return NextResponse.json({
      ok: true,
      checkedTasks,
      eligibleTasks: eligibleTasksCount,
      groupsChecked: Object.keys(taskGroups).length || taskGroups.size,
      digestSent,
      digestTaskCount,
      newTaskIdsInDigest,
      categories: categoriesSum,
      skipped,
      mentionedPhones: Array.from(sentMentionedPhones),
      errors,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error.";
    errors.push(errorMessage);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal Server Error in Cron processing.",
        checkedTasks: 0,
        eligibleTasks: 0,
        groupsChecked: 0,
        digestSent: false,
        digestTaskCount: 0,
        newTaskIdsInDigest: 0,
        categories: null,
        skipped,
        mentionedPhones: [],
        errors,
      },
      { status: 500 },
    );
  }
}
