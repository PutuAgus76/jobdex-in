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
} from "@/lib/server/deadline-reminders";
import type { Task, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

type CronSkippedSummary = {
  alreadyInDigestToday: number;
  completed: number;
  archived: number;
  noDeadlineOrDigestCategory: number;
  rateLimited: number;
};

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

function isCompletedTask(data: Partial<Task>) {
  return (
    data.status === "approved" ||
    data.status === ("selesai" as Task["status"]) ||
    data.approval_status === "approved"
  );
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
  const groupId = getWhatsAppRecipient();

  if (!groupId) {
    return NextResponse.json(
      { error: "WhatsApp group ID not configured." },
      { status: 500 },
    );
  }

  const skipped: CronSkippedSummary = {
    alreadyInDigestToday: 0,
    completed: 0,
    archived: 0,
    noDeadlineOrDigestCategory: 0,
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

    const digest = buildReminderDigest(
      activeTasks,
      usersMap,
      eventsMap,
      divisionsMap,
    );

    skipped.noDeadlineOrDigestCategory = Math.max(
      activeTasks.length - digest.taskIds.length,
      0,
    );

    const digestDateKey = getDigestDateKey();
    const alreadyInDigest = await getTaskIdsAlreadyInDigestToday({
      digestType: digest.digestType,
      groupId,
      digestDateKey,
    });
    const newTaskIds = digest.taskIds.filter((taskId) => !alreadyInDigest.has(taskId));
    skipped.alreadyInDigestToday = digest.taskIds.length - newTaskIds.length;

    if (digest.taskIds.length === 0) {
      return NextResponse.json({
        ok: true,
        checkedTasks,
        eligibleTasks: 0,
        digestSent: false,
        digestTaskCount: 0,
        digestType: digest.digestType,
        categories: digest.categories,
        skipped,
        mentionedPhones: [],
        errors,
      });
    }

    if (newTaskIds.length === 0) {
      return NextResponse.json({
        ok: true,
        checkedTasks,
        eligibleTasks: digest.taskIds.length,
        digestSent: false,
        digestTaskCount: 0,
        digestType: digest.digestType,
        skippedReason: "Semua task eligible sudah masuk digest hari ini.",
        categories: digest.categories,
        skipped,
        mentionedPhones: digest.mentionedPhones,
        errors,
      });
    }

    const newTaskIdSet = new Set(newTaskIds);
    const digestToSend = {
      ...digest,
      tasks: digest.tasks.filter((item) => newTaskIdSet.has(item.task.id)),
      taskIds: newTaskIds,
      mentionedPhones: Array.from(
        new Set(
          digest.tasks
            .filter((item) => newTaskIdSet.has(item.task.id))
            .map((item) => item.pic?.whatsapp_number ?? "")
            .map((phone) => phone.replace(/[^\d]/g, "").replace(/^0/, "62"))
            .filter(Boolean),
        ),
      ),
    };
    const messageContent = buildDigestReminderMessage(digestToSend);

    try {
      const dispatchResult = await sendWhatsAppMessage(
        messageContent,
        undefined,
        groupId,
        { mentions: digestToSend.mentionedPhones },
      );
      const whatsappLogId = await logWhatsAppDigestDispatch({
        organizationId: digestToSend.tasks[0]?.task.organization_id ?? "main_org",
        recipient: groupId,
        messageContent,
        status: "sent",
        taskIds: digestToSend.taskIds,
        categories: digestToSend.categories,
        mentionedPhones: digestToSend.mentionedPhones,
        wablasResponse: dispatchResult.responseText,
      });

      await createTaskReminderDigestLog({
        digestType: digestToSend.digestType,
        groupId,
        digestDateKey,
        taskIds: digestToSend.taskIds,
        categories: digestToSend.categories,
        mentionedPhones: digestToSend.mentionedPhones,
        status: "sent",
        messageContent,
        whatsappLogId,
      });

      return NextResponse.json({
        ok: true,
        checkedTasks,
        eligibleTasks: digest.taskIds.length,
        digestSent: true,
        digestTaskCount: digestToSend.taskIds.length,
        digestType: digestToSend.digestType,
        categories: digest.categories,
        skipped,
        mentionedPhones: digestToSend.mentionedPhones,
        errors,
      });
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
        errors.push(errorMessage);
      }

      const whatsappLogId = await logWhatsAppDigestDispatch({
        organizationId: digestToSend.tasks[0]?.task.organization_id ?? "main_org",
        recipient: groupId,
        messageContent,
        status,
        taskIds: digestToSend.taskIds,
        categories: digestToSend.categories,
        mentionedPhones: digestToSend.mentionedPhones,
        errorMessage,
        cooldownUntil,
        rateLimitReason,
      });

      await createTaskReminderDigestLog({
        digestType: digestToSend.digestType,
        groupId,
        digestDateKey,
        taskIds: digestToSend.taskIds,
        categories: digestToSend.categories,
        mentionedPhones: digestToSend.mentionedPhones,
        status: "failed",
        messageContent,
        whatsappLogId,
      });

      return NextResponse.json({
        ok: false,
        checkedTasks,
        eligibleTasks: digest.taskIds.length,
        digestSent: false,
        digestTaskCount: digestToSend.taskIds.length,
        digestType: digestToSend.digestType,
        categories: digest.categories,
        skipped,
        mentionedPhones: digestToSend.mentionedPhones,
        errors,
      });
    }
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
        digestSent: false,
        digestTaskCount: 0,
        categories: null,
        skipped,
        mentionedPhones: [],
        errors,
      },
      { status: 500 },
    );
  }
}
