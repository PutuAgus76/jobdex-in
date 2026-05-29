import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { EventMember } from "@/types";

export async function getEventMembers(eventId: string) {
  const snapshot = await getDocs(collection(db, "events", eventId, "event_members"));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as EventMember[];
}

export async function addEventMember({
  eventId,
  userId,
  roleInEvent,
  addedBy,
}: {
  eventId: string;
  userId: string;
  roleInEvent: string;
  addedBy: string;
}) {
  await setDoc(doc(db, "events", eventId, "event_members", userId), {
    id: userId,
    event_id: eventId,
    user_id: userId,
    role_in_event: roleInEvent,
    added_by: addedBy,
    added_at: serverTimestamp(),
  });
}

export async function removeEventMember(eventId: string, userId: string) {
  await deleteDoc(doc(db, "events", eventId, "event_members", userId));
}
