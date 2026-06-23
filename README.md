# JobDex.in

## Overview

JobDex.in adalah aplikasi web manajemen job desk untuk organisasi mahasiswa, khususnya divisi Humas dan Media Kreatif/Pubdok. Aplikasi ini membantu tim mencatat anggota, acara, job desk divisi, job desk acara, workflow pengerjaan, upload hasil desain, arsip referensi, notifikasi WhatsApp, dan ringkasan progress berbasis AI.

## Main Features

- Firebase Authentication email/password.
- Role system: `super_admin`, `koordinator_divisi`, `koordinator_acara`, `anggota`.
- Manajemen anggota, termasuk edit role dan soft deactivate.
- Manajemen acara dan event members.
- Manajemen job desk divisi dan acara.
- Workflow task: update status, stuck/butuh bantuan, revisi, approve, activity log.
- Upload hasil desain ke Cloudinary.
- Notifikasi otomatis ke WhatsApp group lewat Wablas.
- WhatsApp inbound AI bot dengan trigger `!jobdex`.
- Arsip referensi desain.
- Gemini AI Assistant dengan chat history dari Firestore.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firestore
- Firebase Admin SDK
- Cloudinary
- Wablas / WA-blast
- Google Gemini API
- ESLint

## Project Structure

```txt
src/
  app/
    api/
      ai/
      notifications/
      uploads/
      webhooks/
    dashboard/
      ai/
      events/
      members/
      references/
      tasks/
  components/
    ai/
    auth/
    dashboard/
    events/
    layout/
    members/
    references/
    setup/
    tasks/
    ui/
  contexts/
  hooks/
  lib/
    firebase/
    server/
  types/
```

## Environment Variables

Salin `.env.example` ke `.env.local`, lalu isi value yang dibutuhkan. Jangan commit `.env.local`.

```env
# APP
NEXT_PUBLIC_APP_NAME=JobDex.in
NEXT_PUBLIC_APP_URL=http://localhost:3000

# FIREBASE CLIENT
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# FIREBASE ADMIN - SERVER ONLY
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# CLOUDINARY - SERVER ONLY
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# WABLAS / WA-BLAST - SERVER ONLY
WABLAS_API_URL=
WABLAS_API_TOKEN=
WABLAS_SECRET_KEY=
WABLAS_DEVICE_ID=
WABLAS_DEVICE_PHONE=6287798799068
WABLAS_DEFAULT_GROUP_ID=
WABLAS_ALLOWED_GROUP_IDS=
WABLAS_WEBHOOK_SECRET=
WABLAS_MIN_SEND_INTERVAL_SECONDS=60
WABLAS_RATE_LIMIT_COOLDOWN_MINUTES=60
WABLAS_MAX_SENDS_PER_HOUR=25

# GEMINI - SERVER ONLY
GEMINI_API_KEY=
AI_DAILY_LIMIT=50

# CRON
CRON_SECRET=
```

## Firebase Setup

1. Buat Firebase project.
2. Aktifkan Firebase Authentication Email/Password.
3. Buat Firestore Database.
4. Isi Firebase client env di `.env.local`.
5. Isi Firebase Admin env untuk API route server-side.
6. Register user pertama dari aplikasi.
7. Di Firestore Console, ubah role user pertama menjadi `super_admin`.

## Firestore Rules Setup

Rules tersedia di `firestore.rules`.

Cara publish:

1. Buka Firebase Console.
2. Masuk Firestore Database.
3. Buka tab `Rules`.
4. Salin isi `firestore.rules`.
5. Klik `Publish`.

Rules MVP menutup client write untuk `whatsapp_logs` dan `ai_logs`. Kedua collection itu ditulis oleh server API memakai Firebase Admin SDK.

## Cloudinary Setup

1. Buat akun Cloudinary.
2. Ambil `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET`.
3. Isi env server-side.
4. Upload hasil desain dilakukan lewat `POST /api/uploads/task-result`.
5. File yang didukung: JPG, JPEG, PNG, WEBP maksimal 10MB.

Cloudinary preview memakai `next/image` dan domain `res.cloudinary.com` sudah diizinkan di `next.config.ts`.

## Wablas Setup

1. Isi `WABLAS_API_URL`, `WABLAS_API_TOKEN`, `WABLAS_SECRET_KEY`, `WABLAS_DEVICE_ID`, `WABLAS_DEVICE_PHONE` (nomor bot/device), `WABLAS_DEFAULT_GROUP_ID`, dan `WABLAS_ALLOWED_GROUP_IDS`.
2. Pastikan group id valid.
3. Sistem mengirim notifikasi status, upload, revisi, approve, dan ringkasan AI ke WhatsApp group default.
4. Log tersimpan di `whatsapp_logs`.

Payload group memakai `isGroup: "true"` agar Wablas memproses sebagai group message.

Untuk mencegah nomor WhatsApp terblokir atau dibatasi (Error 463), atur juga parameter pengaman berikut:
- `WABLAS_MIN_SEND_INTERVAL_SECONDS`: Jeda minimal (dalam detik) antar pengiriman pesan global untuk menghindari burst.
- `WABLAS_RATE_LIMIT_COOLDOWN_MINUTES`: Durasi cooldown (dalam menit) penghentian pengiriman otomatis jika terdeteksi Error 463.
- `WABLAS_MAX_SENDS_PER_HOUR`: Batas aman maksimum jumlah pengiriman pesan per jam.

## WhatsApp Provider Setup

JobDex.in supports multiple WhatsApp providers:
- Wablas
- FONNTE

Use `WHATSAPP_PROVIDER=fonnte` to send via FONNTE.
Use `WHATSAPP_PROVIDER=wablas` to send via Wablas.

### Group Configuration
We support provider-neutral group ID format and allowlist:
- `WHATSAPP_ALLOWED_GROUP_IDS`: Comma-separated list of allowed group IDs. For FONNTE, they are automatically normalized to suffix `@g.us` (e.g. `120363...@g.us`). For Wablas, they are format-stripped to numbers-only automatically.
- `WHATSAPP_DEFAULT_GROUP_ID`: The default group ID to route general notifications and daily digests.

### FONNTE Setup
1. Create FONNTE account.
2. Get API token.
3. Set environment variables in `.env.local` and Vercel.
4. Test send with provided test API `POST /api/debug/whatsapp/send-test`.

### Troubleshooting
- Check `WHATSAPP_ENABLED`
- Check `WHATSAPP_PROVIDER`
- Check provider token
- Check target/group id
- Check `whatsapp_logs`
- Check cron logs

## Wablas Webhook Setup

Webhook inbound AI bot tersedia di:

```txt
POST /api/webhooks/wablas/gemini
```

Gunakan query secret:

```txt
https://domain-kamu.com/api/webhooks/wablas/gemini?secret=ISI_SECRET
```

Development local membutuhkan tunnel seperti ngrok atau Cloudflare Tunnel:

```txt
https://xxxx.ngrok-free.app/api/webhooks/wablas/gemini?secret=ISI_SECRET
```

Di Wablas Device Setting:

1. Isi webhook URL.
2. Aktifkan `Get Incoming Message`.
3. Aktifkan `Get Webhook` jika dibutuhkan device.
4. Kirim pesan ke group dengan prefix:

```txt
!jobdex siapa yang stuck?
```

Pesan tanpa prefix `!jobdex` akan diabaikan.

## Gemini AI Setup

1. Isi `GEMINI_API_KEY`.
2. Atur `AI_DAILY_LIMIT`, default fallback adalah 20 jika kosong atau invalid.
3. AI web tersedia di `/dashboard/ai` untuk super admin dan koordinator.
4. Query dan jawaban tersimpan di `ai_logs`.
5. Data yang dikirim ke Gemini sudah diringkas dan tidak menyertakan secret, token, nomor WhatsApp anggota, email pribadi, UID mentah, atau raw response Wablas.

## Local Development

Install dependency:

```bash
npm install
```

Jalankan dev server:

```bash
npm run dev
```

Buka:

```txt
http://localhost:3000
```

Validasi:

```bash
npm run lint
npm run build
```

## Deployment to Vercel

1. Push repo ke Git provider.
2. Import project di Vercel.
3. Isi seluruh environment variables production.
4. Pastikan `NEXT_PUBLIC_APP_URL` memakai URL production.
5. Deploy.
6. Publish Firestore rules terbaru.
7. Update webhook Wablas ke URL production:

```txt
https://jobdex-in.vercel.app/api/webhooks/wablas/gemini?secret=ISI_SECRET
```

## Manual Testing Checklist

### Auth

- [ ] Register.
- [ ] Login.
- [ ] Logout.
- [ ] Forgot password.
- [ ] Protected route redirect ke login.

### Role

- [ ] Super admin bisa akses semua menu.
- [ ] Koordinator divisi bisa akses anggota, acara, task, referensi, AI.
- [ ] Koordinator acara bisa akses acara/task relevan, referensi, AI.
- [ ] Anggota tidak bisa akses members/settings/AI.
- [ ] User `is_active: false` diarahkan ke unauthorized.

### Members

- [ ] List anggota tampil.
- [ ] Search/filter bekerja.
- [ ] Edit role oleh super admin.
- [ ] Nonaktifkan anggota.

### Events

- [ ] Tambah acara.
- [ ] Edit acara.
- [ ] Tambah anggota acara.
- [ ] Hapus anggota acara.

### Tasks

- [ ] Tambah task divisi.
- [ ] Tambah task acara.
- [ ] Edit task.
- [ ] Archive task.
- [ ] Detail task.
- [ ] Filter task.

### Workflow

- [ ] Update status sebagai PIC.
- [ ] Tandai stuck/butuh bantuan.
- [ ] Minta revisi.
- [ ] Approve.
- [ ] Activity log bertambah.

### Upload

- [ ] Upload gambar valid.
- [ ] Tolak file invalid.
- [ ] Preview Cloudinary tampil.
- [ ] Riwayat upload bertambah.
- [ ] Status menjadi menunggu approval.

### WhatsApp

- [ ] Notifikasi status.
- [ ] Notifikasi upload.
- [ ] Notifikasi revisi.
- [ ] Notifikasi approve.
- [ ] Cek `whatsapp_logs`.

### AI

- [ ] AI web menjawab.
- [ ] Chat history tetap ada setelah refresh.
- [ ] Kirim jawaban AI ke WhatsApp.
- [ ] Bot WhatsApp `!jobdex`.
- [ ] Cek `ai_logs`.

### References

- [ ] Tambah referensi.
- [ ] Edit referensi.
- [ ] Archive referensi.
- [ ] Search/filter referensi.

## Troubleshooting

### Firebase Auth

- Pastikan Email/Password provider aktif.
- Pastikan env Firebase client benar.
- Jika dashboard tidak terbuka, cek dokumen `users/{uid}` dan field `is_active`.

### Firestore Rules

- Jika data gagal dibaca/ditulis, publish ulang `firestore.rules`.
- Pastikan role user sudah benar.
- Jangan ubah rules menjadi `allow read, write: if true`.

### Cloudinary Upload

- Pastikan env Cloudinary server-side terisi.
- Pastikan file JPG/PNG/WEBP dan ukuran maksimal 10MB.
- Pastikan API route upload berjalan di environment server.

### Wablas Notification

- Pastikan group id valid.
- Pastikan payload report Wablas bertipe Group.
- Pastikan token/secret benar.
- Cek `whatsapp_logs` untuk status `sent` atau `failed`.

### Wablas Webhook

- Localhost butuh ngrok atau Cloudflare Tunnel.
- Pastikan query `secret` sama dengan `WABLAS_WEBHOOK_SECRET`.
- Pastikan incoming message dimulai dengan `!jobdex`.
- Pastikan payload mengandung group id/phone/from yang terdaftar di `WABLAS_ALLOWED_GROUP_IDS`.

### Gemini AI

- Pastikan `GEMINI_API_KEY` terisi.
- Jika rate limit tercapai, naikkan `AI_DAILY_LIMIT` lalu restart server.
- Jika AI tidak punya data, pastikan task/event/referensi sudah ada.

### Vercel Env

- Isi semua env production.
- Redeploy setelah mengubah env.
- Jangan memakai `NEXT_PUBLIC_` untuk secret server-side.

## Security Notes

- `.env.local` tidak boleh di-track Git.
- Token Wablas tidak tampil di UI/log.
- Cloudinary secret tidak tampil di UI/log.
- Gemini API key tidak tampil di UI/log.
- Firebase Admin private key tidak tampil di UI/log.
- Client tidak menulis langsung ke `whatsapp_logs`.
- Client tidak menulis langsung ke `ai_logs`.
- Firestore rules tidak memakai `allow read, write: if true`.
- Webhook Wablas dilindungi `WABLAS_WEBHOOK_SECRET`.

## MVP Limitations

- Belum ada Google Drive API automation.
- Belum ada PDF/video upload.
- Belum ada mobile app.
- Belum ada multi organisasi penuh.
- Belum ada cron reminder deadline.
- Belum ada analytics kompleks.
- Thumbnail referensi desain masih URL manual dari host bebas.

## Future Improvements

- Google Drive API integration.
- Deadline reminder otomatis.
- Multi-organization support.
- Rich analytics dashboard.
- Upload referensi desain ke Cloudinary.
- Multi-assignee task.
- Notification retry queue.

## Fase 12C — WhatsApp Command Execution dengan Preview ID + PIN Konfirmasi

Pada Fase 12C, asisten WhatsApp AI `!jobdex` dikembangkan dari yang sebelumnya asisten baca/preview saja menjadi bot yang mampu mengeksekusi perintah terstruktur secara aman ke database Firestore. Alur ini dirancang menggunakan sistem otorisasi **Preview ID + PIN Konfirmasi**.

### Cara Kerja Alur

1. **Pembuatan Preview**:
   - Pengguna mengirim perintah terstruktur, contoh:
     ```txt
     !jobdex tambah jobdesk
     tipe: divisi
     judul: Desain Poster HUT
     pic: Sumesta C
     deadline: 15 Juni 2026
     prioritas: tinggi
     deskripsi: Buat desain poster HUT RI ke-81
     ```
   - Bot menganalisis, memvalidasi input, dan mengembalikan teks preview beserta kode unik 6 karakter (`Preview ID`):
     ```txt
     [JobDex.in AI Preview]
     ...
     Preview ID: XY97R2
     Untuk menyimpan ke database, balas:
     !jobdex konfirmasi XY97R2 pin: 123456
     ```
   - Status preview disimpan ke Firestore collection `ai_command_previews` dengan status `pending` dan kedaluwarsa dalam 30 menit.

2. **Konfirmasi Eksekusi**:
   - Pengguna mengirim konfirmasi dengan PIN akunnya:
     ```txt
     !jobdex konfirmasi XY97R2 pin: 123456
     ```
   - Sistem mencari dokumen preview, memvalidasi kecocokan PIN dengan field `whatsapp_command_pin` di Firestore `users`, memvalidasi batasan peran/role (koordinator/super_admin), dan melakukan penulisan database.
   - Setelah sukses, status diubah menjadi `confirmed` dan bot membalas dengan visual status tugas baru.

3. **Pembatalan Tindakan**:
   - Pengguna membatalkan rencana tindakan:
     ```txt
     !jobdex batal XY97R2 pin: 123456
     ```
   - Sistem memvalidasi PIN dan mengubah status dokumen preview menjadi `cancelled` tanpa menulis data apa pun ke database tugas.

### Cara Pengaturan PIN Pengguna

Super Admin dapat mengatur PIN WhatsApp Command Anggota secara langsung dari dashboard web:
1. Masuk ke halaman **Manajemen Anggota** (`/dashboard/members`).
2. Klik tombol **Edit** pada anggota yang dituju.
3. Masukkan 6 digit angka di kolom **PIN Perintah WhatsApp**.
4. Klik **Simpan Perubahan**. PIN akan tersimpan secara aman di dokumen user Firestore pada properti `whatsapp_command_pin`.

### Catatan Keamanan Penting (Security Features)
- **Log Sensor PIN**: Seluruh modul logs (`wablas_incoming_debug`, `whatsapp_logs`, `ai_logs`, dan `ai_command_previews`) dilengkapi parser sanitasi otomatis `sanitizePinFromMessage`. Setiap teks yang memuat pola `pin: <PIN>` akan disensor menjadi `pin: [STRIPPED]` sebelum disimpan ke database, menjamin tidak ada kebocoran PIN.
- **Batasan Peran (Permissions)**:
  - `super_admin`: Eksekusi bebas atas seluruh jenis command.
  - `koordinator_divisi`: Eksekusi tugas divisi dan acara baru.
  - `koordinator_acara`: Hanya diperbolehkan membuat tugas acara **khusus untuk acara yang ia koordinasikan sendiri**.
  - `anggota`: Hak akses eksekusi ditolak penuh.
- **Integritas Bulk (All-or-Nothing)**: Pembuatan banyak tugas sekaligus (bulk) akan divalidasi seluruh barisnya terlebih dahulu. Jika ditemukan 1 kesalahan data (misalnya nama PIC tidak dikenal), sistem membatalkan seluruh rangkaian tugas tersebut agar database tugas tetap konsisten.

## Fase 19B — WhatsApp Task Workflow Commands Tanpa PIN Berbasis Sender Identity + Role

Pada Fase 19B, autentikasi berbasis PIN 4-digit dihapus karena faktor keamanan dan kepraktisan. Sebagai gantinya, otorisasi dialihkan sepenuhnya menggunakan **Identitas Pengirim WhatsApp (Sender JID) yang dicocokkan ke user database + Sistem Akses Kontrol Berbasis Peran (RBAC)**.

### Alur Kerja Baru Tanpa PIN
1. Nomor WhatsApp pengirim dideteksi melalui header/group.sender dari payload Wablas.
2. Bot mencocokkan nomor tersebut ke dokumen di collection `users` Firestore.
3. Jika tidak terhubung dengan akun JobDex.in mana pun, perintah write/read dibatalkan secara terpusat dan pengguna menerima petunjuk pendaftaran.
4. Jika terhubung, bot mengambil profil pengguna dan memvalidasi izin akses sesuai matriks peran (RBAC) sebelum menjalankan perintah.

### Matriks Akses Peran (RBAC)
- **Super Admin**: Akses penuh ke seluruh tindakan dan tugas.
- **Koordinator Divisi**: Akses penuh mengelola tugas divisi terkait (`type === "divisi" && division_id === user.division_id`).
- **Koordinator Acara**: Akses penuh mengelola tugas acara terkait (`type === "acara" && coordinator_id === user.id`).
- **Anggota (PIC)**: Hanya boleh melihat (`view`), mengubah status (`update_status`), checklist, upload hasil (`upload_hasil`), dan menambah catatan (`tambah_catatan`) untuk tugas di mana ia terdaftar sebagai PIC (`pic_id === user.id`). Tidak diizinkan menyetujui (`approve`), meminta revisi, mengubah detail administratf, mengganti PIC, atau mengarsipkan tugas.

### Daftar Perintah Baru yang Ditambahkan
- `!jobdex tugas saya` (menampilkan daftar tugas aktif pengguna).
- `!jobdex detail task <Nama Task>` (menampilkan informasi lengkap tugas, checklist, dan catatan).
- `!jobdex upload hasil <Nama Task> link: <URL> catatan: <Catatan>` (mengirimkan link hasil pekerjaan untuk di-review koordinator).
- `!jobdex minta revisi <Nama Task> catatan: <Catatan>` (meminta perbaikan atas hasil pekerjaan).
- `!jobdex cek checklist <Nama Task>` (menampilkan status checklist tugas).
- `!jobdex tambah catatan <Nama Task> catatan: <Catatan>` (menambahkan catatan status log pengerjaan tugas).
- `!jobdex ganti pic <Nama Task> ke <Nama Anggota>` (mengubah PIC pelaksana tugas).
- `!jobdex bantuan` (panduan perintah baru tanpa format PIN).

## Fase 19C — WhatsApp Group Routing, Approval Attribution, dan DeepSeek AI Provider

Pada Fase 19C, sistem JobDex.in ditingkatkan untuk mengatasi masalah atribusi persetujuan (approval attribution), perutean pengingat ke grup WhatsApp acara (event group routing), serta integrasi AI provider hemat token (DeepSeek).

### 1. Perbaikan Bug Atribusi Persetujuan (Approval Attribution)
Sebelumnya, setiap persetujuan (approval) yang dilakukan via WhatsApp tercatat atas nama Super Admin secara default. Diperbaiki agar:
- Sistem mendeteksi profil asli pelaku (`actorProfile`) dari nomor pengirim WhatsApp.
- Menyimpan detail pelaku pada field tugas: `approved_by = actorProfile.id`, `approved_by_name = actorProfile.name`, dan `approved_by_role = actorProfile.role`.
- Menulis status log dengan field `changed_by_id`, `changed_by_name`, `changed_by_role`, dan `source: "whatsapp_command"`.

### 2. WhatsApp Group Routing & Pengingat Acara
Sistem pengingat (cron digest) kini mendukung perutean tugas ke grup WhatsApp khusus masing-masing acara dengan fallback berantai:
- **Prioritas 1**: Dikirim ke grup khusus acara (`whatsapp_group_id` pada dokumen event).
- **Prioritas 2**: Dikirim ke grup divisi terkait (jika ada).
- **Prioritas 3**: Dikirim ke grup default organisasi (`WABLAS_DEFAULT_GROUP_ID`).
- **Skip**: Jika tidak ada target grup yang valid, tugas dilewati dengan alasan `missing_group_target`.

**Command WhatsApp Baru untuk Manajemen Grup:**
- `!jobdex cek grup`: Menampilkan ID grup WhatsApp saat ini, nama grup, status keterhubungan, dan acara/divisi yang terhubung.
- `!jobdex event grup`: Menampilkan daftar acara yang telah terhubung ke grup WhatsApp khusus.
- `!jobdex hubungkan grup acara <Nama Acara>`: Menghubungkan grup WhatsApp saat ini ke acara tertentu (hanya dapat dieksekusi oleh Super Admin, Koordinator Acara terkait, atau Koordinator Divisi terkait).

### 3. Integrasi DeepSeek AI Provider Hemat Token
Aplikasi mendukung penggunaan DeepSeek API sebagai penyedia AI alternatif selain Gemini dengan fitur penghematan token:
- **Strategi Hemat**: Pembatasan panjang konteks maksimal (`AI_MAX_CONTEXT_CHARS`), pencarian referensi via database Firestore (tidak dikirim ke AI), caching respons AI di Firestore (`ai_cache`), dan penggunaan model hemat token default.
- **Usage Logging**: Menyimpan log penggunaan token ke Firestore collection `ai_usage_logs` untuk melacak provider, status cache hit, dan tokens.
