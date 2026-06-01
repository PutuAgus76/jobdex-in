import "server-only";

import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import type { UserProfile } from "@/types";
import { findUserByName, findEventByName } from "./whatsapp-command-preview";

const MONTH_MAP: Record<string, string> = {
  januari: "01", jan: "01",
  februari: "02", feb: "02",
  maret: "03", mar: "03",
  april: "04", apr: "04",
  mei: "05",
  juni: "06", jun: "06",
  juli: "07", jul: "07",
  agustus: "08", agu: "08", ags: "08",
  september: "09", sep: "09",
  oktober: "10", okt: "10",
  november: "11", nov: "11",
  desember: "12", des: "12",
};

/**
 * Parses Indonesian / Standard Date string into standard JS Date object safely
 */
export function parseIndonesianDate(dateStr: string): Date {
  const cleanStr = dateStr.toLowerCase().replace(/,/g, "").trim();

  // 1. Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return new Date(`${cleanStr}T00:00:00`);
  }

  // 2. Try split parts like "3 Juni 2026" or "03/06/2026"
  const parts = cleanStr.split(/[\s/\-]+/);
  if (parts.length === 3) {
    let dayStr = "";
    let monthStr = "";
    let yearStr = "";

    if (parts[0].length === 4) {
      yearStr = parts[0];
      monthStr = parts[1];
      dayStr = parts[2];
    } else {
      dayStr = parts[0];
      monthStr = parts[1];
      yearStr = parts[2];
    }

    let monthNum = MONTH_MAP[monthStr] || monthStr;
    if (monthNum.length === 1) monthNum = "0" + monthNum;
    if (dayStr.length === 1) dayStr = "0" + dayStr;

    if (/^\d{4}$/.test(yearStr) && /^\d{2}$/.test(monthNum) && /^\d{2}$/.test(dayStr)) {
      const d = new Date(`${yearStr}-${monthNum}-${dayStr}T00:00:00`);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 3. Fallback to standard JS parsing
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // 4. Default to current date
  return new Date();
}

/**
 * Validates command PIN and returns the associated active user profile
 */
export async function validateCommandPin(pinCode: string): Promise<UserProfile | null> {
  const cleanPin = String(pinCode || "").trim();
  if (!cleanPin || cleanPin.length < 4) {
    return null;
  }

  const db = getAdminDb();
  const snapshot = await db
    .collection("users")
    .where("whatsapp_command_pin", "==", cleanPin)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  const user = { id: userDoc.id, ...userDoc.data() } as UserProfile;

  if (!user.is_active) {
    return null;
  }

  return user;
}

/**
 * Sanitizes any PIN text patterns from log messages to prevent security leakage
 */
export function sanitizePinFromMessage(text: string): string {
  if (!text) return "";
  return text.replace(/(pin:\s*)(\d+)/gi, "$1[STRIPPED]");
}

/**
 * Cancels a pending command preview safely
 */
export async function cancelPreviewCommand(
  code: string,
  pin: string
): Promise<{ success: boolean; replyText: string }> {
  const db = getAdminDb();
  const cleanCode = String(code || "").trim().toUpperCase();

  if (!cleanCode || !pin) {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nFormat pembatalan salah. Gunakan:\n!jobdex batal <PREVIEW_ID> pin: <PIN_AKUN>`,
    };
  }

  const previewQuery = await db
    .collection("ai_command_previews")
    .where("confirmation_code", "==", cleanCode)
    .limit(1)
    .get();

  if (previewQuery.empty) {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nPreview ID "${cleanCode}" tidak ditemukan.`,
    };
  }

  const previewDoc = previewQuery.docs[0];
  const previewData = previewDoc.data();

  if (previewData.status !== "pending") {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nPreview ID "${cleanCode}" sudah tidak berstatus pending (Status saat ini: ${previewData.status}).`,
    };
  }

  // Validate user PIN
  const user = await validateCommandPin(pin);
  if (!user) {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nPIN salah atau akun Anda dinonaktifkan. Otorisasi pembatalan ditolak.`,
    };
  }

  // Perform cancellation
  await previewDoc.ref.update({
    status: "cancelled",
    confirmed_by: user.id,
    confirmed_by_name: user.name,
    confirmed_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    replyText: `[JobDex.in AI]\n\n✅ Rencana tindakan "${previewData.parsed_intent || "tambah data"}" (ID: ${cleanCode}) berhasil dibatalkan oleh ${user.name}.`,
  };
}

/**
 * Confirms and executes a pending command preview safely, writing to Firestore
 */
export async function confirmPreviewCommand(
  code: string,
  pin: string
): Promise<{ success: boolean; replyText: string }> {
  const db = getAdminDb();
  const cleanCode = String(code || "").trim().toUpperCase();

  if (!cleanCode || !pin) {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nFormat konfirmasi salah. Gunakan:\n!jobdex konfirmasi <PREVIEW_ID> pin: <PIN_AKUN>`,
    };
  }

  const previewQuery = await db
    .collection("ai_command_previews")
    .where("confirmation_code", "==", cleanCode)
    .limit(1)
    .get();

  if (previewQuery.empty) {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nPreview ID "${cleanCode}" tidak ditemukan.`,
    };
  }

  const previewDoc = previewQuery.docs[0];
  const previewData = previewDoc.data();

  if (previewData.status !== "pending") {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nPreview ID "${cleanCode}" sudah tidak pending (Status saat ini: ${previewData.status}).`,
    };
  }

  // Check expiration
  if (previewData.expires_at) {
    const expiresAt = (previewData.expires_at as { toDate?: () => Date })?.toDate?.() || new Date(previewData.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      await previewDoc.ref.update({ status: "expired" });
      return {
        success: false,
        replyText: `[JobDex.in AI]\n\nPreview ID "${cleanCode}" sudah kedaluwarsa (Batas waktu 30 menit). Silakan kirim command baru untuk mendapatkan Preview ID baru.`,
      };
    }
  }

  // Validate user PIN and check active status
  const user = await validateCommandPin(pin);
  if (!user) {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nPIN salah atau akun Anda dinonaktifkan. Otorisasi eksekusi ditolak.`,
    };
  }

  // Fetch users and events for lookup in database
  const usersSnapshot = await db.collection("users").get();
  const allUsers = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<UserProfile, "id">),
  })) as UserProfile[];

  const eventsSnapshot = await db.collection("events").get();
  const allEvents = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: (doc.data().name as string) || "Acara Tanpa Nama",
    coordinator_id: (doc.data().coordinator_id as string) || "",
  }));

  const intent = previewData.parsed_intent;
  const fields = previewData.parsed_fields || {};
  const items = previewData.parsed_items || [];

  // Check Role Permissions
  if (user.role === "anggota") {
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\nOtorisasi ditolak. Anggota biasa tidak diperbolehkan membuat job desk atau acara baru.`,
    };
  }

  try {
    switch (intent) {
      case "create_task_preview": {
        const tipe = String(fields.tipe || "Divisi").toLowerCase();
        const judul = fields.judul || "";
        const picRaw = fields.pic || "";
        const deadlineRaw = fields.deadline || "";
        const prioritas = fields.prioritas || "sedang";
        const deskripsi = fields.deskripsi || "-";
        const redaksi = fields.redaksi || "-";
        const referensi = fields.referensi || "-";
        const warna = fields.warna || "-";
        const arahanVisual = fields["arahan visual"] || fields.arahan_visual || "-";
        const acaraRaw = fields.acara || "";

        // Resolve PIC
        const picUser = findUserByName(picRaw, allUsers);
        if (!picUser) {
          return {
            success: false,
            replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: PIC "${picRaw}" tidak ditemukan dalam database JobDex.in.`,
          };
        }

        // Resolve Event
        const isAcara = tipe === "acara";
        let eventId = "";
        let resolvedEventName = "";

        if (isAcara) {
          if (!acaraRaw) {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Field 'acara' wajib disuplai jika tipe job desk adalah 'acara'.`,
            };
          }
          const event = findEventByName(acaraRaw, allEvents) as { id: string; name: string; coordinator_id: string } | null;
          if (!event) {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Acara "${acaraRaw}" tidak ditemukan. Harap buat acara terlebih dahulu.`,
            };
          }
          eventId = event.id;
          resolvedEventName = event.name;

          // Koordinator Acara check
          if (user.role === "koordinator_acara" && event.coordinator_id !== user.id) {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nOtorisasi ditolak: Anda hanya diperbolehkan membuat job desk untuk acara yang Anda koordinasikan sendiri.`,
            };
          }
        } else {
          // Koordinator Acara cannot create divisi task
          if (user.role === "koordinator_acara") {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nOtorisasi ditolak: Koordinator acara tidak diperbolehkan membuat job desk tipe divisi.`,
            };
          }
        }

        // Parse deadline
        const deadlineDate = parseIndonesianDate(deadlineRaw);

        // Execute task creation
        const taskRef = db.collection("tasks").doc();
        const batch = db.batch();

        batch.set(taskRef, {
          id: taskRef.id,
          organization_id: "main_org",
          type: isAcara ? "acara" : "divisi",
          division_id: isAcara ? "" : "humas_media_kreatif",
          event_id: eventId,
          name: judul,
          description: deskripsi,
          pic_id: picUser.id,
          coordinator_id: user.id,
          deadline: deadlineDate,
          status: "belum_dimulai",
          priority: prioritas.toLowerCase(),
          copywriting: redaksi,
          copywriting_docs_url: "",
          design_reference_url: referensi,
          drive_reference_url: "",
          color_palette: warna !== "-" ? warna.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          visual_direction: arahanVisual,
          revision_notes: "",
          stuck_notes: "",
          result_design_url: "",
          approval_status: "pending",
          is_archived: false,
          created_by: user.id,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        // Add initial status log
        const logRef = taskRef.collection("status_logs").doc();
        batch.set(logRef, {
          id: logRef.id,
          task_id: taskRef.id,
          from_status: "",
          to_status: "belum_dimulai",
          changed_by: user.id,
          note: "Job desk dibuat via WhatsApp.",
          created_at: FieldValue.serverTimestamp(),
        });

        // Update preview state
        batch.update(previewDoc.ref, {
          status: "confirmed",
          confirmed_by: user.id,
          confirmed_by_name: user.name,
          confirmed_at: FieldValue.serverTimestamp(),
          created_task_ids: [taskRef.id],
          updated_at: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        if (isAcara && eventId) {
          await recalculateEventProgressAdmin(eventId);
        }

        return {
          success: true,
          replyText: [
            `✅ Job desk berhasil dibuat.`,
            ``,
            `Judul: ${judul}`,
            `PIC: ${picUser.name}`,
            `Deadline: ${deadlineRaw}`,
            isAcara ? `Acara: ${resolvedEventName}` : null,
            `Dibuat oleh: ${user.name}`,
            `Status awal: Belum Dimulai`,
          ]
            .filter((line) => line !== null)
            .join("\n"),
        };
      }

      case "bulk_create_task_preview": {
        const globalTipe = String(fields.tipe || "Divisi").toLowerCase();
        const isAcara = globalTipe === "acara";
        const acaraRaw = fields.acara || "";

        let eventId = "";
        let resolvedEventName = "";

        if (isAcara) {
          if (!acaraRaw) {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Field 'acara' wajib disuplai untuk job desk tipe 'acara'.`,
            };
          }
          const event = findEventByName(acaraRaw, allEvents) as { id: string; name: string; coordinator_id: string } | null;
          if (!event) {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Acara "${acaraRaw}" tidak ditemukan. Harap buat acara terlebih dahulu.`,
            };
          }
          eventId = event.id;
          resolvedEventName = event.name;

          // Koordinator Acara check
          if (user.role === "koordinator_acara" && event.coordinator_id !== user.id) {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nOtorisasi ditolak: Anda hanya diperbolehkan membuat job desk bulk untuk acara yang Anda koordinasikan sendiri.`,
            };
          }
        } else {
          if (user.role === "koordinator_acara") {
            return {
              success: false,
              replyText: `[JobDex.in AI]\n\nOtorisasi ditolak: Koordinator acara tidak diperbolehkan membuat job desk tipe divisi.`,
            };
          }
        }

        if (items.length === 0) {
          return {
            success: false,
            replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Tidak ada baris job desk yang terbaca untuk dibuat secara bulk.`,
          };
        }

        // All-or-Nothing Validation
        const errors: string[] = [];
        const resolvedItems: Array<{
          judul: string;
          picUser: UserProfile;
          deadlineRaw: string;
          deadlineDate: Date;
          prioritas: string;
          deskripsi: string;
        }> = [];

        items.forEach((item: Record<string, string>, idx: number) => {
          const judul = item.judul || "";
          const picRaw = item.pic || "";
          const deadlineRaw = item.deadline || "";
          const prioritas = item.prioritas || "sedang";
          const deskripsi = item.deskripsi || "-";

          if (!judul) {
            errors.push(`- Baris ${idx + 1}: Judul tugas kosong.`);
            return;
          }

          const picUser = findUserByName(picRaw, allUsers);
          if (!picUser) {
            errors.push(`- Baris ${idx + 1}: PIC "${picRaw}" tidak ditemukan.`);
            return;
          }

          if (!deadlineRaw || deadlineRaw === "-" || deadlineRaw.toLowerCase() === "t/d") {
            errors.push(`- Baris ${idx + 1}: Deadline "${deadlineRaw}" tidak lengkap/tidak terbaca.`);
            return;
          }

          const deadlineDate = parseIndonesianDate(deadlineRaw);
          resolvedItems.push({
            judul,
            picUser,
            deadlineRaw,
            deadlineDate,
            prioritas,
            deskripsi,
          });
        });

        if (errors.length > 0) {
          return {
            success: false,
            replyText: `[JobDex.in AI]\n\n❌ Gagal membuat bulk job desk. Terdapat kesalahan validasi:\n\n${errors.join("\n")}\n\nEksekusi dibatalkan secara keseluruhan (All-or-Nothing).`,
          };
        }

        // Execute batch write
        const batch = db.batch();
        const createdTaskIds: string[] = [];

        for (const item of resolvedItems) {
          const taskRef = db.collection("tasks").doc();
          batch.set(taskRef, {
            id: taskRef.id,
            organization_id: "main_org",
            type: isAcara ? "acara" : "divisi",
            division_id: isAcara ? "" : "humas_media_kreatif",
            event_id: eventId,
            name: item.judul,
            description: item.deskripsi,
            pic_id: item.picUser.id,
            coordinator_id: user.id,
            deadline: item.deadlineDate,
            status: "belum_dimulai",
            priority: item.prioritas.toLowerCase(),
            copywriting: "-",
            copywriting_docs_url: "",
            design_reference_url: "-",
            drive_reference_url: "",
            color_palette: [],
            visual_direction: "-",
            revision_notes: "",
            stuck_notes: "",
            result_design_url: "",
            approval_status: "pending",
            is_archived: false,
            created_by: user.id,
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });

          // Initial status log
          const logRef = taskRef.collection("status_logs").doc();
          batch.set(logRef, {
            id: logRef.id,
            task_id: taskRef.id,
            from_status: "",
            to_status: "belum_dimulai",
            changed_by: user.id,
            note: "Job desk dibuat via WhatsApp (Bulk).",
            created_at: FieldValue.serverTimestamp(),
          });

          createdTaskIds.push(taskRef.id);
        }

        // Update preview state
        batch.update(previewDoc.ref, {
          status: "confirmed",
          confirmed_by: user.id,
          confirmed_by_name: user.name,
          confirmed_at: FieldValue.serverTimestamp(),
          created_task_ids: createdTaskIds,
          updated_at: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        if (isAcara && eventId) {
          await recalculateEventProgressAdmin(eventId);
        }

        return {
          success: true,
          replyText: `✅ ${items.length} Job desk berhasil dibuat sekaligus.\n\nTipe: ${globalTipe.charAt(0).toUpperCase() + globalTipe.slice(1)}\n${isAcara ? `Acara: ${resolvedEventName}\n` : ""}Dibuat oleh: ${user.name}`,
        };
      }

      case "create_event_preview": {
        const name = fields.nama || fields.name || "";
        const tanggal = fields.tanggal || fields.date || "";
        const koordinatorRaw = fields.koordinator || "";
        const deskripsi = fields.deskripsi || fields.description || "-";

        if (user.role === "koordinator_acara") {
          return {
            success: false,
            replyText: `[JobDex.in AI]\n\nOtorisasi ditolak: Koordinator acara tidak diperbolehkan membuat acara baru.`,
          };
        }

        // Resolve Koordinator
        const koorUser = findUserByName(koordinatorRaw, allUsers);
        if (!koorUser) {
          return {
            success: false,
            replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Koordinator "${koordinatorRaw}" tidak ditemukan.`,
          };
        }

        if (!tanggal || tanggal === "-") {
          return {
            success: false,
            replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Tanggal acara tidak valid.`,
          };
        }

        const eventDate = parseIndonesianDate(tanggal);

        // Execute event creation
        const eventRef = db.collection("events").doc();
        const batch = db.batch();

        batch.set(eventRef, {
          id: eventRef.id,
          organization_id: "main_org",
          name,
          description: deskripsi,
          event_date: eventDate,
          coordinator_id: koorUser.id,
          status: "persiapan",
          progress_percentage: 0,
          created_by: user.id,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        // Update preview state
        batch.update(previewDoc.ref, {
          status: "confirmed",
          confirmed_by: user.id,
          confirmed_by_name: user.name,
          confirmed_at: FieldValue.serverTimestamp(),
          created_event_id: eventRef.id,
          updated_at: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        return {
          success: true,
          replyText: [
            `✅ Acara baru berhasil dibuat.`,
            ``,
            `Nama Acara: ${name}`,
            `Tanggal: ${tanggal}`,
            `Koordinator: ${koorUser.name}`,
            `Dibuat oleh: ${user.name}`,
            `Status: Persiapan`,
          ].join("\n"),
        };
      }

      default: {
        return {
          success: false,
          replyText: `[JobDex.in AI]\n\nGagal mengeksekusi: Tipe preview "${intent}" belum didukung untuk eksekusi otomatis.`,
        };
      }
    }
  } catch (err) {
    console.error("Execution error:", err);
    return {
      success: false,
      replyText: `[JobDex.in AI]\n\n❌ Terjadi kesalahan internal saat menulis ke database: ${err instanceof Error ? err.message : "Kesalahan tidak diketahui"}`,
    };
  }
}

export function getTaskProgressWeightAdmin(status: string): number {
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

export async function recalculateEventProgressAdmin(eventId: string) {
  if (!eventId) return 0;
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("tasks")
      .where("event_id", "==", eventId)
      .where("is_archived", "==", false)
      .get();
      
    const tasks = snapshot.docs.map(doc => doc.data());
    
    if (tasks.length === 0) {
      await db.collection("events").doc(eventId).update({
        progress_percentage: 0,
        updated_at: FieldValue.serverTimestamp(),
      });
      return 0;
    }
    
    let totalWeight = 0;
    for (const task of tasks) {
      totalWeight += getTaskProgressWeightAdmin(task.status || "");
    }
    
    const progress = Math.round(totalWeight / tasks.length);
    await db.collection("events").doc(eventId).update({
      progress_percentage: progress,
      updated_at: FieldValue.serverTimestamp(),
    });
    
    return progress;
  } catch (error) {
    console.error("Gagal menghitung progress acara (Admin SDK):", error);
    return 0;
  }
}
