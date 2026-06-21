import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/seed-data";
import { isKoordinator, isKoordinatorAcara } from "@/lib/permissions";
import type {
  DesignReference,
  DesignReferenceInput,
  UserProfile,
  ReferenceListItem,
  Task,
  TaskUpload,
  DesignType,
} from "@/types";
import { getTaskUploads } from "@/lib/firebase/task-uploads";

function sortReferences(references: DesignReference[]) {
  return references.sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }

    return a.title.localeCompare(b.title);
  });
}

export async function getDesignReferencesForProfile(profile: UserProfile) {
  const referencesRef = collection(db, "design_references");
  const referencesQuery = isKoordinator(profile)
    ? query(referencesRef)
    : query(
        referencesRef,
        where("is_archived", "==", false),
      );

  const snapshot = await getDocs(referencesQuery);
  const references = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as DesignReference[];

  return sortReferences(
    isKoordinator(profile)
      ? references
      : references.filter((reference) => !reference.is_archived),
  );
}

export async function createDesignReference(
  input: DesignReferenceInput,
  createdBy: string,
) {
  const referenceRef = doc(collection(db, "design_references"));

  await setDoc(referenceRef, {
    id: referenceRef.id,
    organization_id: DEFAULT_ORGANIZATION_ID,
    title: input.title,
    event_name: input.event_name,
    design_type: input.design_type,
    year: input.year,
    drive_url: input.drive_url,
    thumbnail_url: input.thumbnail_url,
    style_notes: input.style_notes,
    color_palette: input.color_palette,
    notes: input.notes,
    is_archived: false,
    created_by: createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    
    // New fields
    scope: input.scope || "divisi",
    category: input.category || "lainnya",
    event_id: input.event_id || "",
    drive_links: input.drive_links || [],
    canva_links: input.canva_links || [],
    doc_links: input.doc_links || [],
    other_links: input.other_links || [],
    summary_notes: input.summary_notes || "",
    file_inventory_notes: input.file_inventory_notes || "",
    file_inventory: input.file_inventory || [],
  });

  return referenceRef.id;
}

export async function updateDesignReference(
  referenceId: string,
  input: DesignReferenceInput,
) {
  await updateDoc(doc(db, "design_references", referenceId), {
    title: input.title,
    event_name: input.event_name,
    design_type: input.design_type,
    year: input.year,
    drive_url: input.drive_url,
    thumbnail_url: input.thumbnail_url,
    style_notes: input.style_notes,
    color_palette: input.color_palette,
    notes: input.notes,
    updated_at: serverTimestamp(),

    // New fields
    scope: input.scope || "divisi",
    category: input.category || "lainnya",
    event_id: input.event_id || "",
    drive_links: input.drive_links || [],
    canva_links: input.canva_links || [],
    doc_links: input.doc_links || [],
    other_links: input.other_links || [],
    summary_notes: input.summary_notes || "",
    file_inventory_notes: input.file_inventory_notes || "",
    file_inventory: input.file_inventory || [],
  });
}

export async function archiveDesignReference(referenceId: string) {
  await updateDoc(doc(db, "design_references", referenceId), {
    is_archived: true,
    updated_at: serverTimestamp(),
  });
}

export function canCreateDesignReference(profile: UserProfile | null) {
  return isKoordinator(profile);
}

export function canEditDesignReference(
  profile: UserProfile | null,
  reference: DesignReference | null,
) {
  if (!profile || !reference) {
    return false;
  }

  if (profile.role === "super_admin" || profile.role === "koordinator_divisi") {
    return true;
  }

  return isKoordinatorAcara(profile) && reference.created_by === profile.id;
}

export function mapTaskSubcategoryToDesignType(subcategoryKey?: string): DesignType {
  if (!subcategoryKey) return "lainnya";
  const key = subcategoryKey.toLowerCase();
  if (key === "poster") return "poster";
  if (key === "name_tag" || key === "id_card" || key === "kartu_panitia" || key === "badge_peserta") return "name_tag";
  if (key === "twibbon") return "twibbon";
  if (key.includes("feed")) return "feed_ig";
  if (key.includes("story")) return "story_ig";
  if (key.includes("banner") || key.includes("spanduk") || key.includes("backdrop") || key.includes("baliho")) return "banner";
  if (key === "sertifikat" || key === "piagam") return "sertifikat";
  if (key.includes("foto") || key.includes("dokumentasi")) return "dokumentasi";
  if (key.includes("video") || key.includes("animasi")) return "animasi";
  if (key.includes("merchandise") || key.includes("kaos") || key.includes("baju") || key.includes("plakat")) return "merchandise";
  return "lainnya";
}

export async function getCombinedReferencesForDashboard(profile: UserProfile): Promise<ReferenceListItem[]> {
  // 1. Fetch manual references
  const manualReferences = await getDesignReferencesForProfile(profile);
  const normalizedManual: ReferenceListItem[] = manualReferences.map((ref) => ({
    id: ref.id,
    source_type: "manual_reference",
    title: ref.title,
    event_name: ref.event_name,
    year: ref.year,
    scope: ref.scope,
    visual_type: ref.design_type,
    category_label: ref.category,
    thumbnail_url: ref.thumbnail_url,
    file_url: ref.drive_url,
    source_link: ref.canva_links?.[0] || ref.drive_links?.[0] || "",
    source_link_type: ref.canva_links?.length ? "canva" : "other",
    notes: ref.notes || ref.style_notes,
    status: ref.is_archived ? "archived" : "active",
    created_at: ref.created_at,
    updated_at: ref.updated_at,
    event_id: ref.event_id,
    color_palette: ref.color_palette,
    file_inventory: ref.file_inventory,
    file_inventory_notes: ref.file_inventory_notes,
    created_by: ref.created_by,
  }));

  // 2. Fetch approved tasks
  const tasksRef = collection(db, "tasks");
  const tasksQuery = query(
    tasksRef,
    where("reference_candidate_enabled", "==", true)
  );
  
  const tasksSnap = await getDocs(tasksQuery);
  const candidateTasks = tasksSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];

  // Fetch events to resolve event names
  const eventsSnap = await getDocs(collection(db, "events"));
  const eventsMap = new Map<string, string>();
  eventsSnap.forEach((doc) => {
    eventsMap.set(doc.id, doc.data().name || "");
  });

  // Filter tasks in memory:
  // - status === "approved" || approval_status === "approved"
  // - is_archived === false OR (is_archived === true && archive_enabled === true)
  // - data_sensitivity !== "sensitive" (check profile access)
  const filteredTasks = candidateTasks.filter((task) => {
    const isApproved = task.status === "approved" || task.approval_status === "approved";
    if (!isApproved) return false;

    const isArchiveMatch = !task.is_archived || (task.is_archived && task.archive_enabled);
    if (!isArchiveMatch) return false;

    if (task.data_sensitivity === "sensitive") {
      const hasAccess =
        profile.role === "super_admin" ||
        profile.role === "koordinator_divisi" ||
        task.pic_id === profile.id ||
        task.coordinator_id === profile.id;
      if (!hasAccess) return false;
    }

    const hasResult = !!task.result_design_url || !!task.source_link;
    if (!hasResult) return false;

    return true;
  });

  // For each task, fetch its uploads in parallel to get the latest approved upload's metadata
  const taskReferences = await Promise.all(
    filteredTasks.map(async (task) => {
      let uploads: TaskUpload[] = [];
      try {
        uploads = await getTaskUploads(task.id);
      } catch (err) {
        console.warn(`Gagal memuat uploads untuk task ${task.id}:`, err);
      }

      const finalUpload = uploads.find((u) => u.is_final_candidate) || uploads[0];

      // Determine year
      let taskYear: number = new Date().getFullYear();
      if (task.deadline) {
        const deadline = task.deadline as { toDate?: () => Date } | Date | string | number;
        const d = (typeof deadline === "object" && deadline && "toDate" in deadline && typeof deadline.toDate === "function")
          ? deadline.toDate()
          : new Date(deadline as string | number | Date);
        if (!isNaN(d.getTime())) {
          taskYear = d.getFullYear();
        }
      }

      const visualType = mapTaskSubcategoryToDesignType(task.subcategory_key);

      const fileUrl = finalUpload?.upload_url || task.result_design_url || "";
      const thumbnail_url = finalUpload?.thumbnail_url || (fileUrl && fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? fileUrl : "");
      const sourceLink = finalUpload?.source_link || task.source_link || "";
      const sourceLinkType = finalUpload?.source_link_type || (sourceLink.includes("canva.com") ? "canva" : "other");
      const eventName = task.event_id ? (eventsMap.get(task.event_id) || "") : "";

      return {
        id: `task_${task.id}`,
        source_type: "approved_task" as const,
        title: task.name,
        event_name: eventName,
        year: taskYear,
        scope: task.type,
        visual_type: visualType,
        category_label: task.category_label || task.category_key,
        subcategory_label: task.subcategory_label || task.subcategory_key,
        thumbnail_url,
        file_url: fileUrl,
        source_link: sourceLink,
        source_link_type: sourceLinkType,
        notes: finalUpload?.upload_note || task.description || "",
        status: (task.is_archived ? "archived" : "active") as "active" | "archived",
        created_at: task.created_at,
        updated_at: task.approved_at || task.updated_at,
        task_id: task.id,
        event_id: task.event_id,
        color_palette: task.color_palette || [],
        file_inventory: uploads.map((u) => ({
          name: u.file_name || `Hasil pengerjaan - v${u.version_number}`,
          url: u.upload_url || u.source_link || "",
          type: "file" as const,
          mime_type: u.file_type || "",
        })),
        file_inventory_notes: finalUpload?.upload_note || "",
        created_by: task.pic_id || task.created_by || "",
      };
    })
  );

  const combined = [...normalizedManual, ...taskReferences];
  
  return combined.sort((a, b) => {
    const yearA = typeof a.year === "number" ? a.year : parseInt(String(a.year || "0")) || 0;
    const yearB = typeof b.year === "number" ? b.year : parseInt(String(b.year || "0")) || 0;
    if (yearB !== yearA) {
      return yearB - yearA;
    }
    return a.title.localeCompare(b.title);
  });
}
