import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthContext } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { isTaskReferenceEligible, mapTaskSubcategoryToDesignType } from "@/lib/reference-utils";
import type { ReferenceListItem, Task, TaskUpload, DesignReference } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { profile } = await getServerAuthContext(request);
    const db = getAdminDb();

    // 2. Fetch manual references
    const isKoordinatorUser =
      profile.role === "super_admin" ||
      profile.role === "koordinator_divisi" ||
      profile.role === "koordinator_acara";

    const referencesRef = db.collection("design_references");
    let referencesQuery = referencesRef.where("is_archived", "==", false);
    if (isKoordinatorUser) {
      referencesQuery = referencesRef;
    }
    
    const referencesSnap = await referencesQuery.get();
    const manualReferences: DesignReference[] = [];
    referencesSnap.forEach((doc) => {
      manualReferences.push({ id: doc.id, ...doc.data() } as DesignReference);
    });

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

    // 3. Fetch approved tasks using Admin SDK
    const tasksRef = db.collection("tasks");
    const tasksSnap = await tasksRef.where("status", "==", "approved").get();
    const approvedTasks: Task[] = [];
    tasksSnap.forEach((doc) => {
      approvedTasks.push({ id: doc.id, ...doc.data() } as Task);
    });

    // Fetch all events to resolve names
    const eventsSnap = await db.collection("events").get();
    const eventsMap = new Map<string, string>();
    eventsSnap.forEach((doc) => {
      eventsMap.set(doc.id, doc.data().name || "");
    });

    // Fetch all divisions to resolve names
    const divisionsSnap = await db.collection("divisions").get();
    const divisionsMap = new Map<string, string>();
    divisionsSnap.forEach((doc) => {
      divisionsMap.set(doc.id, doc.data().name || "");
    });

    // Fetch uploads subcollection in parallel for tasks
    const tasksWithUploads = await Promise.all(
      approvedTasks.map(async (task) => {
        const uploadsSnap = await db
          .collection("tasks")
          .doc(task.id)
          .collection("uploads")
          .orderBy("version_number", "desc")
          .get();

        const uploads: TaskUpload[] = [];
        uploadsSnap.forEach((doc) => {
          uploads.push({ id: doc.id, ...doc.data() } as TaskUpload);
        });

        return { task, uploads };
      })
    );

    // Filter tasks based on eligibility and sensitivity
    const filteredTaskReferences: ReferenceListItem[] = [];

    for (const { task, uploads } of tasksWithUploads) {
      if (!isTaskReferenceEligible(task, uploads.length)) {
        continue;
      }

      // Check sensitivity:
      if (task.data_sensitivity === "sensitive") {
        const hasAccess =
          profile.role === "super_admin" ||
          profile.role === "koordinator_divisi" ||
          task.pic_id === profile.id ||
          task.coordinator_id === profile.id;
        if (!hasAccess) continue;
      }

      const finalUpload = uploads.find((u) => u.is_final_candidate) || uploads[0];

      // Determine year
      let taskYear: number = new Date().getFullYear();
      if (task.deadline) {
        const deadline = task.deadline as { toDate?: () => Date } | Date | string | number;
        const d =
          typeof deadline === "object" &&
          deadline &&
          "toDate" in deadline &&
          typeof deadline.toDate === "function"
            ? deadline.toDate()
            : new Date(deadline as string | number | Date);
        if (!isNaN(d.getTime())) {
          taskYear = d.getFullYear();
        }
      }

      const visualType = mapTaskSubcategoryToDesignType(task.subcategory_key);
      const fileUrl = finalUpload?.upload_url || task.result_design_url || "";
      const thumbnail_url =
        finalUpload?.thumbnail_url ||
        (fileUrl && fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? fileUrl : "");
      const sourceLink = finalUpload?.source_link || task.source_link || "";
      const sourceLinkType =
        finalUpload?.source_link_type ||
        (sourceLink.includes("canva.com") ? "canva" : "other");

      // Fase 26A: Bedakan event_name untuk task acara vs divisi
      let eventName: string;
      if (task.type === "acara" && task.event_id) {
        eventName = eventsMap.get(task.event_id) || "";
      } else if (task.type === "divisi") {
        // Jobdesk divisi: tampilkan nama divisi, bukan string kosong
        const divName = task.division_id ? divisionsMap.get(task.division_id) : null;
        eventName = divName ? `Divisi ${divName}` : "Jobdesk Divisi";
      } else {
        eventName = "";
      }

      filteredTaskReferences.push({
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
        status: task.is_archived ? "archived" : "active",
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
      });
    }

    // 4. Combine and Sort
    const combined = [...normalizedManual, ...filteredTaskReferences];
    combined.sort((a, b) => {
      const yearA = typeof a.year === "number" ? a.year : parseInt(String(a.year || "0")) || 0;
      const yearB = typeof b.year === "number" ? b.year : parseInt(String(b.year || "0")) || 0;
      if (yearB !== yearA) {
        return yearB - yearA;
      }
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json({ references: combined });
  } catch (error) {
    console.error("[References API] Failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memproses referensi." },
      { status: 500 }
    );
  }
}
