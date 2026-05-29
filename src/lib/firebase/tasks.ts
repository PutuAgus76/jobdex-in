import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_DIVISION_ID, DEFAULT_ORGANIZATION_ID } from "@/lib/seed-data";
import {
  isKoordinatorAcara,
  isKoordinatorDivisi,
  isSuperAdmin,
} from "@/lib/permissions";
import type { Task, TaskInput, UserProfile } from "@/types";

function dateToTimestamp(value: string) {
  return Timestamp.fromDate(new Date(`${value}T00:00:00`));
}

function sortTasks(tasks: Task[]) {
  return tasks.sort((a, b) => getMillis(a.deadline) - getMillis(b.deadline));
}

export async function getTasksForProfile(profile: UserProfile) {
  const tasksRef = collection(db, "tasks");
  const tasksQuery =
    isSuperAdmin(profile) || isKoordinatorDivisi(profile)
      ? query(tasksRef, where("is_archived", "==", false))
      : isKoordinatorAcara(profile)
        ? query(tasksRef, where("coordinator_id", "==", profile.id))
        : query(tasksRef, where("pic_id", "==", profile.id));

  const snapshot = await getDocs(tasksQuery);
  const tasks = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Task[];

  return sortTasks(tasks.filter((task) => !task.is_archived));
}

export async function getTasksByEvent(eventId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "tasks"),
      where("event_id", "==", eventId),
      where("is_archived", "==", false),
    ),
  );

  return sortTasks(
    snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Task[],
  );
}

export async function getTaskById(taskId: string) {
  const snapshot = await getDoc(doc(db, "tasks", taskId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Task;
}

export async function createTask(input: TaskInput, createdBy: string) {
  const taskRef = await addDoc(collection(db, "tasks"), {
    organization_id: DEFAULT_ORGANIZATION_ID,
    type: input.type,
    division_id: input.type === "divisi" ? DEFAULT_DIVISION_ID : "",
    event_id: input.type === "acara" ? input.event_id : "",
    name: input.name,
    description: input.description,
    pic_id: input.pic_id,
    coordinator_id: input.coordinator_id,
    deadline: dateToTimestamp(input.deadline),
    status: input.status,
    priority: input.priority,
    copywriting: input.copywriting,
    copywriting_docs_url: input.copywriting_docs_url,
    design_reference_url: input.design_reference_url,
    drive_reference_url: input.drive_reference_url,
    color_palette: input.color_palette,
    visual_direction: input.visual_direction,
    revision_notes: "",
    stuck_notes: "",
    result_design_url: "",
    approval_status: "pending",
    is_archived: false,
    created_by: createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return taskRef.id;
}

export async function updateTask(taskId: string, input: TaskInput) {
  await updateDoc(doc(db, "tasks", taskId), {
    type: input.type,
    division_id: input.type === "divisi" ? DEFAULT_DIVISION_ID : "",
    event_id: input.type === "acara" ? input.event_id : "",
    name: input.name,
    description: input.description,
    pic_id: input.pic_id,
    coordinator_id: input.coordinator_id,
    deadline: dateToTimestamp(input.deadline),
    status: input.status,
    priority: input.priority,
    copywriting: input.copywriting,
    copywriting_docs_url: input.copywriting_docs_url,
    design_reference_url: input.design_reference_url,
    drive_reference_url: input.drive_reference_url,
    color_palette: input.color_palette,
    visual_direction: input.visual_direction,
    updated_at: serverTimestamp(),
  });
}

export async function archiveTask(taskId: string) {
  await updateDoc(doc(db, "tasks", taskId), {
    is_archived: true,
    updated_at: serverTimestamp(),
  });
}

export function formatTaskDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format((value as { toDate: () => Date }).toDate());
}

export function getTaskDateInputValue(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "";
  }

  return (value as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
}

function getMillis(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return 0;
  }

  return (value as { toDate: () => Date }).toDate().getTime();
}
