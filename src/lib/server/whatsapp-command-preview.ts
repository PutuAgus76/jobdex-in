import "server-only";
import { WA_LABEL } from "@/lib/server/whatsapp-labels";

import { getAdminDb } from "@/lib/server/firebase-admin";
import type { ParsedWhatsAppCommand } from "./whatsapp-command-parser";
import type { UserProfile, Event, DesignReference } from "@/types";
import { findEventByGroupId } from "./group-routing";
import { detectSearchIntent, calculateReferenceScore } from "./reference-search";

const CASE_1_TEMPLATE = `${WA_LABEL.ai}

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

const CASE_2_TEMPLATE = `${WA_LABEL.ai}

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

Jika acara belum ada di JobdexIn, buat acaranya dulu dengan:

!jobdex tambah acara
nama: PKKMB 2026
tanggal: 1 Agustus 2026
koordinator: Nama Koordinator
deskripsi: ...`;

const CASE_5_TEMPLATE = `${WA_LABEL.ai}

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

const CASE_REF_TEMPLATE = `${WA_LABEL.ai}

Silakan lengkapi format tambah referensi desain berikut:

!jobdex tambah referensi
scope: divisi/acara
acara: ...
divisi: ...
tahun: ...
judul: ...
jenis: poster/feed/story/nametag/video/audio/dokumen/google_drive/canva/lainnya
link drive: ...
link canva: ...
link docs: ...
link lain: ...
warna: ...
arahan visual: ...
catatan: ...

Catatan:
- Gunakan scope: acara jika referensi terkait kegiatan tertentu.
- Gunakan scope: divisi jika referensi milik divisi.
- Minimal isi salah satu link.`;

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "Belum Mulai",
  in_progress: "Sedang Dikerjakan",
  stuck: "Stuck/Kendala",
  in_review: "Menunggu Approval",
  done: "Selesai",
};

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

export function resolvePIC(
  query: string,
  allUsers: UserProfile[]
): { success: boolean; user?: UserProfile; candidates: UserProfile[] } {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return { success: false, candidates: [] };

  // 1. Phone number resolution (Prioritas Tertinggi)
  const queryPhoneDigits = cleanQuery.replace(/[^\d]/g, "");
  if (queryPhoneDigits.length >= 8) {
    const normalizedQueryPhone = queryPhoneDigits.replace(/^0/, "62");
    
    const phoneMatches = allUsers.filter(u => {
      const userPhoneDigits = (u.whatsapp_number || "").replace(/[^\d]/g, "");
      const normalizedUserPhone = userPhoneDigits.replace(/^0/, "62");
      return normalizedQueryPhone === normalizedUserPhone;
    });

    if (phoneMatches.length === 1) {
      return { success: true, user: phoneMatches[0], candidates: [] };
    } else if (phoneMatches.length > 1) {
      return { success: false, candidates: phoneMatches };
    }
  }

  // 2. Exact match on nickname
  const nicknameMatches = allUsers.filter(
    u => u.nickname?.toLowerCase().trim() === cleanQuery
  );
  if (nicknameMatches.length === 1) {
    return { success: true, user: nicknameMatches[0], candidates: [] };
  } else if (nicknameMatches.length > 1) {
    return { success: false, candidates: nicknameMatches };
  }

  // 3. Exact match on aliases
  const aliasMatches = allUsers.filter(
    u => u.aliases && Array.isArray(u.aliases) && u.aliases.some(a => a.toLowerCase().trim() === cleanQuery)
  );
  if (aliasMatches.length === 1) {
    return { success: true, user: aliasMatches[0], candidates: [] };
  } else if (aliasMatches.length > 1) {
    return { success: false, candidates: aliasMatches };
  }

  // 4. Exact match on full name
  const exactNameMatches = allUsers.filter(
    u => u.name.toLowerCase().trim() === cleanQuery
  );
  if (exactNameMatches.length === 1) {
    return { success: true, user: exactNameMatches[0], candidates: [] };
  } else if (exactNameMatches.length > 1) {
    return { success: false, candidates: exactNameMatches };
  }

  // 5. Fuzzy match on name (substring check)
  const fuzzyNameMatches = allUsers.filter(
    u => u.name.toLowerCase().includes(cleanQuery)
  );
  if (fuzzyNameMatches.length === 1) {
    return { success: true, user: fuzzyNameMatches[0], candidates: [] };
  } else if (fuzzyNameMatches.length > 1) {
    return { success: false, candidates: fuzzyNameMatches };
  }

  // 6. Fuzzy match on nickname/aliases
  const fuzzyOtherMatches = allUsers.filter(
    u => (u.nickname && u.nickname.toLowerCase().includes(cleanQuery)) ||
         (u.aliases && Array.isArray(u.aliases) && u.aliases.some(a => a.toLowerCase().includes(cleanQuery)))
  );
  if (fuzzyOtherMatches.length === 1) {
    return { success: true, user: fuzzyOtherMatches[0], candidates: [] };
  } else if (fuzzyOtherMatches.length > 1) {
    return { success: false, candidates: fuzzyOtherMatches };
  }

  return { success: false, candidates: [] };
}

export function getChecklistByTaskName(
  taskName: string
): Array<{ id: string; label: string; is_done: boolean }> {
  const clean = taskName.toLowerCase().trim();

  // A. Desain publikasi
  const isDesain = ["pamflet", "poster", "flyer", "feed", "story", "banner", "spanduk", "publikasi", "desain"].some(
    kw => clean.includes(kw)
  );
  if (isDesain) {
    return [
      { id: "checklist_1", label: "Redaksi/materi tersedia", is_done: false },
      { id: "checklist_2", label: "Referensi desain tersedia", is_done: false },
      { id: "checklist_3", label: "Draft desain", is_done: false },
      { id: "checklist_4", label: "Revisi internal", is_done: false },
      { id: "checklist_5", label: "Finalisasi ukuran", is_done: false },
      { id: "checklist_6", label: "Upload hasil", is_done: false },
    ];
  }

  // B. Dokumentasi
  const isDokumentasi = ["dokumentasi", "foto", "video", "highlight", "recap", "aftermovie"].some(
    kw => clean.includes(kw)
  );
  if (isDokumentasi) {
    return [
      { id: "checklist_1", label: "Brief dokumentasi dibaca", is_done: false },
      { id: "checklist_2", label: "Ambil footage/foto", is_done: false },
      { id: "checklist_3", label: "Seleksi file", is_done: false },
      { id: "checklist_4", label: "Editing", is_done: false },
      { id: "checklist_5", label: "Review internal", is_done: false },
      { id: "checklist_6", label: "Upload final", is_done: false },
    ];
  }

  // C. Copywriting
  const isCopywriting = ["caption", "copywriting", "narasi", "teks publikasi", "press release"].some(
    kw => clean.includes(kw)
  );
  if (isCopywriting) {
    return [
      { id: "checklist_1", label: "Pahami brief", is_done: false },
      { id: "checklist_2", label: "Draft tulisan", is_done: false },
      { id: "checklist_3", label: "Review bahasa", is_done: false },
      { id: "checklist_4", label: "Finalisasi", is_done: false },
      { id: "checklist_5", label: "Kirim ke desainer/admin", is_done: false },
    ];
  }

  // D. Administrasi
  const isAdministrasi = ["surat", "undangan", "proposal", "lpj", "rab", "daftar hadir"].some(
    kw => clean.includes(kw)
  );
  if (isAdministrasi) {
    return [
      { id: "checklist_1", label: "Data kebutuhan lengkap", is_done: false },
      { id: "checklist_2", label: "Draft dokumen", is_done: false },
      { id: "checklist_3", label: "Review koordinator", is_done: false },
      { id: "checklist_4", label: "Revisi dokumen", is_done: false },
      { id: "checklist_5", label: "Finalisasi", is_done: false },
      { id: "checklist_6", label: "Upload/arsipkan", is_done: false },
    ];
  }

  // E. Umum (Default)
  return [
    { id: "checklist_1", label: "Redaksi/materi tersedia", is_done: false },
    { id: "checklist_2", label: "Referensi desain tersedia", is_done: false },
    { id: "checklist_3", label: "Mulai desain/draft awal", is_done: false },
    { id: "checklist_4", label: "Revisi internal", is_done: false },
    { id: "checklist_5", label: "Finalisasi desain", is_done: false },
    { id: "checklist_6", label: "Upload hasil ke Drive", is_done: false },
  ];
}

interface PreviewResult {
  isValid: boolean;
  previewText: string;
}

export async function buildWhatsAppCommandPreview(
  parsed: ParsedWhatsAppCommand,
  senderProfile: UserProfile | null,
  groupId?: string
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

  // Resolve linked event from WhatsApp Group
  let linkedEvent: Event | null = null;
  if (groupId) {
    linkedEvent = await findEventByGroupId(groupId);
  }

  const { intent, fields, items = [] } = parsed;

  const getSenderWarning = () => {
    if (!senderProfile) {
      return `\n⚠️ Catatan: Nomor WhatsApp Anda belum terhubung ke akun JobdexIn, sehingga command eksekusi nantinya tidak dapat dijalankan.`;
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

      // Auto group routing event resolution
      if (linkedEvent) {
        fields.tipe = "acara";
        fields.acara = linkedEvent.name;
      } else if (fields.acara) {
        fields.tipe = "acara";
      } else if (!fields.tipe) {
        fields.tipe = "divisi";
      }

      const tipe = fields.tipe || "divisi";
      const isAcara = tipe.toLowerCase() === "acara";

      // Auto priority upgrade safety check
      if (!fields.prioritas) {
        fields.prioritas = "sedang";
      }
      const rawLower = parsed.rawText.toLowerCase();
      const hasUrgentWords = ["urgent", "hari ini", "besok", "segera", "penting", "kritis", "cepat", "darurat"].some(
        w => rawLower.includes(w)
      );
      if (hasUrgentWords && (fields.prioritas === "sedang" || fields.prioritas === "rendah")) {
        fields.prioritas = "tinggi";
      }

      const missingFields: string[] = [];
      if (!fields.judul) missingFields.push("judul");
      if (!fields.pic) missingFields.push("pic");
      if (!fields.deadline) missingFields.push("deadline");
      if (isAcara && !fields.acara) missingFields.push("acara");

      if (missingFields.length > 0) {
        // Build incomplete guidance
        const readFields: string[] = [];
        readFields.push(`- Tipe: ${tipe.toLowerCase() === "divisi" ? "Divisi" : "Acara"}`);
        if (isAcara && fields.acara) readFields.push(`- Acara: ${fields.acara}`);
        if (fields.judul) readFields.push(`- Judul: ${fields.judul}`);
        if (fields.pic) readFields.push(`- PIC: ${fields.pic}`);
        if (fields.deadline) readFields.push(`- Deadline: ${fields.deadline}`);
        readFields.push(`- Prioritas: ${fields.prioritas.charAt(0).toUpperCase() + fields.prioritas.slice(1).toLowerCase()}`);

        const readSection = `Sudah terbaca:\\n${readFields.join("\\n")}`;
        const missingSection = `Yang masih perlu dilengkapi:\\n${missingFields.map((f) => `- ${f}`).join("\\n")}`;

        const dynamicTemplate = [
          `!jobdex tambah jobdesk`,
          `tipe: ${tipe}`,
          isAcara ? `acara: ${fields.acara || "..."}` : null,
          `judul: ${fields.judul || "..."}`,
          `pic: ${fields.pic || "..."}`,
          `deadline: ${fields.deadline || "..."}`,
          `prioritas: ${fields.prioritas.toLowerCase()}`,
          `deskripsi: ${fields.deskripsi || "..."}`,
        ].filter(Boolean).join("\\n");

        const previewText = [
          `[*JobdexIn* Format Belum Lengkap]`,
          ``,
          `Saya sudah membaca judul task dan PIC, tetapi deadline belum terdeteksi.`,
          ``,
          readSection,
          ``,
          missingSection,
          ``,
          `Silakan kirim ulang dengan format:`,
          ``,
          dynamicTemplate
        ].join("\\n");

        return {
          isValid: false,
          previewText,
        };
      }

      const judul = fields.judul;
      const picRaw = fields.pic;
      const deadlineRaw = fields.deadline;
      const prioritas = fields.prioritas;
            const acaraRaw = fields.acara || "";

      // Smart PIC Resolution
      const picResult = resolvePIC(picRaw, users);
      let picUser: UserProfile | null = null;

      if (picResult.success && picResult.user) {
        picUser = picResult.user;
      } else if (picResult.candidates.length > 1) {
        const listText = picResult.candidates.map((c, i) => {
          const ph = c.whatsapp_number || "";
          const masked = ph ? ph.slice(0, 5) + "xxxx" + ph.slice(-2) : "-";
          return `${i + 1}. ${c.name} — ${masked}`;
        }).join("\\n");

        return {
          isValid: false,
          previewText: [
            `[*JobdexIn* PIC Ambigu]`,
            ``,
            `Saya menemukan beberapa anggota yang mirip dengan "${picRaw}":`,
            ``,
            listText,
            ``,
            `Ulangi command dengan nama yang lebih lengkap atau nomor WhatsApp PIC.`
          ].join("\\n")
        };
      } else {
        return {
          isValid: false,
          previewText: [
            `[*JobdexIn* PIC Tidak Ditemukan]`,
            ``,
            `PIC "${picRaw}" tidak ditemukan dalam database JobdexIn.`,
            ``,
            `Pastikan nama, nickname, alias, atau nomor WhatsApp PIC sudah benar, atau hubungi admin.`
          ].join("\\n")
        };
      }

      const event = isAcara ? findEventByName(acaraRaw, events) : null;
      const validations: string[] = [];
      let isValid = true;

      validations.push(`- PIC ditemukan: ${picUser.name}`);
      validations.push(`- Deadline terbaca: ${deadlineRaw}`);

      if (isAcara) {
        if (event) {
          validations.push(`- Acara ditemukan: ${event.name}`);
        } else {
          validations.push(
            `- Acara belum ditemukan ("${acaraRaw}"). Harap buat acara terlebih dahulu agar dapat mengunggah job desk ini.`
          );
          isValid = false;
        }
      }

      // Auto Checklist based on Task Type
      const checklist = getChecklistByTaskName(judul);
      const checklistText = checklist.map((item, i) => `${i + 1}. ${item.label}`).join("\\n");

      // Auto Cari Referensi untuk task desain
      let referenceSection = "";
      const cleanTitle = judul.toLowerCase().trim();
      const isDesignTask = ["pamflet", "poster", "flyer", "feed", "story", "banner", "spanduk", "publikasi", "desain"].some(
        kw => cleanTitle.includes(kw)
      );

      if (isDesignTask) {
        try {
          const refIntent = detectSearchIntent(judul + " " + (event ? event.name : acaraRaw));
          const snapshot = await db.collection("design_references").where("is_archived", "==", false).get();
          const refs: DesignReference[] = [];
          snapshot.forEach((doc) => {
            refs.push({ id: doc.id, ...doc.data() } as DesignReference);
          });
          const scored = refs.map((ref) => ({ ref, score: calculateReferenceScore(ref, refIntent) }));
          scored.sort((a, b) => b.score - a.score);
          const topRefs = scored.filter(item => item.score > 0).slice(0, 3);
          
          if (topRefs.length > 0) {
            const lines = [
              "",
              "Referensi terdekat yang saya temukan:",
              ...topRefs.map((item, i) => `${i + 1}. ${item.ref.title} (${item.ref.year})`)
            ];
            referenceSection = lines.join("\\n");
          }
        } catch (err) {
          console.error("[Auto Reference Suggestion] Failed:", err);
        }
      }

      const previewText = [
        `[*JobdexIn* Preview Jobdesk]`,
        ``,
        `Saya membaca rencana tambah job desk:`,
        ``,
        `Acara: ${isAcara ? (event ? event.name : acaraRaw) : "Divisi (Non-Acara)"}`,
        `Judul: ${judul}`,
        `PIC: ${picUser.name}`,
        `Deadline: ${deadlineRaw}`,
        `Prioritas: ${prioritas.charAt(0).toUpperCase() + prioritas.slice(1).toLowerCase()}`,
        `Status awal: Belum Dimulai`,
        ``,
        `Checklist otomatis:`,
        checklistText,
        referenceSection,
        referenceSection ? `\\nCatatan:\\nReferensi hanya saran. Task tetap bisa dibuat tanpa memilih referensi.` : null,
        ``,
        `Status validasi:`,
        ...validations,
        getSenderWarning(),
        ``,
        `Preview ini belum disimpan ke database.`
      ]
        .filter((line) => line !== null)
        .join("\\n");

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

      const missingFields: string[] = [];
      if (!name) missingFields.push("nama");
      if (!tanggal) missingFields.push("tanggal");
      if (!koordinatorRaw) missingFields.push("koordinator");

      if (missingFields.length > 0) {
        const readFields: string[] = [];
        if (name) readFields.push(`- Nama: ${name}`);
        if (tanggal) readFields.push(`- Tanggal: ${tanggal}`);
        if (koordinatorRaw) readFields.push(`- Koordinator: ${koordinatorRaw}`);

        const readSection = readFields.length > 0 ? `Sudah terbaca:\\n${readFields.join("\\n")}` : "Belum ada field yang terbaca.";
        const missingSection = `Yang masih perlu dilengkapi:\\n${missingFields.map((f) => `- ${f}`).join("\\n")}`;

        const dynamicTemplate = [
          `!jobdex tambah acara`,
          `nama: ${name || "..."}`,
          `tanggal: ${tanggal || "..."}`,
          `koordinator: ${koordinatorRaw || "..."}`,
          `deskripsi: ${deskripsi || "..."}`
        ].join("\\n");

        const previewText = [
          `[*JobdexIn* Format Belum Lengkap]`,
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
        ].join("\\n");

        return {
          isValid: false,
          previewText,
        };
      }

      const nameVal = name || "-";
      const tanggalVal = tanggal || "-";

      // Smart PIC/Koordinator resolution
      const koorResult = resolvePIC(koordinatorRaw, users);
      let koorUser: UserProfile | null = null;

      if (koorResult.success && koorResult.user) {
        koorUser = koorResult.user;
      } else if (koorResult.candidates.length > 1) {
        const listText = koorResult.candidates.map((c, i) => `${i + 1}. ${c.name}`).join("\\n");
        return {
          isValid: false,
          previewText: `[*JobdexIn* PIC Ambigu]\\n\\nSaya menemukan beberapa anggota yang mirip dengan "${koordinatorRaw}":\\n\\n${listText}\\n\\nUlangi command dengan nama yang lebih lengkap.`
        };
      } else {
        return {
          isValid: false,
          previewText: `[*JobdexIn* PIC Tidak Ditemukan]\\n\\nKoordinator "${koordinatorRaw}" tidak ditemukan dalam database.`
        };
      }

      const validations: string[] = [
        `- Koordinator ditemukan: ${koorUser.name}`,
        `- Tanggal terbaca: ${tanggalVal}`,
        `- Field wajib lengkap`
      ];

      const previewText = [
        `[*JobdexIn* Preview Acara]`,
        ``,
        `Saya membaca rencana tambah acara:`,
        ``,
        `Nama: ${nameVal}`,
        `Tanggal: ${tanggalVal}`,
        `Koordinator: ${koorUser.name}`,
        `Deskripsi: ${deskripsi || "-"}`,
        ``,
        `Status validasi:`,
        ...validations,
        getSenderWarning(),
        ``,
        `Preview ini belum disimpan ke database.`
      ].join("\\n");

      return { isValid: true, previewText };
    }

    case "bulk_create_task_preview": {
      // Auto group routing event resolution
      if (linkedEvent) {
        fields.tipe = "acara";
        fields.acara = linkedEvent.name;
      } else if (fields.acara) {
        fields.tipe = "acara";
      } else if (!fields.tipe) {
        fields.tipe = "divisi";
      }

      const globalTipe = fields.tipe || "divisi";
      const isAcara = globalTipe.toLowerCase() === "acara";
      const previewLines: string[] = [];
      const totalItems = items.length;
      let picsFoundCount = 0;
      let deadlinesProblemCount = 0;
      const problemTasks: string[] = [];

      items.forEach((item, index) => {
        const judul = item.judul || "-";
        const picRaw = item.pic || "-";
        const deadline = item.deadline || "-";
        
        // Auto default priority for bulk
        if (!item.prioritas) {
          item.prioritas = "sedang";
        }
        const itemRawText = `${judul} ke ${picRaw} ${deadline}`;
        const hasItemUrgent = ["urgent", "hari ini", "besok", "segera", "penting", "kritis", "cepat", "darurat"].some(
          w => itemRawText.toLowerCase().includes(w)
        );
        if (hasItemUrgent && (item.prioritas === "sedang" || item.prioritas === "rendah")) {
          item.prioritas = "tinggi";
        }

        const prioritas = item.prioritas;

        // Resolve PIC
        const picResult = resolvePIC(picRaw, users);
        let resolvedPicName = picRaw;

        if (picResult.success && picResult.user) {
          resolvedPicName = picResult.user.name;
          picsFoundCount++;
        } else if (picResult.candidates.length > 1) {
          resolvedPicName = `${picRaw} (Ambigu)`;
          problemTasks.push(`Task #${index + 1}: PIC "${picRaw}" ambigu (ada beberapa kecocokan).`);
        } else {
          resolvedPicName = `${picRaw} (Tidak ditemukan)`;
          problemTasks.push(`Task #${index + 1}: PIC "${picRaw}" tidak ditemukan.`);
        }

        const isDeadlineMissing = !deadline || deadline === "-" || deadline.toLowerCase() === "t/d" || deadline.toLowerCase() === "belum terdeteksi";
        if (isDeadlineMissing) {
          deadlinesProblemCount++;
          problemTasks.push(`Task #${index + 1}: Deadline belum ditentukan atau tidak terbaca.`);
        }

        previewLines.push(
          `${index + 1}. ${judul}`,
          `   PIC: ${resolvedPicName}`,
          `   Deadline: ${isDeadlineMissing ? "Belum terdeteksi" : deadline}`,
          `   Prioritas: ${prioritas.charAt(0).toUpperCase() + prioritas.slice(1).toLowerCase()}`
        );
      });

      const validations: string[] = [
        `- ${totalItems} task terbaca`,
        `- PIC ditemukan: ${picsFoundCount}/${totalItems}`,
        `- ${deadlinesProblemCount}/${totalItems} deadline bermasalah`
      ];

      const isValid = picsFoundCount === totalItems && deadlinesProblemCount === 0 && totalItems > 0;

      const previewTextLines = [
        `[*JobdexIn* Preview Bulk Jobdesk]`,
        ``,
        `Saya membaca ${totalItems} job desk untuk ${isAcara ? `acara ${fields.acara || "Acara"}` : "Divisi (Non-Acara)"}.`,
        ``,
        ...previewLines,
        ``,
        `Validasi:`,
        ...validations,
      ];

      if (problemTasks.length > 0) {
        previewTextLines.push(
          ``,
          `⚠️ Masalah Ditemukan:`,
          ...problemTasks,
          ``,
          `Preview belum bisa dikonfirmasi sampai semua field wajib lengkap.`
        );
      } else {
        previewTextLines.push(
          getSenderWarning(),
          ``,
          `Preview ini belum disimpan ke database.`
        );
      }

      return { isValid, previewText: previewTextLines.join("\\n") };
    }

    case "create_reference_preview": {
      const cleanedCmd = parsed.rawText.trim().toLowerCase().replace(/^!jobdex/i, "").trim();
      const isCmdEmpty = 
        cleanedCmd === "tambah referensi" || 
        cleanedCmd === "tambahkan referensi" || 
        cleanedCmd === "tambah arsip referensi" || 
        cleanedCmd === "tambah referensi desain" || 
        cleanedCmd === "tambahkan referensi ini";

      if (isCmdEmpty) {
        return {
          isValid: false,
          previewText: CASE_REF_TEMPLATE,
        };
      }

      const scope = fields.scope || "";
      const isAcara = scope.toLowerCase() === "acara";
      const isDivisi = scope.toLowerCase() === "divisi";

      const judul = fields.judul || fields.title || "";
      const tahun = fields.tahun || fields.year || "";
      
      const linkDrive = fields["link drive"] || fields.link_drive || "";
      const linkCanva = fields["link canva"] || fields.link_canva || "";
      const linkDocs = fields["link docs"] || fields.link_docs || "";
      const linkLain = fields["link lain"] || fields.link_lain || fields.link || "";

      // Gather missing required fields
      const missingFields: string[] = [];
      if (!scope) {
        missingFields.push("scope");
      } else if (scope.toLowerCase() !== "acara" && scope.toLowerCase() !== "divisi") {
        missingFields.push("scope (harus divisi/acara)");
      }
      
      if (!judul) missingFields.push("judul");
      if (!tahun) missingFields.push("tahun");
      
      if (!linkDrive && !linkCanva && !linkDocs && !linkLain) {
        missingFields.push("minimal satu link (link drive/canva/docs/lain)");
      }

      if (scope.toLowerCase() === "acara" && !fields.acara) missingFields.push("acara");
      if (scope.toLowerCase() === "divisi" && !fields.divisi) missingFields.push("divisi");

      if (missingFields.length > 0) {
        // Build incomplete guidance
        const readFields: string[] = [];
        if (scope) readFields.push(`- Scope: ${scope}`);
        if (isAcara && fields.acara) readFields.push(`- Acara: ${fields.acara}`);
        if (isDivisi && fields.divisi) readFields.push(`- Divisi: ${fields.divisi}`);
        if (judul) readFields.push(`- Judul: ${judul}`);
        if (tahun) readFields.push(`- Tahun: ${tahun}`);
        if (fields.jenis || fields.category) readFields.push(`- Jenis: ${fields.jenis || fields.category}`);
        if (linkDrive) readFields.push(`- Link Drive: ${linkDrive}`);
        if (linkCanva) readFields.push(`- Link Canva: ${linkCanva}`);
        if (linkDocs) readFields.push(`- Link Docs: ${linkDocs}`);
        if (linkLain) readFields.push(`- Link Lain: ${linkLain}`);

        const readSection = readFields.length > 0 ? `Sudah terbaca:\\n${readFields.join("\\n")}` : "Belum ada field yang terbaca.";
        const missingSection = `Yang masih perlu dilengkapi:\\n${missingFields.map((f) => `- ${f}`).join("\\n")}`;

        const dynamicTemplate = [
          `!jobdex tambah referensi`,
          `scope: ${fields.scope || "divisi/acara"}`,
          isAcara || scope.toLowerCase() === "acara" ? `acara: ${fields.acara || "..."}` : null,
          isDivisi || scope.toLowerCase() === "divisi" ? `divisi: ${fields.divisi || "..."}` : null,
          `tahun: ${fields.tahun || "..."}`,
          `judul: ${fields.judul || "..."}`,
          `jenis: ${fields.jenis || "..."}`,
          `link drive: ${fields["link drive"] || "..."}`,
          `link canva: ${fields["link canva"] || "..."}`,
          `link docs: ${fields["link docs"] || "..."}`,
          `link lain: ${fields["link lain"] || "..."}`,
          fields.warna ? `warna: ${fields.warna}` : null,
          fields["arahan visual"] || fields.arahan_visual ? `arahan visual: ${fields["arahan visual"] || fields.arahan_visual}` : null,
          fields.catatan || fields.notes ? `catatan: ${fields.catatan || fields.notes}` : null,
        ].filter(Boolean).join("\\n");

        const previewText = [
          `${WA_LABEL.ai}`,
          ``,
          `Data referensi sudah mulai terbaca, tetapi masih kurang:`,
          ``,
          readSection,
          ``,
          missingSection,
          ``,
          `Silakan kirim ulang dengan format:`,
          ``,
          dynamicTemplate
        ].join("\\n");

        return {
          isValid: false,
          previewText,
        };
      }

      // Check Acara validity if scope is acara
      const validations: string[] = [];
      let isValid = true;
      let eventObj = null;

      if (isAcara && fields.acara) {
        eventObj = findEventByName(fields.acara, events);
        if (eventObj) {
          validations.push(`- Acara ditemukan: ${eventObj.name}`);
        } else {
          validations.push(
            `- Acara belum ditemukan ("${fields.acara}"). Harap buat acara terlebih dahulu agar dapat menambahkan referensi ini.`
          );
          isValid = false;
        }
      }

      // Check role authorization
      if (!senderProfile) {
        validations.push(`- Otorisasi dibatasi (Nomor belum terdaftar di JobdexIn)`);
        isValid = false;
      } else {
        const role = senderProfile.role;
        if (role === "anggota") {
          validations.push(`- Akses ditolak: Anggota biasa tidak diizinkan menambahkan referensi.`);
          isValid = false;
        } else if (role === "koordinator_divisi") {
          const userDiv = senderProfile.division_id || "";
          const targetDiv = fields.divisi || "";
          if (isDivisi && targetDiv && userDiv.toLowerCase() !== targetDiv.toLowerCase()) {
            validations.push(`- Akses ditolak: Sebagai Koordinator Divisi, Anda hanya boleh menambah referensi untuk divisi Anda sendiri (${userDiv}).`);
            isValid = false;
          } else {
            validations.push(`- Akses diizinkan: Koordinator Divisi`);
          }
        } else if (role === "koordinator_acara") {
          if (isAcara && eventObj) {
            const evDoc = await db.collection("events").doc(eventObj.id).get();
            const evData = evDoc.data();
            if (evData && evData.coordinator_id !== senderProfile.id) {
              validations.push(`- Akses ditolak: Anda bukan koordinator untuk acara "${eventObj.name}".`);
              isValid = false;
            } else {
              validations.push(`- Akses diizinkan: Koordinator Acara`);
            }
          } else if (isDivisi) {
            validations.push(`- Akses ditolak: Koordinator Acara tidak diizinkan menambahkan referensi scope Divisi.`);
            isValid = false;
          } else {
            validations.push(`- Akses diizinkan: Koordinator Acara`);
          }
        } else if (role === "super_admin") {
          validations.push(`- Akses diizinkan: Super Admin`);
        } else {
          validations.push(`- Akses ditolak: Peran tidak dikenali.`);
          isValid = false;
        }
      }

      // Link auto-classification & multi-link parsing
      const driveLinks = linkDrive ? linkDrive.split(/,\\s*/).filter(Boolean) : [];
      const canvaLinks = linkCanva ? linkCanva.split(/,\\s*/).filter(Boolean) : [];
      const docLinks = linkDocs ? linkDocs.split(/,\\s*/).filter(Boolean) : [];
      let otherLinks = linkLain ? linkLain.split(/,\\s*/).filter(Boolean) : [];

      const classifiedOther: string[] = [];
      for (const link of otherLinks) {
        if (link.includes("drive.google.com")) {
          driveLinks.push(link);
        } else if (link.includes("docs.google.com")) {
          if (link.includes("/document/")) {
            docLinks.push(link);
          } else {
            driveLinks.push(link);
          }
        } else if (link.includes("canva.com")) {
          canvaLinks.push(link);
        } else {
          classifiedOther.push(link);
        }
      }
      otherLinks = classifiedOther;

      validations.push(`- Field wajib lengkap`);
      validations.push(`- Minimal satu link tersedia`);

      const jenis = fields.jenis || fields.category || "-";
      const warna = fields.warna || "-";
      const arahanVisual = fields["arahan visual"] || fields.arahan_visual || "-";
      const catatan = fields.catatan || fields.notes || "-";

      const previewText = [
        `${WA_LABEL.ai} Preview`,
        ``,
        `Saya membaca rencana tambah referensi desain:`,
        ``,
        `Scope: ${scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase()}`,
        isAcara ? `Acara: ${eventObj ? eventObj.name : fields.acara}` : null,
        isDivisi ? `Divisi: ${fields.divisi}` : null,
        `Tahun: ${tahun}`,
        `Judul: ${judul}`,
        `Jenis: ${jenis}`,
        driveLinks.length > 0 ? `Link Drive: ${driveLinks.join(", ")}` : null,
        canvaLinks.length > 0 ? `Link Canva: ${canvaLinks.join(", ")}` : null,
        docLinks.length > 0 ? `Link Docs: ${docLinks.join(", ")}` : null,
        otherLinks.length > 0 ? `Link Lain: ${otherLinks.join(", ")}` : null,
        warna !== "-" ? `Warna: ${warna}` : null,
        arahanVisual !== "-" ? `Arahan visual: ${arahanVisual}` : null,
        catatan !== "-" ? `Catatan: ${catatan}` : null,
        ``,
        `Status validasi:`,
        ...validations,
        getSenderWarning(),
        ``,
        `Preview ini belum disimpan ke database.`
      ]
        .filter((line) => line !== null)
        .join("\\n");

      return { isValid, previewText };
    }

    default: {
      return {
        isValid: false,
        previewText: `${WA_LABEL.ai} Preview\\n\\nCommand tidak dikenal atau gagal diproses.`,
      };
    }
  }
}
