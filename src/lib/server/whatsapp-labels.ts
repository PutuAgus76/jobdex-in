/**
 * Centralized WhatsApp message label constants.
 *
 * Menggunakan *JobdexIn* (bold, tanpa titik) agar WhatsApp tidak membaca
 * nama brand sebagai link/domain yang tidak dikenal.
 *
 * Jangan gunakan "JobDex.in" secara langsung di dalam pesan WhatsApp.
 * Selalu gunakan konstanta dari file ini.
 */

/** Base bot label (bold, WhatsApp-safe) */
export const WA_BOT_LABEL = "*JobdexIn*";

/** Header siap pakai untuk berbagai tipe pesan WhatsApp bot */
export const WA_LABEL = {
  /** [*JobdexIn* AI] – Untuk balasan AI assistant */
  ai: `[${WA_BOT_LABEL} AI]`,

  /** [*JobdexIn* Reminder] – Reminder deadline biasa */
  reminder: `[${WA_BOT_LABEL} Reminder]`,

  /** [*JobdexIn* Digest Reminder] – Rekap digest harian */
  digestReminder: `[${WA_BOT_LABEL} Digest Reminder]`,

  /** [*JobdexIn* Warning] – Peringatan mendesak (H-3, H-1, Hari-H) */
  warning: `[${WA_BOT_LABEL} Warning]`,

  /** [*JobdexIn* Overdue] – Task sudah lewat deadline */
  overdue: `[${WA_BOT_LABEL} Overdue]`,

  /** [*JobdexIn* Reminder Pribadi] – Pesan ke PIC secara personal */
  reminderPribadi: `[${WA_BOT_LABEL} Reminder Pribadi]`,

  /** [*JobdexIn* Akses Ditolak] – Akses tidak diizinkan */
  accessDenied: `[${WA_BOT_LABEL} Akses Ditolak]`,

  /** [*JobdexIn* Auth] – Autentikasi/identitas sender */
  auth: `[${WA_BOT_LABEL} Auth]`,

  /** [*JobdexIn* Bantuan] – Pesan bantuan command */
  bantuan: `[${WA_BOT_LABEL} Bantuan]`,

  /** [*JobdexIn* Debug Pengirim] – Debug info pengirim */
  debugPengirim: `[${WA_BOT_LABEL} Debug Pengirim]`,

  /** [*JobdexIn* Debug Grup] – Debug info grup */
  debugGrup: `[${WA_BOT_LABEL} Debug Grup]`,

  /** [*JobdexIn* Cek Role] – Info role pengirim */
  cekRole: `[${WA_BOT_LABEL} Cek Role]`,

  /** [*JobdexIn* Grup Acara] – Info/manajemen grup acara */
  grupAcara: `[${WA_BOT_LABEL} Grup Acara]`,

  /** [*JobdexIn* Deadline] – Hasil pencarian deadline */
  deadline: `[${WA_BOT_LABEL} Deadline]`,

  /** [*JobdexIn* Task] – Info/operasi task */
  task: `[${WA_BOT_LABEL} Task]`,

  /** [*JobdexIn* Approval] – Approve/revisi task */
  approval: `[${WA_BOT_LABEL} Approval]`,

  /** [*JobdexIn* Status] – Update status task */
  status: `[${WA_BOT_LABEL} Status]`,

  /** [*JobdexIn* Edit Task] – Edit detail task */
  editTask: `[${WA_BOT_LABEL} Edit Task]`,

  /** [*JobdexIn* Preview Edit Task] – Preview sebelum edit */
  previewEditTask: `[${WA_BOT_LABEL} Preview Edit Task]`,

  /** [*JobdexIn* Confirm Edit] – Konfirmasi edit */
  confirmEdit: `[${WA_BOT_LABEL} Confirm Edit]`,

  /** [*JobdexIn* Cancel Edit] – Batal edit */
  cancelEdit: `[${WA_BOT_LABEL} Cancel Edit]`,

  /** [*JobdexIn* Archive] – Pengarsipan task */
  archive: `[${WA_BOT_LABEL} Archive]`,

  /** [*JobdexIn* Preview Archive] – Preview sebelum arsip */
  previewArchive: `[${WA_BOT_LABEL} Preview Archive]`,

  /** [*JobdexIn* Confirm Archive] – Konfirmasi arsip */
  confirmArchive: `[${WA_BOT_LABEL} Confirm Archive]`,

  /** [*JobdexIn* Checklist] – Update checklist task */
  checklist: `[${WA_BOT_LABEL} Checklist]`,

  /** [*JobdexIn* Tugas Saya] – Daftar tugas PIC */
  tugasSaya: `[${WA_BOT_LABEL} Tugas Saya]`,

  /** [*JobdexIn* Detail Task] – Detail satu task */
  detailTask: `[${WA_BOT_LABEL} Detail Task]`,

  /** [*JobdexIn* Upload Hasil] – Upload hasil desain */
  uploadHasil: `[${WA_BOT_LABEL} Upload Hasil]`,

  /** [*JobdexIn* Minta Revisi] – Permintaan revisi */
  mintaRevisi: `[${WA_BOT_LABEL} Minta Revisi]`,

  /** [*JobdexIn* Cek Checklist] – Cek checklist task */
  cekChecklist: `[${WA_BOT_LABEL} Cek Checklist]`,

  /** [*JobdexIn* Tambah Catatan] – Tambah catatan task */
  tambahCatatan: `[${WA_BOT_LABEL} Tambah Catatan]`,

  /** [*JobdexIn* Ganti PIC] – Ganti PIC task */
  gantiPic: `[${WA_BOT_LABEL} Ganti PIC]`,

  /** [*JobdexIn* Briefing] – Briefing koordinator */
  briefing: `[${WA_BOT_LABEL} Briefing]`,

  /** [*JobdexIn* Siapa Belum Update] – List anggota belum update */
  siapaBelumUpdate: `[${WA_BOT_LABEL} Siapa Belum Update]`,
} as const;

/** Teks dashboard – gunakan sebagai link ke dashboard jika ingin menyebut platform */
export const WA_DASHBOARD_TEXT = "dashboard JobdexIn";
