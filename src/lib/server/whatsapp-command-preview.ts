import "server-only";

import { getAdminDb } from "@/lib/server/firebase-admin";
import type { ParsedWhatsAppCommand } from "./whatsapp-command-parser";
import type { UserProfile } from "@/types";

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "Belum Mulai",
  in_progress: "Sedang Dikerjakan",
  stuck: "Stuck/Kendala",
  in_review: "Menunggu Approval",
  done: "Selesai",
};

interface PreviewResult {
  isValid: boolean;
  previewText: string;
}

export function findUserByName(picName: string, allUsers: UserProfile[]): UserProfile | null {
  const normPic = picName.toLowerCase().trim();
  if (!normPic || normPic === "-") return null;
  
  // Try exact match first
  let found = allUsers.find((u) => u.name?.toLowerCase().trim() === normPic);
  if (found) return found;
  
  // Try partial match (picName is inside user's name)
  found = allUsers.find((u) => u.name?.toLowerCase().includes(normPic));
  if (found) return found;

  // Try partial match (user's name is inside picName)
  found = allUsers.find((u) => normPic.includes(u.name?.toLowerCase() || ""));
  return found || null;
}

export function findEventByName(eventName: string, allEvents: Array<{ id: string; name: string }>) {
  const normEvent = eventName.toLowerCase().trim();
  if (!normEvent) return null;
  
  let found = allEvents.find((e) => e.name?.toLowerCase().trim() === normEvent);
  if (found) return found;
  
  found = allEvents.find((e) => e.name?.toLowerCase().includes(normEvent));
  if (found) return found;

  found = allEvents.find((e) => normEvent.includes(e.name?.toLowerCase() || ""));
  return found || null;
}

function findTasksByTitle(
  query: string,
  allTasks: Array<{ id: string; name: string; pic_id: string; status: string; approval_status: string }>
) {
  const normQuery = query.toLowerCase().trim();
  if (!normQuery) return [];
  
  return allTasks.filter((t) => t.name?.toLowerCase().includes(normQuery));
}

export async function buildWhatsAppCommandPreview(
  parsed: ParsedWhatsAppCommand,
  senderProfile: UserProfile | null
): Promise<PreviewResult> {
  const db = getAdminDb();

  // Load registered users for name resolution
  const usersSnapshot = await db.collection("users").get();
  const users = usersSnapshot.docs.map((doc) => {
    const data = doc.data() as UserProfile;
    return {
      ...data,
      id: doc.id,
    };
  });

  // Load events
  const eventsSnapshot = await db.collection("events").get();
  const events = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: (doc.data().name as string) || "Acara Tanpa Nama",
  }));

  const { intent, fields, items = [] } = parsed;

  // Append a success or warning message based on sender registration in JobDex.in
  const getSenderWarning = () => {
    if (!senderProfile) {
      return `\n⚠️ Catatan: Nomor WhatsApp Anda belum terhubung ke akun JobDex.in, sehingga command eksekusi nantinya tidak dapat dijalankan.`;
    }
    const roleLabel = senderProfile.role?.replace("_", " ") || "anggota";
    return `\n✅ Pengirim dikenali: ${senderProfile.name} (${roleLabel})`;
  };

  switch (intent) {
    case "create_task_preview": {
      const tipe = fields.tipe || "Divisi";
      const judul = fields.judul || "-";
      const picRaw = fields.pic || "-";
      const deadlineRaw = fields.deadline || "-";
      const prioritas = fields.prioritas || "-";
      const deskripsi = fields.deskripsi || "-";
      const redaksi = fields.redaksi || "-";
      const referensi = fields.referensi || "-";
      const warna = fields.warna || "-";
      const arahanVisual = fields["arahan visual"] || fields.arahan_visual || "-";
      const acaraRaw = fields.acara || "";

      const picUser = findUserByName(picRaw, users);
      const hasAcara = tipe.toLowerCase() === "acara";
      const event = hasAcara && acaraRaw ? findEventByName(acaraRaw, events) : null;

      const validations: string[] = [];
      let isValid = true;

      // Validate PIC
      if (picUser) {
        validations.push(`- PIC ditemukan: ${picUser.name} (${picUser.role.replace("_", " ")})`);
      } else {
        validations.push(`- PIC tidak ditemukan ("${picRaw}")`);
        isValid = false;
      }

      // Validate Deadline
      if (deadlineRaw && deadlineRaw !== "-") {
        validations.push(`- Deadline terbaca: ${deadlineRaw}`);
      } else {
        validations.push(`- Deadline tidak terbaca/tidak lengkap`);
        isValid = false;
      }

      // Validate Event if type is acara
      if (hasAcara) {
        if (!acaraRaw) {
          validations.push(`- Field 'acara' wajib diisi jika tipe adalah 'acara'`);
          isValid = false;
        } else if (event) {
          validations.push(`- Acara ditemukan: ${event.name}`);
        } else {
          validations.push(
            `- Acara belum ditemukan ("${acaraRaw}"). Harap buat acara terlebih dahulu menggunakan "!jobdex tambah acara" agar dapat mengunggah job desk ini.`
          );
          isValid = false;
        }
      }

      // Validate other fields
      const missing = [];
      if (!judul || judul === "-") missing.push("judul");
      if (!prioritas || prioritas === "-") missing.push("prioritas");
      if (missing.length > 0) {
        validations.push(`- Field wajib tidak lengkap (Harap lengkapi: ${missing.join(", ")})`);
        isValid = false;
      } else {
        validations.push(`- Field wajib lengkap`);
      }

      const previewText = [
        `[JobDex.in AI Preview]`,
        ``,
        `Saya membaca rencana tambah job desk:`,
        ``,
        `Tipe: ${tipe.charAt(0).toUpperCase() + tipe.slice(1)}`,
        hasAcara ? `Acara: ${event ? event.name : acaraRaw}` : null,
        `Judul: ${judul}`,
        `PIC: ${picUser ? picUser.name : picRaw}`,
        `Deadline: ${deadlineRaw}`,
        `Prioritas: ${prioritas}`,
        `Deskripsi: ${deskripsi}`,
        redaksi !== "-" ? `Redaksi: ${redaksi}` : null,
        referensi !== "-" ? `Referensi: ${referensi}` : null,
        warna !== "-" ? `Warna: ${warna}` : null,
        arahanVisual !== "-" ? `Arahan visual: ${arahanVisual}` : null,
        ``,
        `Status validasi:`,
        ...validations,
        getSenderWarning(),
        ``,
        `Catatan:`,
        `Preview ini belum disimpan ke database.`
      ]
        .filter((line) => line !== null)
        .join("\n");

      return { isValid, previewText };
    }

    case "create_event_preview": {
      const name = fields.nama || fields.name || "-";
      const tanggal = fields.tanggal || fields.date || "-";
      const koordinatorRaw = fields.koordinator || "-";
      const deskripsi = fields.deskripsi || fields.description || "-";

      const koorUser = findUserByName(koordinatorRaw, users);

      const validations: string[] = [];
      let isValid = true;

      // Validate Koordinator
      if (koorUser) {
        validations.push(`- Koordinator ditemukan: ${koorUser.name} (${koorUser.role.replace("_", " ")})`);
      } else {
        validations.push(`- Koordinator tidak ditemukan ("${koordinatorRaw}")`);
        isValid = false;
      }

      // Validate Tanggal
      if (tanggal && tanggal !== "-") {
        validations.push(`- Tanggal terbaca: ${tanggal}`);
      } else {
        validations.push(`- Tanggal tidak terbaca/tidak lengkap`);
        isValid = false;
      }

      // Validate required name
      if (!name || name === "-") {
        validations.push(`- Field wajib tidak lengkap (Harap lengkapi: nama)`);
        isValid = false;
      } else {
        validations.push(`- Field wajib lengkap`);
      }

      const previewText = [
        `[JobDex.in AI Preview]`,
        ``,
        `Saya membaca rencana tambah acara:`,
        ``,
        `Nama: ${name}`,
        `Tanggal: ${tanggal}`,
        `Koordinator: ${koorUser ? koorUser.name : koordinatorRaw}`,
        `Deskripsi: ${deskripsi}`,
        ``,
        `Status validasi:`,
        ...validations,
        getSenderWarning(),
        ``,
        `Preview ini belum disimpan ke database.`
      ]
        .filter((line) => line !== null)
        .join("\n");

      return { isValid, previewText };
    }

    case "bulk_create_task_preview": {
      const globalTipe = fields.tipe || "Divisi";
      const previewLines: string[] = [];
      const totalItems = items.length;
      let picsFoundCount = 0;
      let deadlinesProblemCount = 0;

      items.forEach((item, index) => {
        const judul = item.judul || "-";
        const picRaw = item.pic || "-";
        const deadline = item.deadline || "-";
        const prioritas = item.prioritas || "-";

        const picUser = findUserByName(picRaw, users);
        if (picUser) {
          picsFoundCount++;
        }
        if (!deadline || deadline === "-" || deadline.toLowerCase() === "t/d") {
          deadlinesProblemCount++;
        }

        previewLines.push(
          `${index + 1}. ${judul}`,
          `   PIC: ${picUser ? picUser.name : picRaw}${picUser ? ` (${picUser.role.replace("_", " ")})` : " (Tidak ditemukan)"}`,
          `   Deadline: ${deadline}`,
          `   Prioritas: ${prioritas}`
        );
      });

      const validations: string[] = [
        `- ${totalItems} task terbaca`,
        `- PIC ditemukan: ${picsFoundCount}/${totalItems}`,
        `- ${deadlinesProblemCount}/${totalItems} deadline bermasalah`
      ];

      const previewText = [
        `[JobDex.in AI Preview Bulk]`,
        ``,
        `Saya membaca ${totalItems} rencana job desk (${globalTipe.charAt(0).toUpperCase() + globalTipe.slice(1)}):`,
        ``,
        ...previewLines,
        ``,
        `Validasi:`,
        ...validations,
        getSenderWarning(),
        ``,
        `Preview ini belum disimpan ke database.`
      ].join("\n");

      const isValid = picsFoundCount === totalItems && deadlinesProblemCount === 0 && totalItems > 0;
      return { isValid, previewText };
    }

    case "approve_task_preview": {
      const query = fields.query || "";
      if (!query) {
        return {
          isValid: false,
          previewText: `[JobDex.in AI Preview]\n\nFormat salah. Harap tentukan nama task yang ingin diapprove.\nContoh: !jobdex approve task Desain feed`,
        };
      }

      // Load active tasks from database
      const tasksSnapshot = await db.collection("tasks").where("is_archived", "==", false).get();
      const tasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: (doc.data().name as string) || "Task Tanpa Nama",
        pic_id: (doc.data().pic_id as string) || "",
        status: (doc.data().status as string) || "",
        approval_status: (doc.data().approval_status as string) || "",
      }));

      const matched = findTasksByTitle(query, tasks);

      if (matched.length === 0) {
        return {
          isValid: false,
          previewText: `[JobDex.in AI Preview]\n\nTask dengan judul mirip "${query}" tidak ditemukan.\nHarap periksa kembali judul task yang Anda masukkan.`,
        };
      }

      if (matched.length === 1) {
        const task = matched[0];
        const picUser = users.find((u) => u.id === task.pic_id);
        const statusLabel = TASK_STATUS_LABELS[task.status] || task.status;

        const previewText = [
          `[JobDex.in AI Preview]`,
          ``,
          `Saya menemukan task:`,
          `Judul: ${task.name}`,
          `PIC: ${picUser ? picUser.name : "Tidak ditemukan"}`,
          `Status: ${statusLabel}`,
          `Approval Status: ${task.approval_status || "pending"}`,
          ``,
          `Rencana aksi:`,
          `Approve task ini.`,
          getSenderWarning(),
          ``,
          `Preview ini belum dijalankan.`
        ]
          .filter((line) => line !== null)
          .join("\n");

        return { isValid: true, previewText };
      }

      // Multiple candidates found
      const candidates = matched.map((t, idx) => {
        const picUser = users.find((u) => u.id === t.pic_id);
        return `${idx + 1}. ${t.name} (PIC: ${picUser ? picUser.name : "Tidak ditemukan"})`;
      });

      const previewText = [
        `Saya menemukan beberapa task mirip:`,
        ...candidates,
        ``,
        `Tolong gunakan nama yang lebih spesifik.`
      ].join("\n");

      return { isValid: false, previewText };
    }

    default: {
      return {
        isValid: false,
        previewText: `[JobDex.in AI Preview]\n\nCommand tidak dikenal atau gagal diproses.`,
      };
    }
  }
}
