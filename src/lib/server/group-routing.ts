import "server-only";

import { getAdminDb } from "@/lib/server/firebase-admin";
import type { Task, Event } from "@/types";

export type GroupRouteTarget = {
  groupId: string;
  groupType: "event_group" | "division_group" | "default_group";
  groupName?: string;
  linkedEventId?: string;
  linkedDivisionId?: string;
  fallbackReason?: string;
};

/**
 * Resolves the WhatsApp group target for a task's reminder.
 * Priority: event group > division group > default group
 */
export async function resolveTaskReminderTarget(
  task: Task,
  eventsCache?: Map<string, Event>
): Promise<GroupRouteTarget | null> {
  const defaultGroupId = process.env.WABLAS_DEFAULT_GROUP_ID || process.env.WABLAS_GROUP_ID || "";
  let eventHasUnverifiedGroup = false;

  // 1. Check event group
  if (task.event_id) {
    let event: Event | undefined;

    if (eventsCache) {
      event = eventsCache.get(task.event_id);
    } else {
      const db = getAdminDb();
      const eventDoc = await db.collection("events").doc(task.event_id).get();
      if (eventDoc.exists) {
        event = { id: eventDoc.id, ...eventDoc.data() } as Event;
      }
    }

    if (event?.whatsapp_group_id) {
      const isStrict = process.env.STRICT_GROUP_ROUTING === "true";
      if (!isStrict || event.whatsapp_group_verified) {
        return {
          groupId: event.whatsapp_group_id,
          groupType: "event_group",
          groupName: event.whatsapp_group_name || event.name,
          linkedEventId: event.id,
        };
      } else {
        eventHasUnverifiedGroup = true;
      }
    }
  }

  // 2. Check division group (future: divisions could have whatsapp_group_id too)
  // For now, fallback directly to default group

  // 3. Fallback to default group
  if (defaultGroupId) {
    return {
      groupId: defaultGroupId,
      groupType: "default_group",
      linkedDivisionId: task.division_id,
      linkedEventId: task.event_id,
      fallbackReason: eventHasUnverifiedGroup
        ? "event_group_unverified"
        : (task.event_id ? "event_has_no_group" : "no_event_or_division_group"),
    };
  }

  // 4. No target available
  return null;
}

/**
 * Groups tasks by their resolved WhatsApp target group.
 * Returns a Map where key = groupId, value = tasks and metadata
 */
export async function groupTasksByTarget(
  tasks: Task[],
  eventsCache?: Map<string, Event>
): Promise<Map<string, { target: GroupRouteTarget; tasks: Task[] }>> {
  const groups = new Map<string, { target: GroupRouteTarget; tasks: Task[] }>();
  const skipped: { task: Task; reason: string }[] = [];

  for (const task of tasks) {
    const target = await resolveTaskReminderTarget(task, eventsCache);

    if (!target) {
      skipped.push({ task, reason: "missing_group_target" });
      continue;
    }

    const existing = groups.get(target.groupId);
    if (existing) {
      existing.tasks.push(task);
    } else {
      groups.set(target.groupId, { target, tasks: [task] });
    }
  }

  if (skipped.length > 0) {
    console.warn(
      `[GroupRouting] Skipped ${skipped.length} tasks with no group target:`,
      skipped.map((s) => ({ taskId: s.task.id, taskName: s.task.name, reason: s.reason }))
    );
  }

  return groups;
}

/**
 * Find events that have a WhatsApp group ID assigned
 */
export async function getEventsWithGroupId(): Promise<Event[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("events").get();
  const events: Event[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data() as Event;
    if (data.whatsapp_group_id) {
      events.push({ ...data, id: doc.id });
    }
  });

  return events;
}

/**
 * Find event linked to a specific WhatsApp group ID
 */
export async function findEventByGroupId(groupId: string): Promise<Event | null> {
  if (!groupId) return null;

  const db = getAdminDb();
  const snapshot = await db
    .collection("events")
    .where("whatsapp_group_id", "==", groupId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Event;
}

/**
 * Link a WhatsApp group to an event
 */
export async function linkGroupToEvent(
  eventId: string,
  groupId: string,
  groupName: string,
  linkedBy: string,
  source: "manual" | "webhook_detected" | "admin_input" = "webhook_detected"
): Promise<void> {
  const db = getAdminDb();
  const { FieldValue } = await import("@/lib/server/firebase-admin");

  await db.collection("events").doc(eventId).update({
    whatsapp_group_id: groupId,
    whatsapp_group_name: groupName || "",
    whatsapp_group_verified: true,
    whatsapp_group_linked_at: FieldValue.serverTimestamp(),
    whatsapp_group_linked_by: linkedBy,
    whatsapp_group_updated_at: FieldValue.serverTimestamp(),
    whatsapp_group_updated_by: linkedBy,
    whatsapp_group_source: source,
    updated_at: FieldValue.serverTimestamp(),
  });
}
