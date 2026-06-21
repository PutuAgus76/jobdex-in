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

function getTaskTimestampMillis(task: Task) {
  if (task.created_at) return getMillis(task.created_at);
  if (task.updated_at) return getMillis(task.updated_at);
  if (task.deadline) return getMillis(task.deadline);
  return 0;
}

function sortTasks(tasks: Task[]) {
  return tasks.sort((a, b) => getTaskTimestampMillis(b) - getTaskTimestampMillis(a));
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

export function getTaskProgressWeight(status: string): number {
  switch (status) {
    case "approved":
      return 100;
    case "menunggu_approval":
      return 85;
    case "draft_selesai":
      return 70;
    case "perlu_revisi":
    case "revisi_dikerjakan":
      return 65;
    case "butuh_bantuan":
    case "stuck":
      return 40;
    case "sedang_dikerjakan":
    case "menunggu_materi":
      return 30;
    case "belum_dimulai":
    case "ditunda":
    default:
      return 0;
  }
}

export async function recalculateEventProgress(eventId: string): Promise<number> {
  if (!eventId) return 0;
  try {
    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      where("event_id", "==", eventId),
      where("is_archived", "==", false)
    );
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map((doc) => doc.data() as Task);

    if (tasks.length === 0) {
      try {
        await updateDoc(doc(db, "events", eventId), {
          progress_percentage: 0,
          updated_at: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Recalculate event progress ignored (no permission):", err);
      }
      return 0;
    }

    let totalWeight = 0;
    for (const task of tasks) {
      totalWeight += getTaskProgressWeight(task.status);
    }

    const progress = Math.round(totalWeight / tasks.length);
    try {
      await updateDoc(doc(db, "events", eventId), {
        progress_percentage: progress,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Recalculate event progress ignored (no permission):", err);
    }

    return progress;
  } catch (error) {
    console.error("Gagal menghitung ulang progress acara:", error);
    return 0;
  }
}

export async function createTask(input: TaskInput, createdBy: string) {
  const defaultChecklist = [
    { id: "checklist_1", label: "Redaksi/materi tersedia", is_done: false },
    { id: "checklist_2", label: "Referensi desain tersedia", is_done: false },
    { id: "checklist_3", label: "Mulai desain/draft awal", is_done: false },
    { id: "checklist_4", label: "Revisi internal", is_done: false },
    { id: "checklist_5", label: "Finalisasi desain", is_done: false },
    { id: "checklist_6", label: "Upload hasil ke JobDex.in / Drive", is_done: false },
  ];

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
    checklist_items: defaultChecklist,
    created_by: createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    category_key: input.category_key || "",
    category_label: input.category_label || "",
    subcategory_key: input.subcategory_key || "",
    subcategory_label: input.subcategory_label || "",
    output_types: input.output_types || [],
    archive_enabled: input.archive_enabled ?? true,
    reference_candidate_enabled: input.reference_candidate_enabled ?? false,
    requires_file: input.requires_file ?? false,
    requires_source_link: input.requires_source_link ?? false,
    source_link: input.source_link || "",
    archive_notes: input.archive_notes || "",
    data_sensitivity: input.data_sensitivity || "normal",
  });

  if (input.type === "acara" && input.event_id) {
    await recalculateEventProgress(input.event_id);
  }

  return taskRef.id;
}

export async function updateTask(taskId: string, input: TaskInput) {
  const oldDoc = await getDoc(doc(db, "tasks", taskId));
  const oldData = oldDoc.exists() ? oldDoc.data() : null;

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
    category_key: input.category_key || "",
    category_label: input.category_label || "",
    subcategory_key: input.subcategory_key || "",
    subcategory_label: input.subcategory_label || "",
    output_types: input.output_types || [],
    archive_enabled: input.archive_enabled ?? true,
    reference_candidate_enabled: input.reference_candidate_enabled ?? false,
    requires_file: input.requires_file ?? false,
    requires_source_link: input.requires_source_link ?? false,
    source_link: input.source_link || "",
    archive_notes: input.archive_notes || "",
    data_sensitivity: input.data_sensitivity || "normal",
  });

  if (oldData && oldData.type === "acara" && oldData.event_id) {
    await recalculateEventProgress(oldData.event_id);
  }
  if (input.type === "acara" && input.event_id && input.event_id !== oldData?.event_id) {
    await recalculateEventProgress(input.event_id);
  }
}

export async function archiveTask(taskId: string) {
  const oldDoc = await getDoc(doc(db, "tasks", taskId));
  const oldData = oldDoc.exists() ? oldDoc.data() : null;

  await updateDoc(doc(db, "tasks", taskId), {
    is_archived: true,
    updated_at: serverTimestamp(),
  });

  if (oldData && oldData.type === "acara" && oldData.event_id) {
    await recalculateEventProgress(oldData.event_id);
  }
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
