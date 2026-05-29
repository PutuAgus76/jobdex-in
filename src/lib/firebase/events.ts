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
    const aDate = getDateMillis(a.event_date);
    const bDate = getDateMillis(b.event_date);
    return aDate - bDate;
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
    created_by: createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return eventRef.id;
}

export async function updateEvent(eventId: string, input: EventInput) {
  await updateDoc(doc(db, "events", eventId), {
    name: input.name,
    description: input.description,
    event_date: eventDateToTimestamp(input.event_date),
    coordinator_id: input.coordinator_id,
    status: input.status,
    updated_at: serverTimestamp(),
  });
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

  return (value as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
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
