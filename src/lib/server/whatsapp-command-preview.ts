import "server-only";

import { getAdminDb } from "@/lib/server/firebase-admin";
import type { ParsedWhatsAppCommand } from "./whatsapp-command-parser";
import type { UserProfile } from "@/types";

const CASE_1_TEMPLATE = `[JobDex.in AI]

Silakan lengkapi format job desk berikut:

!jobdex tambah jobdesk
tipe: divisi/acara
judul: ...
pic: ...
deadline: ...
prioritas: rendah/sedang/tinggi/kritis
deskripsi: ...
redaksi: ...
referensi: ...
drive: ...
warna: #185FA5, #EF9F27
arahan visual: ...

Catatan:
- Gunakan \`tipe: divisi\` untuk job desk divisi.
- Gunakan \`tipe: acara\` jika job desk terkait acara.
- Jika \`tipe: acara\`, tambahkan \`acara: nama acara\`.

Contoh job desk divisi:

!jobdex tambah jobdesk
tipe: divisi
judul: Desain PP Grup Inti 26/27
pic: IPANG NIH BOSS
deadline: 3 Juni 2026
prioritas: sedang
deskripsi: Buat desain PP grup inti
redaksi: https://docs.google.com/...
referensi: https://drive.google.com/...
warna: #185FA5, #EF9F27
arahan visual: modern, biru elegan`;

const CASE_2_TEMPLATE = `[JobDex.in AI]

Untuk menambahkan job desk acara, gunakan format ini:

!jobdex tambah jobdesk
tipe: acara
acara: nama acara
judul: ...
pic: ...
deadline: ...
prioritas: rendah/sedang/tinggi/kritis
deskripsi: ...
redaksi: ...
referensi: ...
drive: ...
warna: ...
arahan visual: ...

Contoh:

!jobdex tambah jobdesk
tipe: acara
acara: PKKMB 2026
judul: Desain feed opening
pic: Agus DJ
deadline: 10 Juni 2026
prioritas: tinggi
deskripsi: Buat desain feed opening PKKMB
redaksi: https://docs.google.com/...
referensi: https://drive.google.com/...
warna: #185FA5, #EF9F27
arahan visual: modern, kampus, biru elegan

Jika acara belum ada di JobDex.in, buat acaranya dulu dengan:

!jobdex tambah acara
nama: PKKMB 2026
tanggal: 1 Agustus 2026
koordinator: Nama Koordinator
deskripsi: ...`;

const CASE_5_TEMPLATE = `[JobDex.in AI]

Untuk membuat acara, gunakan format:

!jobdex tambah acara
nama: ...
tanggal: ...
koordinator: ...
deskripsi: ...

Contoh:

!jobdex tambah acara
nama: PKKMB 2026
tanggal: 1 Agustus 2026
koordinator: Sumesta C
deskripsi: Acara pengenalan kampus mahasiswa baru`;

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
      const cleanedCmd = parsed.rawText.trim().toLowerCase().replace(/^!jobdex/i, "").trim();
      if (cleanedCmd === "tambah jobdesk") {
        return {
          isValid: false,
          previewText: CASE_1_TEMPLATE,
        };
      }
      if (cleanedCmd === "tambah jobdesk acara") {
        return {
          isValid: false,
          previewText: CASE_2_TEMPLATE,
        };
      }

      // Check missing required fields
      const tipe = fields.tipe || "";
      const isAcara = tipe.toLowerCase() === "acara";

      const missingFields: string[] = [];
      if (!fields.tipe) missingFields.push("tipe");
      if (!fields.judul) missingFields.push("judul");
      if (!fields.pic) missingFields.push("pic");
      if (!fields.deadline) missingFields.push("deadline");
      
      let priorityInvalid = false;
      if (!fields.prioritas) {
        missingFields.push("prioritas");
      } else {
        const validPriorities = ["rendah", "sedang", "tinggi", "kritis"];
        if (!validPriorities.includes(fields.prioritas.toLowerCase().trim())) {
          missingFields.push("prioritas");
          priorityInvalid = true;
        }
      }
      if (isAcara && !fields.acara) missingFields.push("acara");

      if (missingFields.length > 0) {
        // Build Case 3 incomplete guidance
        const readFields: string[] = [];
        if (fields.tipe) {
          const tLabel = tipe.toLowerCase() === "divisi" ? "Divisi" : tipe.toLowerCase() === "acara" ? "Acara" : tipe;
          readFields.push(`- Tipe: ${tLabel}`);
        }
        if (isAcara && fields.acara) readFields.push(`- Acara: ${fields.acara}`);
        if (fields.judul) readFields.push(`- Judul: ${fields.judul}`);
        if (fields.pic) readFields.push(`- PIC: ${fields.pic}`);
        if (fields.deadline) readFields.push(`- Deadline: ${fields.deadline}`);
        if (fields.prioritas && !priorityInvalid) {
          const pLabel = fields.prioritas.charAt(0).toUpperCase() + fields.prioritas.slice(1).toLowerCase();
          readFields.push(`- Prioritas: ${pLabel}`);
        }

        const readSection = readFields.length > 0 ? `Sudah terbaca:\n${readFields.join("\n")}` : "Belum ada field yang terbaca.";
        const missingSection = `Yang masih perlu dilengkapi:\n${missingFields.map((f) => `- ${f}`).join("\n")}`;

        const dynamicTemplate = [
          `!jobdex tambah jobdesk`,
          `tipe: ${fields.tipe || "divisi/acara"}`,
          isAcara || tipe.toLowerCase() === "acara" ? `acara: ${fields.acara || "..."}` : null,
          `judul: ${fields.judul || "..."}`,
          `pic: ${fields.pic || "..."}`,
          `deadline: ${fields.deadline || "..."}`,
          `prioritas: ${fields.prioritas && !priorityInvalid ? fields.prioritas.toLowerCase() : "rendah/sedang/tinggi/kritis"}`,
          `deskripsi: ${fields.deskripsi || "..."}`,
          fields.redaksi ? `redaksi: ${fields.redaksi}` : null,
          fields.referensi ? `referensi: ${fields.referensi}` : null,
          fields.drive ? `drive: ${fields.drive}` : null,
          fields.warna ? `warna: ${fields.warna}` : null,
          fields["arahan visual"] || fields.arahan_visual ? `arahan visual: ${fields["arahan visual"] || fields.arahan_visual}` : null,
        ].filter(Boolean).join("\n");

        const previewText = [
          `[JobDex.in AI]`,
          ``,
          `Data job desk sudah mulai terbaca, tetapi masih kurang:`,
          ``,
          readSection,
          ``,
          missingSection,
          ``,
          `Silakan kirim ulang dengan format:`,
          ``,
          dynamicTemplate
        ].join("\n");

        return {
          isValid: false,
          previewText,
        };
      }

      const judul = fields.judul || "-";
      const picRaw = fields.pic || "-";
      const deadlineRaw = fields.deadline || "-";
      const prioritas = fields.prioritas || "sedang";
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
        `Preview ini belum disimpan ke database.`
      ]
        .filter((line) => line !== null)
        .join("\n");

      return { isValid, previewText };
    }

    case "create_event_preview": {
      const cleanedCmd = parsed.rawText.trim().toLowerCase().replace(/^!jobdex/i, "").trim();
      if (cleanedCmd === "tambah acara") {
        return {
          isValid: false,
          previewText: CASE_5_TEMPLATE,
        };
      }

      const name = fields.nama || fields.name || "";
      const tanggal = fields.tanggal || fields.date || "";
      const koordinatorRaw = fields.koordinator || "";
      const deskripsi = fields.deskripsi || fields.description || "";

      // Check missing required fields for event
      const missingFields: string[] = [];
      if (!name) missingFields.push("nama");
      if (!tanggal) missingFields.push("tanggal");
      if (!koordinatorRaw) missingFields.push("koordinator");

      if (missingFields.length > 0) {
        const readFields: string[] = [];
        if (name) readFields.push(`- Nama: ${name}`);
        if (tanggal) readFields.push(`- Tanggal: ${tanggal}`);
        if (koordinatorRaw) readFields.push(`- Koordinator: ${koordinatorRaw}`);

        const readSection = readFields.length > 0 ? `Sudah terbaca:\n${readFields.join("\n")}` : "Belum ada field yang terbaca.";
        const missingSection = `Yang masih perlu dilengkapi:\n${missingFields.map((f) => `- ${f}`).join("\n")}`;

        const dynamicTemplate = [
          `!jobdex tambah acara`,
          `nama: ${name || "..."}`,
          `tanggal: ${tanggal || "..."}`,
          `koordinator: ${koordinatorRaw || "..."}`,
          `deskripsi: ${deskripsi || "..."}`
        ].join("\n");

        const previewText = [
          `[JobDex.in AI]`,
          ``,
          `Data acara sudah mulai terbaca, tetapi masih kurang:`,
          ``,
          readSection,
          ``,
          missingSection,
          ``,
          `Silakan kirim ulang dengan format:`,
          ``,
          dynamicTemplate
        ].join("\n");

        return {
          isValid: false,
          previewText,
        };
      }

      const nameVal = name || "-";
      const tanggalVal = tanggal || "-";
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
      if (tanggalVal && tanggalVal !== "-") {
        validations.push(`- Tanggal terbaca: ${tanggalVal}`);
      } else {
        validations.push(`- Tanggal tidak terbaca/tidak lengkap`);
        isValid = false;
      }

      // Validate required name
      if (!nameVal || nameVal === "-") {
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
        `Nama: ${nameVal}`,
        `Tanggal: ${tanggalVal}`,
        `Koordinator: ${koorUser ? koorUser.name : koordinatorRaw}`,
        `Deskripsi: ${deskripsi || "-"}`,
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
