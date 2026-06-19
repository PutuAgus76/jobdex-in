import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/seed-data";
import { isKoordinatorAcara, isKoordinatorDivisi, isSuperAdmin } from "@/lib/permissions";
import type { Event, EventInput, EventStatus, UserProfile } from "@/types";

function eventDateToTimestamp(value: string) {
  return Timestamp.fromDate(new Date(`${value}T00:00:00`));
}

export async function getEventsForProfile(profile: UserProfile) {
  const eventsRef = collection(db, "events");
  const eventsQuery =
    isSuperAdmin(profile) || isKoordinatorDivisi(profile)
      ? query(eventsRef, orderBy("event_date", "asc"))
      : isKoordinatorAcara(profile)
        ? query(eventsRef, where("coordinator_id", "==", profile.id))
        : null;

  if (!eventsQuery) {
    return [];
  }

  const snapshot = await getDocs(eventsQuery);
  const events = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Event[];

  return events.sort((a, b) => {
    const aDate = a.event_date ? getDateMillis(a.event_date) : (a.created_at ? getDateMillis(a.created_at) : (a.updated_at ? getDateMillis(a.updated_at) : 0));
    const bDate = b.event_date ? getDateMillis(b.event_date) : (b.created_at ? getDateMillis(b.created_at) : (b.updated_at ? getDateMillis(b.updated_at) : 0));
    return bDate - aDate;
  });
}

export async function getEventById(eventId: string) {
  const snapshot = await getDoc(doc(db, "events", eventId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Event;
}

export async function createEvent(input: EventInput, createdBy: string) {
  const eventRef = await addDoc(collection(db, "events"), {
    organization_id: DEFAULT_ORGANIZATION_ID,
    name: input.name,
    description: input.description,
    event_date: eventDateToTimestamp(input.event_date),
    coordinator_id: input.coordinator_id,
    status: input.status,
    progress_percentage: 0,
    whatsapp_group_id: input.whatsapp_group_id || "",
    whatsapp_group_name: input.whatsapp_group_name || "",
    whatsapp_group_verified: false,
    whatsapp_group_updated_at: serverTimestamp(),
    whatsapp_group_updated_by: createdBy,
    created_by: createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return eventRef.id;
}

export async function updateEvent(eventId: string, input: EventInput, updatedBy?: string) {
  const eventRef = doc(db, "events", eventId);
  const eventSnap = await getDoc(eventRef);
  const existingData = eventSnap.exists() ? eventSnap.data() as Event : null;

  const updateData: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    event_date: eventDateToTimestamp(input.event_date),
    coordinator_id: input.coordinator_id,
    status: input.status,
    updated_at: serverTimestamp(),
  };

  if (input.whatsapp_group_id !== undefined) {
    const newGroupId = input.whatsapp_group_id;
    const newGroupName = input.whatsapp_group_name || "";
    const oldGroupId = existingData?.whatsapp_group_id || "";
    const isGroupIdChanged = oldGroupId !== newGroupId;

    updateData.whatsapp_group_id = newGroupId;
    updateData.whatsapp_group_name = newGroupName;

    if (isGroupIdChanged) {
      updateData.whatsapp_group_verified = false;
      updateData.whatsapp_group_updated_at = serverTimestamp();
      if (updatedBy) {
        updateData.whatsapp_group_updated_by = updatedBy;
      }
    }
  }

  await updateDoc(eventRef, updateData);
}

export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
) {
  await updateDoc(doc(db, "events", eventId), {
    status,
    updated_at: serverTimestamp(),
  });
}

export function getDateInputValue(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "";
  }

  const date = (value as { toDate: () => Date }).toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatEventDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format((value as { toDate: () => Date }).toDate());
}

function getDateMillis(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return 0;
  }

  return (value as { toDate: () => Date }).toDate().getTime();
}
