import "server-only";

import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import type { Task, UserProfile, TaskCandidate, TaskEditPreview } from "@/types";
import { getTaskDeadlineDiffDays, getRiskLevelFromTask, getRiskLabel } from "@/lib/task-risk";
import { parseIndonesianDate, validateCommandPin, sanitizePinFromMessage } from "./whatsapp-command-executor";

export { validateCommandPin, sanitizePinFromMessage };

/**
 * Validates permission of a user for a specific action on a task
 */
export function validateTaskPermission(
  user: UserProfile,
  task: Task,
  action: "approve" | "update_status" | "edit" | "archive" | "checklist"
): boolean {
  if (user.role === "super_admin") return true;

  if (user.role === "koordinator_divisi") {
    // division_id must match division_id or task must be coordinate by them
    return task.division_id === user.division_id || task.coordinator_id === user.id;
  }

  if (user.role === "koordinator_acara") {
    return task.type === "acara" && task.coordinator_id === user.id;
  }

  if (user.role === "anggota") {
    // PIC of the task can only update status or update checklist
    const isPic = task.pic_id === user.id;
    if (isPic) {
      return action === "update_status" || action === "checklist";
    }
  }

  return false;
}

/**
 * Programmatic Deadline and Task Risk queries
 */
export async function handleDeadlineQuery(queryType: string): Promise<string> {
  const db = getAdminDb();
  
  try {
    const tasksSnap = await db
      .collection("tasks")
      .where("is_archived", "==", false)
      .get();

    const usersSnap = await db.collection("users").get();
    const eventsSnap = await db.collection("events").get();
    const divisionsSnap = await db.collection("divisions").get();

    const usersMap = new Map<string, string>();
    usersSnap.forEach((d) => usersMap.set(d.id, d.data().name || "-"));

    const eventsMap = new Map<string, string>();
    eventsSnap.forEach((d) => eventsMap.set(d.id, d.data().name || "-"));

    const divisionsMap = new Map<string, string>();
    divisionsSnap.forEach((d) => divisionsMap.set(d.id, d.data().name || "-"));

    const activeTasks: Task[] = [];
    tasksSnap.forEach((doc) => {
      const data = doc.data() as Task;
      if (data.status !== "approved") {
        activeTasks.push({ ...data, id: doc.id });
      }
    });

    // Filter tasks based on queryType
    const filtered = activeTasks.filter((task) => {
      const diffDays = getTaskDeadlineDiffDays(task);
      const risk = getRiskLevelFromTask(task);

      switch (queryType) {
        case "dekat":
          return diffDays >= 0 && diffDays <= 5;
        case "h-7":
          return diffDays === 7;
        case "h-5":
          return diffDays === 5;
        case "h-3":
          return diffDays === 3;
        case "h-1":
          return diffDays === 1;
        case "hari_ini":
          return diffDays === 0;
        case "overdue":
          return diffDays < 0;
        case "belum_dimulai":
          return task.status === "belum_dimulai";
        case "stuck":
          return task.status === "stuck";
        case "butuh_bantuan":
          return task.status === "butuh_bantuan";
        case "menunggu_materi":
          return task.status === "menunggu_materi";
        case "menunggu_approval":
          return task.status === "menunggu_approval";
        case "berisiko":
          return risk === "yellow" || risk === "orange" || risk === "red";
        case "kritis":
          return risk === "red";
        case "prioritas_tinggi":
          return task.priority === "tinggi" || task.priority === "kritis";
        default:
          return false;
      }
    });

    if (filtered.length === 0) {
      return [
        "[JobDex.in Deadline]",
        "",
        "Tidak ada tugas berisiko untuk kategori ini."
      ].join("\n");
    }

    // Sort by severity (red first, orange, yellow, then none)
    const severityWeight = { red: 3, orange: 2, yellow: 1, none: 0 };
    filtered.sort((a, b) => {
      const riskA = getRiskLevelFromTask(a);
      const riskB = getRiskLevelFromTask(b);
      return severityWeight[riskB] - severityWeight[riskA];
    });

    const lines = [
      "[JobDex.in Deadline]",
      "",
      `Ditemukan ${filtered.length} tugas berisiko:`,
      ""
    ];

    filtered.forEach((task, index) => {
      const picName = usersMap.get(task.pic_id) || "Tidak ada";
      const divisionOrEvent =
        task.type === "acara" && task.event_id
          ? eventsMap.get(task.event_id)
          : task.division_id
          ? divisionsMap.get(task.division_id)
          : "-";

      const diffDays = getTaskDeadlineDiffDays(task);
      const risk = getRiskLevelFromTask(task);
      const riskLabel = getRiskLabel(risk);

      let deadlineStr = "-";
      if (task.deadline) {
        const d =
          task.deadline && typeof task.deadline === "object" && "toDate" in task.deadline
            ? (task.deadline as { toDate: () => Date }).toDate()
            : task.deadline instanceof Date
            ? task.deadline
            : new Date(task.deadline as string);
        deadlineStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      }

      let riskBadge = `${riskLabel}`;
      if (diffDays < 0) riskBadge += ` / Overdue`;
      else if (diffDays === 0) riskBadge += ` / Hari Ini`;
      else riskBadge += ` / H-${diffDays}`;

      lines.push(`${index + 1}. ${task.name}`);
      lines.push(`   PIC: ${picName}`);
      lines.push(`   Deadline: ${deadlineStr}`);
      lines.push(`   Acara/Divisi: ${divisionOrEvent || "-"}`);
      lines.push(`   Status: ${getFormattedStatus(task.status)}`);
      lines.push(`   Prioritas: ${getFormattedPriority(task.priority)}`);
      lines.push(`   Risk: ${riskBadge}`);
      lines.push("");
    });

    return lines.join("\n").trim();
  } catch (error) {
    console.error("[Deadline Query] Failed:", error);
    return "[JobDex.in Deadline]\n\nGagal memproses pencarian deadline.";
  }
}

/**
 * Code generator for uniquely identifying ambiguous candidate tasks
 */
function generateCandidateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "TSK";
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Searches for a task or handles candidate lookup if code matches
 */
export async function findTaskCandidates(
  taskNameOrCode: string,
  isCode: boolean,
  commandType: "approve" | "update_status" | "edit" | "archive" | "checklist",
  userId: string,
  extraPayload?: Record<string, unknown> | null
): Promise<{ tasks: Task[]; candidateMessage?: string }> {
  const db = getAdminDb();

  if (isCode) {
    const code = taskNameOrCode.toUpperCase().trim();
    const candidateSnap = await db
      .collection("whatsapp_task_candidates")
      .where("code", "==", code)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (candidateSnap.empty) {
      return { tasks: [] };
    }

    const candidateDoc = candidateSnap.docs[0];
    const candidateData = candidateDoc.data() as TaskCandidate;

    // Check expiration (15 minutes)
    const expiresAt =
      candidateData.expires_at && typeof candidateData.expires_at === "object" && "toDate" in candidateData.expires_at
        ? (candidateData.expires_at as { toDate: () => Date }).toDate()
        : new Date(candidateData.expires_at as string);

    if (expiresAt.getTime() < Date.now()) {
      await candidateDoc.ref.update({ status: "expired" });
      return { tasks: [] };
    }

    // Mark as used
    await candidateDoc.ref.update({ status: "used" });

    const taskDoc = await db.collection("tasks").doc(candidateData.task_id).get();
    if (!taskDoc.exists) {
      return { tasks: [] };
    }

    return { tasks: [{ ...taskDoc.data(), id: taskDoc.id } as Task] };
  }

  // Else, query by fuzzy task name (case-insensitive substring)
  const tasksSnap = await db
    .collection("tasks")
    .where("is_archived", "==", false)
    .get();

  const queryClean = taskNameOrCode.toLowerCase().trim();
  const matched: Task[] = [];

  tasksSnap.forEach((doc) => {
    const data = doc.data() as Task;
    if (data.name.toLowerCase().includes(queryClean)) {
      matched.push({ ...data, id: doc.id });
    }
  });

  if (matched.length === 0) {
    return { tasks: [] };
  }

  if (matched.length === 1) {
    return { tasks: matched };
  }

  // Ambiguous: matched.length > 1
  // Create candidate codes for each match
  const lines = [
    "[JobDex.in Task]",
    "",
    "Ditemukan beberapa task mirip:",
    ""
  ];

  const batch = db.batch();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  for (let i = 0; i < matched.length; i++) {
    const task = matched[i];
    const code = generateCandidateCode() + i; // Append index to avoid exact same random code clash

    const candidateRef = db.collection("whatsapp_task_candidates").doc();
    batch.set(candidateRef, {
      id: candidateRef.id,
      code,
      task_id: task.id,
      task_title: task.name,
      command_type: commandType,
      created_at: FieldValue.serverTimestamp(),
      expires_at: expiresAt,
      status: "pending",
      requested_by_user_id: userId,
      payload: extraPayload || null
    });

    lines.push(`${i + 1}. ${task.name}`);
    lines.push(`   Kode: ${code}`);
    lines.push("");
  }

  await batch.commit();

  // Print helpful guidance instructions
  lines.push("Gunakan:");
  if (commandType === "approve") {
    lines.push(`!jobdex approve kode [KODE] pin: [PIN]`);
  } else if (commandType === "update_status") {
    const statusLabel = extraPayload?.statusText || "sedang dikerjakan";
    const notesStr = extraPayload?.notes ? ` catatan: ${extraPayload.notes}` : "";
    lines.push(`!jobdex update status kode [KODE] menjadi ${statusLabel}${notesStr} pin: [PIN]`);
  } else if (commandType === "edit") {
    lines.push(`!jobdex edit kode [KODE]\n[parameter]\npin: [PIN]`);
  } else if (commandType === "archive") {
    lines.push(`!jobdex archive kode [KODE] pin: [PIN]`);
  } else if (commandType === "checklist") {
    const itemLabel = extraPayload?.item || "redaksi";
    lines.push(`!jobdex checklist kode [KODE] ${itemLabel} selesai pin: [PIN]`);
  }

  return {
    tasks: matched,
    candidateMessage: lines.join("\n").trim()
  };
}

/**
 * Approve task via WhatsApp with PIN
 */
export async function handleApproveTaskCommand(
  taskNameOrCode: string,
  pin: string,
  user: UserProfile,
  isCode: boolean
): Promise<{ success: boolean; replyText: string }> {
  try {
    const { tasks, candidateMessage } = await findTaskCandidates(
      taskNameOrCode,
      isCode,
      "approve",
      user.id
    );

    if (candidateMessage) {
      return { success: true, replyText: candidateMessage };
    }

    if (tasks.length === 0) {
      return { success: false, replyText: "[JobDex.in Approval]\n\n❌ Tugas tidak ditemukan atau kode kandidat kadaluwarsa." };
    }

    const task = tasks[0];

    // Validate permission
    const allowed = validateTaskPermission(user, task, "approve");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Approval]\n\n❌ Hak akses ditolak. Peran Anda (${user.role}) tidak berwenang menyetujui tugas ini.` };
    }

    const db = getAdminDb();
    
    // Update task
    await db.collection("tasks").doc(task.id).update({
      status: "approved",
      approval_status: "approved",
      approved_by: user.id,
      approved_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

    // Create status log
    const logRef = db.collection("tasks").doc(task.id).collection("status_logs").doc();
    await logRef.set({
      id: logRef.id,
      task_id: task.id,
      from_status: task.status,
      to_status: "approved",
      changed_by: user.id,
      note: "Approved via WhatsApp command",
      created_at: FieldValue.serverTimestamp()
    });

    const timeStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Approval]",
        "",
        "✅ Task berhasil di-approve.",
        "",
        `Tugas: ${task.name}`,
        `PIC: ${task.pic_id ? (await getUsernameById(task.pic_id)) : "-"}`,
        `Approved oleh: ${user.name}`,
        `Waktu: ${timeStr} WITA`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Approve Command] Error:", error);
    return { success: false, replyText: "[JobDex.in Approval]\n\nGagal memproses persetujuan tugas." };
  }
}

/**
 * Update task status via WhatsApp with PIN and Catatan
 */
export async function handleUpdateTaskStatusCommand(
  taskNameOrCode: string,
  pin: string,
  user: UserProfile,
  isCode: boolean,
  statusText: string,
  notes: string
): Promise<{ success: boolean; replyText: string }> {
  try {
    const statusEnum = normalizeStatusFromText(statusText);
    if (!statusEnum) {
      return { success: false, replyText: `[JobDex.in Status]\n\n❌ Format status tidak dikenali. Pilih salah satu status standar.` };
    }

    // Stuck, butuh bantuan, waiting material requires notes!
    if ((statusEnum === "stuck" || statusEnum === "butuh_bantuan" || statusEnum === "menunggu_materi") && !notes.trim()) {
      return {
        success: false,
        replyText: `[JobDex.in Status]\n\n❌ Catatan wajib diisi untuk status "stuck", "butuh bantuan", atau "menunggu materi".`
      };
    }

    const { tasks, candidateMessage } = await findTaskCandidates(
      taskNameOrCode,
      isCode,
      "update_status",
      user.id,
      { statusText, notes }
    );

    if (candidateMessage) {
      return { success: true, replyText: candidateMessage };
    }

    if (tasks.length === 0) {
      return { success: false, replyText: "[JobDex.in Status]\n\n❌ Tugas tidak ditemukan atau kode kandidat kadaluwarsa." };
    }

    const task = tasks[0];

    // Validate permission
    const allowed = validateTaskPermission(user, task, "update_status");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Status]\n\n❌ Hak akses ditolak. Peran Anda (${user.role}) tidak berwenang memperbarui status tugas ini.` };
    }

    const db = getAdminDb();

    // Prepare update parameters
    const updateParams: Record<string, unknown> = {
      status: statusEnum,
      updated_at: FieldValue.serverTimestamp()
    };

    if (statusEnum === "stuck") {
      updateParams.stuck_notes = notes;
    } else if (statusEnum === "butuh_bantuan" || statusEnum === "menunggu_materi") {
      updateParams.stuck_notes = notes; // save to general stuck notes
    }

    // Update task
    await db.collection("tasks").doc(task.id).update(updateParams);

    // Create status log
    const logNote = notes ? `Update status via WhatsApp: ${notes}` : "Update status via WhatsApp command";
    const logRef = db.collection("tasks").doc(task.id).collection("status_logs").doc();
    await logRef.set({
      id: logRef.id,
      task_id: task.id,
      from_status: task.status,
      to_status: statusEnum,
      changed_by: user.id,
      note: logNote,
      created_at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Status]",
        "",
        "✅ Status task berhasil diperbarui.",
        "",
        `Tugas: ${task.name}`,
        `Status baru: ${getFormattedStatus(statusEnum)}`,
        ...(notes ? [`Catatan: ${notes}`] : []),
        `Diperbarui oleh: ${user.name}`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Update Status] Error:", error);
    return { success: false, replyText: "[JobDex.in Status]\n\nGagal memperbarui status tugas." };
  }
}

/**
 * Edit detail task command (generates EDT preview)
 */
export async function handleEditTaskCommand(
  taskNameOrCode: string,
  pin: string,
  user: UserProfile,
  isCode: boolean,
  parsedFields: Record<string, string>
): Promise<{ success: boolean; replyText: string }> {
  try {
    const { tasks, candidateMessage } = await findTaskCandidates(
      taskNameOrCode,
      isCode,
      "edit",
      user.id,
      parsedFields
    );

    if (candidateMessage) {
      return { success: true, replyText: candidateMessage };
    }

    if (tasks.length === 0) {
      return { success: false, replyText: "[JobDex.in Edit Task]\n\n❌ Tugas tidak ditemukan atau kode kandidat kadaluwarsa." };
    }

    const task = tasks[0];

    // Validate permission (PIC/Anggota is restricted from editing main fields!)
    const allowed = validateTaskPermission(user, task, "edit");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Edit Task]\n\n❌ Hak akses ditolak. Peran Anda (${user.role}) tidak berwenang mengedit detail utama tugas ini.` };
    }

    const db = getAdminDb();
    
    // Resolve fields and changes
    const changes: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const comparisons: string[] = [];

    // 1. pic
    if (parsedFields.pic) {
      const picUser = await findUserByName(parsedFields.pic);
      if (!picUser) {
        return { success: false, replyText: `[JobDex.in Edit Task]\n\n❌ Anggota PIC "${parsedFields.pic}" tidak ditemukan.` };
      }
      if (task.pic_id !== picUser.id) {
        changes.pic_id = picUser.id;
        oldValues.pic_id = task.pic_id;
        const oldPicName = task.pic_id ? (await getUsernameById(task.pic_id)) : "-";
        comparisons.push(`- PIC: ${oldPicName} → ${picUser.name}`);
      }
    }

    // 2. deadline
    if (parsedFields.deadline) {
      const deadlineDate = parseIndonesianDate(parsedFields.deadline);
      const oldDeadlineDate =
        task.deadline && typeof task.deadline === "object" && "toDate" in task.deadline
          ? (task.deadline as { toDate: () => Date }).toDate()
          : task.deadline instanceof Date
          ? task.deadline
          : task.deadline ? new Date(task.deadline as string) : null;

      const formattedNew = deadlineDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      const formattedOld = oldDeadlineDate
        ? oldDeadlineDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        : "-";

      if (!oldDeadlineDate || Math.abs(deadlineDate.getTime() - oldDeadlineDate.getTime()) > 1000 * 60 * 60) {
        changes.deadline = deadlineDate;
        oldValues.deadline = task.deadline || null;
        comparisons.push(`- Deadline: ${formattedOld} → ${formattedNew}`);
      }
    }

    // 3. priority / prioritas
    const prioInput = parsedFields.prioritas || parsedFields.priority;
    if (prioInput) {
      const cleanPrio = normalizePriority(prioInput);
      if (!cleanPrio) {
        return { success: false, replyText: `[JobDex.in Edit Task]\n\n❌ Prioritas tidak valid (Rendah, Sedang, Tinggi, Kritis).` };
      }
      if (task.priority !== cleanPrio) {
        changes.priority = cleanPrio;
        oldValues.priority = task.priority;
        comparisons.push(`- Prioritas: ${getFormattedPriority(task.priority)} → ${getFormattedPriority(cleanPrio)}`);
      }
    }

    // 4. name / judul
    const nameInput = parsedFields.judul || parsedFields.name;
    if (nameInput && nameInput.trim()) {
      const cleanName = nameInput.trim();
      if (task.name !== cleanName) {
        changes.name = cleanName;
        oldValues.name = task.name;
        comparisons.push(`- Judul: ${task.name} → ${cleanName}`);
      }
    }

    // 5. description / deskripsi
    const descInput = parsedFields.deskripsi || parsedFields.description;
    if (descInput !== undefined) {
      const cleanDesc = descInput.trim();
      if (task.description !== cleanDesc) {
        changes.description = cleanDesc;
        oldValues.description = task.description;
        comparisons.push(`- Deskripsi: ${task.description || "-"} → ${cleanDesc || "-"}`);
      }
    }

    // 6. copywriting / redaksi
    const copyInput = parsedFields.redaksi || parsedFields.copywriting;
    if (copyInput !== undefined) {
      const cleanCopy = copyInput.trim();
      if (task.copywriting !== cleanCopy) {
        changes.copywriting = cleanCopy;
        oldValues.copywriting = task.copywriting;
        comparisons.push(`- Redaksi: ${task.copywriting ? "Lama" : "Kosong"} → ${cleanCopy ? "Baru" : "Kosong"}`);
      }
    }

    // 7. design_reference_url / referensi
    const refInput = parsedFields.referensi || parsedFields.design_reference_url;
    if (refInput !== undefined) {
      const cleanRef = refInput.trim();
      if (task.design_reference_url !== cleanRef) {
        changes.design_reference_url = cleanRef;
        oldValues.design_reference_url = task.design_reference_url;
        comparisons.push(`- Referensi: ${task.design_reference_url ? "Lama" : "Kosong"} → ${cleanRef ? "Baru" : "Kosong"}`);
      }
    }

    // 8. color_palette / warna
    const colorInput = parsedFields.warna || parsedFields.color_palette;
    if (colorInput !== undefined) {
      const cleanColors = colorInput.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean);
      const isDifferent =
        !task.color_palette ||
        task.color_palette.length !== cleanColors.length ||
        cleanColors.some((c) => !task.color_palette.includes(c));

      if (isDifferent) {
        changes.color_palette = cleanColors;
        oldValues.color_palette = task.color_palette || [];
        comparisons.push(`- Warna: ${task.color_palette ? task.color_palette.join(", ") : "-"} → ${cleanColors.join(", ")}`);
      }
    }

    // 9. visual_direction / arahan visual
    const visualInput = parsedFields.arahan_visual || parsedFields.visual_direction;
    if (visualInput !== undefined) {
      const cleanVisual = visualInput.trim();
      if (task.visual_direction !== cleanVisual) {
        changes.visual_direction = cleanVisual;
        oldValues.visual_direction = task.visual_direction;
        comparisons.push(`- Arahan Visual: ${task.visual_direction || "-"} → ${cleanVisual || "-"}`);
      }
    }

    if (Object.keys(changes).length === 0) {
      return { success: true, replyText: `[JobDex.in Edit Task]\n\nTidak ada perubahan detail yang terdeteksi.` };
    }

    // Generate EDT preview
    const edtCode = "EDT" + generateRandomCode(3);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    const previewRef = db.collection("whatsapp_task_edit_previews").doc();
    await previewRef.set({
      id: previewRef.id,
      code: edtCode,
      task_id: task.id,
      task_title: task.name,
      action_type: "edit_task",
      changes,
      old_values: oldValues,
      requested_by: user.id,
      requested_by_name: user.name,
      created_at: FieldValue.serverTimestamp(),
      expires_at: expiresAt,
      status: "pending",
      raw_message_sanitized: sanitizePinFromMessage(parsedFields.rawText || "")
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Preview Edit Task]",
        "",
        "Saya menemukan task:",
        task.name,
        "",
        "Perubahan yang akan diterapkan:",
        ...comparisons,
        "",
        `Kode Edit: ${edtCode}`,
        "",
        "Untuk menyimpan perubahan, balas:",
        `!jobdex konfirmasi edit ${edtCode} pin: [PIN]`,
        "",
        "Untuk membatalkan:",
        `!jobdex batal edit ${edtCode} pin: [PIN]`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Edit Task Command] Error:", error);
    return { success: false, replyText: "[JobDex.in Edit Task]\n\nGagal memproses draf perubahan detail tugas." };
  }
}

/**
 * Confirm edit preview task (saves changes to Firestore)
 */
export async function handleConfirmEditTaskCommand(
  code: string,
  pin: string,
  user: UserProfile
): Promise<{ success: boolean; replyText: string }> {
  try {
    const db = getAdminDb();
    const previewSnap = await db
      .collection("whatsapp_task_edit_previews")
      .where("code", "==", code)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (previewSnap.empty) {
      return { success: false, replyText: "[JobDex.in Confirm Edit]\n\n❌ Kode edit tidak ditemukan atau sudah diproses." };
    }

    const previewDoc = previewSnap.docs[0];
    const previewData = previewDoc.data() as TaskEditPreview;

    const expiresAt =
      previewData.expires_at && typeof previewData.expires_at === "object" && "toDate" in previewData.expires_at
        ? (previewData.expires_at as { toDate: () => Date }).toDate()
        : new Date(previewData.expires_at as string);

    if (expiresAt.getTime() < Date.now()) {
      await previewDoc.ref.update({ status: "expired" });
      return { success: false, replyText: "[JobDex.in Confirm Edit]\n\n❌ Kode edit telah kadaluwarsa (batas 30 menit)." };
    }

    const taskDoc = await db.collection("tasks").doc(previewData.task_id).get();
    if (!taskDoc.exists) {
      return { success: false, replyText: "[JobDex.in Confirm Edit]\n\n❌ Tugas asli tidak ditemukan di database." };
    }

    const task = { ...taskDoc.data(), id: taskDoc.id } as Task;

    // Permissions check
    const allowed = validateTaskPermission(user, task, "edit");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Confirm Edit]\n\n❌ Otorisasi gagal. Anda tidak memiliki akses mengedit tugas ini.` };
    }

    // Apply changes
    const updates = { ...previewData.changes };
    updates.updated_at = FieldValue.serverTimestamp();

    await taskDoc.ref.update(updates);
    await previewDoc.ref.update({ status: "confirmed" });

    // Append status log
    const changedFields = Object.keys(previewData.changes).join(", ");
    const logRef = taskDoc.ref.collection("status_logs").doc();
    await logRef.set({
      id: logRef.id,
      task_id: task.id,
      from_status: task.status,
      to_status: task.status,
      changed_by: user.id,
      note: `Detail task diubah via WhatsApp (${changedFields})`,
      created_at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Confirm Edit]",
        "",
        "✅ Perubahan tugas berhasil disimpan.",
        "",
        `Tugas: ${task.name}`,
        `Disimpan oleh: ${user.name}`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Confirm Edit] Error:", error);
    return { success: false, replyText: "[JobDex.in Confirm Edit]\n\nGagal menyelesaikan konfirmasi perubahan tugas." };
  }
}

/**
 * Cancel edit preview task
 */
export async function handleCancelEditTaskCommand(
  code: string,
  pin: string,
  user: UserProfile
): Promise<{ success: boolean; replyText: string }> {
  try {
    const db = getAdminDb();
    console.log(`[Cancel Edit] Code ${code} cancelled by user ${user.id} (pin verified: ${!!pin})`);
    const previewSnap = await db
      .collection("whatsapp_task_edit_previews")
      .where("code", "==", code)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (previewSnap.empty) {
      return { success: false, replyText: "[JobDex.in Cancel Edit]\n\n❌ Kode edit tidak ditemukan atau sudah diproses." };
    }

    const previewDoc = previewSnap.docs[0];
    await previewDoc.ref.update({ status: "cancelled" });

    return {
      success: true,
      replyText: `[JobDex.in Cancel Edit]\n\n✅ Draf perubahan detail tugas (${code}) berhasil dibatalkan.`
    };
  } catch (error) {
    console.error("[Cancel Edit] Error:", error);
    return { success: false, replyText: "[JobDex.in Cancel Edit]\n\nGagal membatalkan draf perubahan tugas." };
  }
}

/**
 * Archive task command (generates ARC preview)
 */
export async function handleArchiveTaskCommand(
  taskNameOrCode: string,
  pin: string,
  user: UserProfile,
  isCode: boolean
): Promise<{ success: boolean; replyText: string }> {
  try {
    const { tasks, candidateMessage } = await findTaskCandidates(
      taskNameOrCode,
      isCode,
      "archive",
      user.id
    );

    if (candidateMessage) {
      return { success: true, replyText: candidateMessage };
    }

    if (tasks.length === 0) {
      return { success: false, replyText: "[JobDex.in Archive]\n\n❌ Tugas tidak ditemukan atau kode kandidat kadaluwarsa." };
    }

    const task = tasks[0];

    // Validate permission
    const allowed = validateTaskPermission(user, task, "archive");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Archive]\n\n❌ Hak akses ditolak. Peran Anda (${user.role}) tidak berwenang mengarsipkan tugas ini.` };
    }

    const db = getAdminDb();
    
    // Create ARC preview
    const arcCode = "ARC" + generateRandomCode(3);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    const previewRef = db.collection("whatsapp_task_edit_previews").doc();
    await previewRef.set({
      id: previewRef.id,
      code: arcCode,
      task_id: task.id,
      task_title: task.name,
      action_type: "archive_task",
      changes: { is_archived: true },
      old_values: { is_archived: false },
      requested_by: user.id,
      requested_by_name: user.name,
      created_at: FieldValue.serverTimestamp(),
      expires_at: expiresAt,
      status: "pending",
      raw_message_sanitized: `archive task: ${task.name}`
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Preview Archive]",
        "",
        "Task ini akan diarsipkan:",
        task.name,
        "",
        `Kode: ${arcCode}`,
        "",
        "Konfirmasi:",
        `!jobdex konfirmasi archive ${arcCode} pin: [PIN]`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Archive Command] Error:", error);
    return { success: false, replyText: "[JobDex.in Archive]\n\nGagal memproses draf pengarsipan tugas." };
  }
}

/**
 * Confirm archive task
 */
export async function handleConfirmArchiveCommand(
  code: string,
  pin: string,
  user: UserProfile
): Promise<{ success: boolean; replyText: string }> {
  try {
    const db = getAdminDb();
    const previewSnap = await db
      .collection("whatsapp_task_edit_previews")
      .where("code", "==", code)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (previewSnap.empty) {
      return { success: false, replyText: "[JobDex.in Confirm Archive]\n\n❌ Kode archive tidak ditemukan atau sudah diproses." };
    }

    const previewDoc = previewSnap.docs[0];
    const previewData = previewDoc.data() as TaskEditPreview;

    const expiresAt =
      previewData.expires_at && typeof previewData.expires_at === "object" && "toDate" in previewData.expires_at
        ? (previewData.expires_at as { toDate: () => Date }).toDate()
        : new Date(previewData.expires_at as string);

    if (expiresAt.getTime() < Date.now()) {
      await previewDoc.ref.update({ status: "expired" });
      return { success: false, replyText: "[JobDex.in Confirm Archive]\n\n❌ Kode archive telah kadaluwarsa (30 menit)." };
    }

    const taskDoc = await db.collection("tasks").doc(previewData.task_id).get();
    if (!taskDoc.exists) {
      return { success: false, replyText: "[JobDex.in Confirm Archive]\n\n❌ Tugas asli tidak ditemukan di database." };
    }

    const task = { ...taskDoc.data(), id: taskDoc.id } as Task;

    // Permissions check
    const allowed = validateTaskPermission(user, task, "archive");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Confirm Archive]\n\n❌ Otorisasi gagal. Anda tidak memiliki akses mengarsipkan tugas ini.` };
    }

    // Apply archive
    await taskDoc.ref.update({
      is_archived: true,
      updated_at: FieldValue.serverTimestamp()
    });

    await previewDoc.ref.update({ status: "confirmed" });

    // Append status log
    const logRef = taskDoc.ref.collection("status_logs").doc();
    await logRef.set({
      id: logRef.id,
      task_id: task.id,
      from_status: task.status,
      to_status: task.status,
      changed_by: user.id,
      note: "Archived via WhatsApp command",
      created_at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Confirm Archive]",
        "",
        "✅ Tugas berhasil diarsipkan.",
        "",
        `Tugas: ${task.name}`,
        `Diarsipkan oleh: ${user.name}`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Confirm Archive] Error:", error);
    return { success: false, replyText: "[JobDex.in Confirm Archive]\n\nGagal menyelesaikan konfirmasi pengarsipan." };
  }
}

/**
 * Update checklist item status directly via WhatsApp with PIN
 */
export async function handleChecklistCommand(
  taskNameOrCode: string,
  pin: string,
  user: UserProfile,
  isCode: boolean,
  itemKeyword: string
): Promise<{ success: boolean; replyText: string }> {
  try {
    const checklistMap: Record<string, string> = {
      redaksi: "Redaksi/materi tersedia",
      referensi: "Referensi desain tersedia",
      draft: "Mulai desain/draft awal",
      revisi: "Revisi internal",
      final: "Finalisasi desain",
      upload: "Upload hasil ke JobDex.in / Drive"
    };

    const targetLabel = checklistMap[itemKeyword];
    if (!targetLabel) {
      return { success: false, replyText: `[JobDex.in Checklist]\n\n❌ Item checklist "${itemKeyword}" tidak valid. Pilih salah satu (redaksi, referensi, draft, revisi, final, upload).` };
    }

    const { tasks, candidateMessage } = await findTaskCandidates(
      taskNameOrCode,
      isCode,
      "checklist",
      user.id,
      { item: itemKeyword }
    );

    if (candidateMessage) {
      return { success: true, replyText: candidateMessage };
    }

    if (tasks.length === 0) {
      return { success: false, replyText: "[JobDex.in Checklist]\n\n❌ Tugas tidak ditemukan atau kode kandidat kadaluwarsa." };
    }

    const task = tasks[0];

    // Validate permission
    const allowed = validateTaskPermission(user, task, "checklist");
    if (!allowed) {
      return { success: false, replyText: `[JobDex.in Checklist]\n\n❌ Hak akses ditolak. Peran Anda (${user.role}) tidak berwenang mengedit checklist tugas ini.` };
    }

    const checklistItems = task.checklist_items || [];
    const itemExists = checklistItems.some((i) => i.label === targetLabel);

    let updatedChecklist = [];
    if (!itemExists) {
      // If item does not exist, build default or add it
      const defaultChecklist = [
        { id: "checklist_1", label: "Redaksi/materi tersedia", is_done: false },
        { id: "checklist_2", label: "Referensi desain tersedia", is_done: false },
        { id: "checklist_3", label: "Mulai desain/draft awal", is_done: false },
        { id: "checklist_4", label: "Revisi internal", is_done: false },
        { id: "checklist_5", label: "Finalisasi desain", is_done: false },
        { id: "checklist_6", label: "Upload hasil ke JobDex.in / Drive", is_done: false },
      ];

      updatedChecklist = defaultChecklist.map((item) => {
        if (item.label === targetLabel) {
          return {
            ...item,
            is_done: true,
            done_by: user.id,
            done_by_name: user.name,
            done_at: new Date()
          };
        }
        return item;
      });
    } else {
      updatedChecklist = checklistItems.map((item) => {
        if (item.label === targetLabel) {
          return {
            ...item,
            is_done: true,
            done_by: user.id,
            done_by_name: user.name,
            done_at: new Date()
          };
        }
        return item;
      });
    }

    const db = getAdminDb();

    // Update task
    await db.collection("tasks").doc(task.id).update({
      checklist_items: updatedChecklist,
      updated_at: FieldValue.serverTimestamp()
    });

    // Create status log
    const logRef = db.collection("tasks").doc(task.id).collection("status_logs").doc();
    await logRef.set({
      id: logRef.id,
      task_id: task.id,
      from_status: task.status,
      to_status: task.status,
      changed_by: user.id,
      note: `Checklist "${targetLabel}" ditandai selesai via WhatsApp.`,
      created_at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      replyText: [
        "[JobDex.in Checklist]",
        "",
        "✅ Item checklist berhasil ditandai selesai.",
        "",
        `Tugas: ${task.name}`,
        `Item: ${targetLabel}`,
        `PIC/Penuntas: ${user.name}`
      ].join("\n")
    };
  } catch (error) {
    console.error("[Checklist Command] Error:", error);
    return { success: false, replyText: "[JobDex.in Checklist]\n\nGagal menandai checklist tugas." };
  }
}

/**
 * Natural language mapping for TaskStatus
 */
function normalizeStatusFromText(text: string): import("@/types").TaskStatus | null {
  const clean = text.toLowerCase().replace(/[\s\-_]+/g, " ").trim();
  
  if (clean.includes("belum mulai") || clean.includes("belum dimulai")) return "belum_dimulai";
  if (clean.includes("sedang dikerjakan") || clean.includes("dikerjakan") || clean.includes("kerja")) return "sedang_dikerjakan";
  if (clean.includes("butuh bantuan") || clean.includes("bantuan")) return "butuh_bantuan";
  if (clean.includes("stuck") || clean.includes("macet")) return "stuck";
  if (clean.includes("menunggu materi") || clean.includes("materi")) return "menunggu_materi";
  if (clean.includes("draft selesai") || clean.includes("draft")) return "draft_selesai";
  if (clean.includes("perlu revisi") || clean.includes("revisi")) return "perlu_revisi";
  if (clean.includes("revisi dikerjakan")) return "revisi_dikerjakan";
  if (clean.includes("menunggu approval") || clean.includes("approval")) return "menunggu_approval";
  if (clean.includes("approved") || clean.includes("selesai") || clean.includes("acc")) return "approved";
  if (clean.includes("ditunda") || clean.includes("tunda")) return "ditunda";

  return null;
}

/**
 * Maps task priority string input to standard TaskPriority enum
 */
function normalizePriority(text: string): import("@/types").TaskPriority | null {
  const clean = text.toLowerCase().trim();
  if (clean === "rendah") return "rendah";
  if (clean === "sedang") return "sedang";
  if (clean === "tinggi") return "tinggi";
  if (clean === "kritis") return "kritis";
  return null;
}

/**
 * Helper to retrieve user's name from Firestore safely
 */
async function getUsernameById(userId: string): Promise<string> {
  try {
    const doc = await getAdminDb().collection("users").doc(userId).get();
    return doc.exists ? (doc.data()?.name || "-") : "-";
  } catch {
    return "-";
  }
}

/**
 * Format helpers
 */
function getFormattedPriority(priority: string): string {
  switch (priority) {
    case "rendah": return "Rendah";
    case "sedang": return "Sedang";
    case "tinggi": return "Tinggi";
    case "kritis": return "Kritis";
    default: return priority;
  }
}

function getFormattedStatus(status: string): string {
  switch (status) {
    case "belum_dimulai": return "Belum Dimulai";
    case "sedang_dikerjakan": return "Sedang Dikerjakan";
    case "butuh_bantuan": return "Butuh Bantuan";
    case "stuck": return "Stuck";
    case "menunggu_materi": return "Menunggu Materi";
    case "draft_selesai": return "Draft Selesai";
    case "perlu_revisi": return "Perlu Revisi";
    case "revisi_dikerjakan": return "Revisi Dikerjakan";
    case "menunggu_approval": return "Menunggu Approval";
    case "approved": return "Approved";
    case "ditunda": return "Ditunda";
    default: return status;
  }
}

function findUserByName(name: string): Promise<UserProfile | null> {
  return new Promise(async (resolve) => {
    try {
      const cleanName = name.toLowerCase().trim();
      const usersSnap = await getAdminDb().collection("users").get();
      let matched: UserProfile | null = null;
      usersSnap.forEach((doc) => {
        const u = doc.data() as UserProfile;
        if (u.name.toLowerCase().includes(cleanName)) {
          matched = { ...u, id: doc.id };
        }
      });
      resolve(matched);
    } catch {
      resolve(null);
    }
  });
}

function generateRandomCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
