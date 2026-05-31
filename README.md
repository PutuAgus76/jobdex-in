# JobDex.in

JobDex.in adalah aplikasi web manajemen job desk untuk divisi Humas dan Media Kreatif organisasi mahasiswa. Fase 1 berisi fondasi project, layout awal, halaman placeholder, dan komponen UI dasar.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint

## Menjalankan Project

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka aplikasi di:

```txt
http://localhost:3000
```

Build production:

```bash
npm run build
```

Jalankan hasil build:

```bash
npm run start
```

Lint project:

```bash
npm run lint
```

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi value sesuai kebutuhan pada fase integrasi berikutnya.

```bash
cp .env.example .env.local
```

Pada Fase 1, integrasi Firebase, Cloudinary, Wablas, dan Gemini belum digunakan sehingga value boleh tetap kosong.

## Route Fase 1

- `/` - Landing page publik JobDex.in
- `/login` - Login email/password dengan Firebase Authentication
- `/register` - Register email/password dan pembuatan profil user di Firestore
- `/forgot-password` - Kirim email reset password
- `/dashboard` - Dashboard protected sederhana
- `/dashboard/tasks` - Placeholder daftar job desk
- `/dashboard/events` - Placeholder daftar acara
- `/dashboard/members` - Placeholder manajemen anggota
- `/dashboard/references` - Placeholder arsip referensi desain
- `/dashboard/settings` - Placeholder pengaturan

## Auth Fase 2

Fase 2 menggunakan Firebase Client SDK modular untuk register, login, logout, forgot password, dan penyimpanan profil user baru ke collection `users`.

User baru disimpan dengan role default `anggota`, `organization_id` bernilai `main_org`, dan `division_id` bernilai `humas_media_kreatif`.

Dashboard menggunakan guard client-side sederhana:

- User belum login yang membuka `/dashboard` diarahkan ke `/login`.
- User yang sudah login dan membuka `/login` atau `/register` diarahkan ke `/dashboard`.

## Role dan Profile Fase 3

Role dasar:

- `super_admin`
- `koordinator_divisi`
- `koordinator_acara`
- `anggota`

User register tetap dibuat sebagai `anggota`. Dashboard mengambil Firebase user dan dokumen Firestore `users/{uid}` melalui AuthProvider. Jika user sudah login tetapi dokumen profile belum ada atau belum lengkap, user diarahkan ke `/dashboard/complete-profile`.

Route tambahan:

- `/dashboard/profile` - melihat profile user dari Firestore
- `/dashboard/complete-profile` - membuat atau melengkapi dokumen profile user
- `/dashboard/unauthorized` - placeholder akses ditolak

## Setup Data Awal Firestore

Buat collection dan document berikut secara manual di Firebase Console.

Collection `organizations`, document ID `main_org`:

```json
{
  "id": "main_org",
  "name": "JobDex.in Organization",
  "slug": "jobdex-main",
  "whatsapp_group_id": "",
  "logo_url": "",
  "created_at": "server timestamp",
  "updated_at": "server timestamp"
}
```

Collection `divisions`, document ID `humas_media_kreatif`:

```json
{
  "id": "humas_media_kreatif",
  "organization_id": "main_org",
  "name": "Humas dan Media Kreatif",
  "description": "Divisi publikasi, dokumentasi, desain, dan media kreatif.",
  "coordinator_id": "",
  "created_at": "server timestamp",
  "updated_at": "server timestamp"
}
```

Di Firestore Console, gunakan tipe `timestamp` untuk field `created_at` dan `updated_at`.

## Menjadikan User Pertama Super Admin

Setelah register user pertama:

1. Buka Firebase Console.
2. Masuk ke Firestore Database.
3. Buka collection `users`.
4. Pilih document dengan ID UID user pertama.
5. Ubah field `role` dari `anggota` menjadi `super_admin`.
6. Pastikan field `is_active` bernilai `true`.

Jangan lakukan perubahan role dari frontend pada fase ini.

## Dashboard dan Setup Fase 4

Fase 4 menambahkan navigasi dashboard berdasarkan role, summary card awal dari Firestore, halaman setup data awal, role badge, empty state, loading state, dan route guard berbasis permission.

Route tambahan:

- `/dashboard/ai` - placeholder AI Assistant untuk super admin dan koordinator
- `/dashboard/setup` - initial data bootstrap khusus super admin

Menu berdasarkan role:

- Semua user: Dashboard, Job Desk/Job Desk Saya, Referensi, Profile
- Super Admin: semua menu termasuk Anggota, AI Assistant, Setup, Pengaturan
- Koordinator Divisi: Job Desk, Acara, Anggota, Referensi, AI Assistant, Profile
- Koordinator Acara: Job Desk, Acara, Referensi, AI Assistant, Profile
- Anggota: Dashboard, Job Desk Saya, Referensi, Profile

## Initial Data Bootstrap

Untuk membuat data awal dari aplikasi:

1. Login sebagai user dengan role `super_admin`.
2. Buka `/dashboard/setup`.
3. Periksa status `organizations/main_org` dan `divisions/humas_media_kreatif`.
4. Klik `Buat Data Awal JobDex.in`.
5. Jika sukses, kedua status akan menjadi `Ada`.

Aksi ini idempotent. Jika dokumen sudah ada, aplikasi tidak membuat duplikat.

## Firestore Security Rules

Rules awal tersedia di:

```txt
firestore.rules
```

Cara memasang lewat Firebase Console:

1. Buka Firebase Console.
2. Pilih project `jobdex-in`.
3. Masuk ke Firestore Database.
4. Buka tab `Rules`.
5. Salin isi `firestore.rules`.
6. Paste ke editor Rules.
7. Klik `Publish`.

Rules fase ini mengizinkan:

- User login membaca data utama.
- User membuat profile sendiri saat register dengan role default `anggota`.
- User membaca dan update profile sendiri tanpa mengubah role.
- Super admin dan koordinator divisi membaca daftar user.
- Super admin membuat/update `organizations/main_org` dan `divisions/humas_media_kreatif`.
- CRUD task, event, referensi, upload, WhatsApp log, dan AI log masih dibatasi.

## Manajemen Anggota Fase 5

Halaman `/dashboard/members` tersedia untuk:

- `super_admin`
- `koordinator_divisi`

Fitur yang tersedia:

- Melihat daftar anggota dari collection `users`
- Search berdasarkan nama atau email
- Filter berdasarkan role
- Filter berdasarkan status aktif/nonaktif
- Filter berdasarkan division ID
- Detail anggota
- Edit nama, nomor WhatsApp, role, divisi, dan status aktif
- Soft deactivate dengan field `is_active: false`

Catatan akses:

- Super admin bisa mengubah role semua anggota.
- Koordinator divisi tidak bisa mengubah role pada fase ini.
- Koordinator divisi tidak bisa mengedit atau menonaktifkan user dengan role `super_admin`.
- Tidak ada delete permanen user.
- User dengan `is_active: false` diarahkan ke `/dashboard/unauthorized`.

Cara test sebagai super admin:

1. Login dengan user role `super_admin`.
2. Buka `/dashboard/members`.
3. Pastikan tabel anggota tampil.
4. Coba search, filter role, filter status, dan filter divisi.
5. Klik `Detail` untuk melihat data anggota.
6. Klik `Edit`, ubah role/status/divisi/nomor WhatsApp, lalu simpan.

Cara test sebagai koordinator divisi:

1. Ubah role user test menjadi `koordinator_divisi`.
2. Login dan buka `/dashboard/members`.
3. Pastikan halaman dapat diakses.
4. Coba edit nama, nomor WhatsApp, divisi, atau status anggota non-super-admin.
5. Pastikan role select terkunci.

Cara test sebagai anggota biasa atau koordinator acara:

1. Login sebagai `anggota` atau `koordinator_acara`.
2. Buka `/dashboard/members`.
3. Aplikasi akan mengarahkan ke `/dashboard/unauthorized`.

Cara test nonaktifkan anggota:

1. Login sebagai super admin.
2. Buka `/dashboard/members`.
3. Klik `Nonaktifkan` pada anggota lain.
4. Login sebagai anggota tersebut.
5. Setelah masuk dashboard, user diarahkan ke `/dashboard/unauthorized`.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar edit anggota bekerja.

## Manajemen Acara Fase 6

Halaman `/dashboard/events` tersedia untuk:

- `super_admin`
- `koordinator_divisi`
- `koordinator_acara`

Anggota biasa belum mendapat akses penuh ke manajemen acara. Jika anggota membuka `/dashboard/events`, aplikasi menampilkan placeholder bahwa acara yang melibatkan mereka akan tersedia pada fase berikutnya.

Fitur yang tersedia:

- Melihat daftar acara dari collection `events`
- Search acara berdasarkan nama
- Filter status acara
- Filter tanggal sederhana: semua, akan datang, sudah lewat
- Tambah acara
- Edit acara
- Ubah status acara melalui form edit
- Detail acara di `/dashboard/events/[eventId]`
- Tambah anggota acara dari collection `users`
- Hapus anggota dari acara
- Event member disimpan di `events/{eventId}/event_members/{userId}` agar tidak duplikat
- Progress acara menampilkan field `progress_percentage`, default `0`

Cara test sebagai super admin:

1. Login sebagai `super_admin`.
2. Buka `/dashboard/events`.
3. Klik `Tambah Acara`.
4. Isi nama, deskripsi, tanggal, koordinator, dan status.
5. Simpan, lalu buka detail acara.
6. Tambah dan hapus anggota acara.

Cara test sebagai koordinator divisi:

1. Login sebagai `koordinator_divisi`.
2. Buka `/dashboard/events`.
3. Buat atau edit acara.
4. Buka detail acara dan kelola anggota acara.

Cara test sebagai koordinator acara:

1. Login sebagai `koordinator_acara`.
2. Buka `/dashboard/events`.
3. Buat acara baru dengan koordinator dirinya sendiri.
4. Pastikan hanya acara yang dia koordinasi yang tampil.
5. Buka detail acara dan kelola anggota acara pada acara tersebut.

Cara test sebagai anggota biasa:

1. Login sebagai `anggota`.
2. Buka `/dashboard/events`.
3. Aplikasi menampilkan placeholder, bukan manajemen semua acara.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar CRUD acara dan event members bekerja.

## Job Desk / Task Fase 7

Halaman `/dashboard/tasks` sekarang menjadi manajemen job desk untuk:

- Job Desk Divisi
- Job Desk Acara

Fitur yang tersedia:

- Melihat task dari collection `tasks`
- Tambah task
- Edit task
- Archive task dengan `is_archived: true`
- Detail task di `/dashboard/tasks/[taskId]`
- Table view dan card view
- Search nama task
- Filter tipe, status, prioritas, PIC, acara, dan deadline
- Assignment PIC dan koordinator dari collection `users`
- Pilihan event untuk task tipe `acara`
- Field copywriting, link Google Docs, referensi desain, Google Drive, color palette, arahan visual, deadline, dan deskripsi
- Detail acara `/dashboard/events/[eventId]` menampilkan section `Job Desk Acara`

Cara test sebagai super admin:

1. Login sebagai `super_admin`.
2. Buka `/dashboard/tasks`.
3. Klik `Tambah Job Desk`.
4. Buat task tipe `divisi` dan tipe `acara`.
5. Coba table/card view, filter, edit, archive, dan detail task.

Cara test sebagai koordinator divisi:

1. Login sebagai `koordinator_divisi`.
2. Buka `/dashboard/tasks`.
3. Buat job desk divisi atau acara.
4. Edit/archive task yang berada di bawah koordinasi.

Cara test sebagai koordinator acara:

1. Login sebagai `koordinator_acara`.
2. Pastikan ada acara yang dia koordinasi.
3. Buka `/dashboard/tasks` atau detail acara.
4. Buat task tipe `acara` untuk acara yang dia koordinasi.

Cara test sebagai anggota:

1. Login sebagai `anggota`.
2. Buka `/dashboard/tasks`.
3. Anggota hanya melihat task dengan `pic_id` miliknya.
4. Anggota belum bisa membuat, edit, atau archive task pada fase ini.

Cara test task dari detail event:

1. Buka `/dashboard/events/[eventId]`.
2. Lihat section `Job Desk Acara`.
3. Klik `Tambah Job Desk`.
4. Task otomatis dibuat sebagai tipe `acara` untuk event tersebut.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar CRUD task bekerja.

## Workflow Task Fase 8

Detail task `/dashboard/tasks/[taskId]` sekarang memiliki workflow panel, action buttons, approval badge, dan activity log.

Fitur yang tersedia:

- Update status task dari detail task
- Catatan opsional saat update status
- Catatan kendala wajib untuk status `stuck` atau `butuh_bantuan`
- Status log append-only di `tasks/{taskId}/status_logs`
- Minta revisi oleh koordinator
- Approve oleh koordinator
- Field `stuck_notes`, `revision_notes`, `approved_by`, dan `approved_at`
- Dashboard summary mulai menghitung status workflow seperti stuck, butuh bantuan, perlu revisi, menunggu approval, dan approved

Cara test sebagai PIC/anggota:

1. Login sebagai user yang menjadi `pic_id` sebuah task.
2. Buka `/dashboard/tasks/[taskId]`.
3. Klik `Update Status`.
4. Ubah status sesuai transisi yang tersedia.
5. Coba `Butuh Bantuan` atau `Tandai Stuck` dan isi catatan kendala.
6. Cek section `Activity Log`.

Cara test sebagai koordinator:

1. Login sebagai koordinator task.
2. Buka detail task yang dikoordinasi.
3. Klik `Minta Revisi`, isi catatan revisi, lalu simpan.
4. Pastikan status menjadi `perlu_revisi` dan approval menjadi `Need Revision`.
5. Klik `Approve`, konfirmasi, lalu pastikan status dan approval menjadi approved.

Cara test sebagai super admin:

1. Login sebagai `super_admin`.
2. Buka detail task mana pun.
3. Super admin dapat update status, minta revisi, dan approve semua task.

Cara cek status logs:

1. Buka Firebase Console.
2. Masuk ke Firestore Database.
3. Buka `tasks/{taskId}/status_logs`.
4. Pastikan setiap perubahan status membuat dokumen log baru.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar workflow task dan status logs bekerja.

## Upload Cloudinary dan WhatsApp Fase 9

Detail task `/dashboard/tasks/[taskId]` sekarang memiliki section `Hasil Desain`.

Fitur yang tersedia:

- Upload hasil desain JPG, JPEG, PNG, atau WEBP maksimal 10MB
- Upload dilakukan lewat server API `POST /api/uploads/task-result`
- File dikirim ke Cloudinary folder `jobdex/{organizationId}/tasks/{taskId}`
- Metadata upload disimpan di `tasks/{taskId}/uploads`
- Preview gambar terbaru dan riwayat upload tampil di detail task
- Setelah upload berhasil, status task menjadi `menunggu_approval`
- Status log baru dibuat di `tasks/{taskId}/status_logs`
- Notifikasi WhatsApp dikirim lewat server API dan semua hasilnya dicatat di `whatsapp_logs`
- Jika WhatsApp gagal, upload tetap dianggap sukses dan log gagal tetap tersimpan

Environment server-side yang dibutuhkan:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
WABLAS_API_URL=
WABLAS_API_TOKEN=
WABLAS_SECRET_KEY=
WABLAS_DEVICE_ID=
WABLAS_GROUP_ID=isi_id_grup_whatsapp_valid
WABLAS_SEND_TO_GROUP=true
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Jangan gunakan env server-side di komponen client. Cloudinary, Wablas, dan Firebase Admin hanya dipanggil dari API route/server helper.

Cara test upload Cloudinary:

1. Login sebagai `super_admin`, koordinator task, atau PIC task.
2. Buka `/dashboard/tasks/[taskId]`.
3. Pada section `Hasil Desain`, klik `Upload Hasil Desain`.
4. Pilih file JPG/PNG/WEBP di bawah 10MB.
5. Pastikan preview muncul, riwayat upload bertambah, dan status task menjadi `Menunggu Approval`.
6. Cek Firestore di `tasks/{taskId}/uploads`.

Cara test file tidak valid:

1. Upload file selain JPG/PNG/WEBP atau file lebih dari 10MB.
2. Aplikasi akan menampilkan error dan tidak membuat metadata upload.

Cara test WhatsApp notification:

1. Pastikan Wablas env sudah benar.
2. Upload hasil desain atau lakukan aksi workflow seperti update status, stuck/butuh bantuan, minta revisi, atau approve.
3. Cek grup WhatsApp tujuan.
4. Cek Wablas Report dan pastikan Type pesan adalah `Group`, bukan `Personal`.
5. Cek Firestore collection `whatsapp_logs`.

Payload Wablas dikirim dari server API dalam mode grup:

```json
{
  "phone": "isi_id_grup_whatsapp_valid",
  "message": "isi pesan JobDex.in",
  "isGroup": "true"
}
```

Jika `WABLAS_DEVICE_ID` diisi, server juga menambahkan field `device_id`. Token dan secret hanya dipakai di header server-side dan tidak disimpan ke Firestore.

Cara test WhatsApp gagal:

1. Pakai konfigurasi Wablas development yang tidak valid sementara.
2. Upload hasil desain.
3. Upload tetap sukses, tetapi UI menampilkan warning bahwa notifikasi WhatsApp gagal.
4. Firestore `whatsapp_logs` berisi status `failed`.

Jika `WABLAS_GROUP_ID` kosong atau belum diatur, server tidak memanggil Wablas dan akan membuat log `failed` dengan pesan `WABLAS_GROUP_ID belum diatur di environment variables.`.

Firestore `whatsapp_logs` menyimpan `recipient`, `recipient_type: "group"`, dan `is_group: true` untuk membantu debugging mode pengiriman.

Cara test upload ulang saat status sudah `menunggu_approval`:

1. Upload hasil desain pertama sampai status task menjadi `Menunggu Approval`.
2. Upload file hasil desain kedua pada task yang sama.
3. Riwayat upload bertambah dan preview terbaru berubah.
4. Activity log tidak membuat entri `Menunggu Approval ke Menunggu Approval`.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar read metadata upload tetap aman. Metadata upload dan WhatsApp log ditulis oleh server API menggunakan Firebase Admin SDK, sehingga client write tetap ditutup.

## Arsip Referensi Desain Fase 10A

Halaman `/dashboard/references` sekarang menjadi arsip referensi desain dari collection `design_references`.

Struktur data utama:

```txt
design_references/{referenceId}
```

Fitur yang tersedia:

- Melihat referensi desain aktif untuk semua user login
- Tambah referensi untuk super admin, koordinator divisi, dan koordinator acara
- Edit/archive referensi untuk super admin dan koordinator divisi
- Koordinator acara hanya bisa edit/archive referensi yang dia buat
- Anggota biasa hanya bisa melihat referensi aktif
- Search judul, nama acara, style notes, dan catatan
- Filter jenis desain, tahun, dan nama acara
- Preview thumbnail URL jika tersedia
- Link Google Drive
- Color palette preview
- Detail referensi
- Integrasi ringan dari form task melalui link `Buka Referensi`

Jenis desain yang tersedia:

```txt
poster, name_tag, twibbon, feed_ig, story_ig, banner, sertifikat,
dokumentasi, animasi, merchandise, lainnya
```

Cara test sebagai super admin:

1. Login sebagai `super_admin`.
2. Buka `/dashboard/references`.
3. Klik `Tambah Referensi`.
4. Isi judul, jenis desain, tahun, link Drive/thumbnail opsional, palette, dan catatan.
5. Simpan, lalu coba `Detail`, `Edit`, dan `Archive`.
6. Aktifkan filter `Archived` untuk melihat referensi yang sudah diarsipkan.

Cara test sebagai koordinator divisi:

1. Login sebagai `koordinator_divisi`.
2. Buka `/dashboard/references`.
3. Tambah, edit, dan archive referensi.
4. Pastikan referensi aktif tetap terlihat oleh semua user login.

Cara test sebagai koordinator acara:

1. Login sebagai `koordinator_acara`.
2. Tambah referensi baru.
3. Pastikan user tersebut bisa edit/archive referensi yang dia buat.
4. Pastikan referensi milik user lain tidak menampilkan aksi edit/archive.

Cara test sebagai anggota:

1. Login sebagai `anggota`.
2. Buka `/dashboard/references`.
3. Pastikan referensi aktif tampil.
4. Pastikan tombol `Tambah Referensi`, `Edit`, dan `Archive` tidak tampil.

Cara test search dan filter:

1. Buat beberapa referensi dengan jenis desain, tahun, dan nama acara berbeda.
2. Gunakan kolom search untuk mencari judul/acara/catatan.
3. Gunakan filter jenis desain, tahun, dan nama acara.
4. Pastikan hasil berubah tanpa error.

Validasi form:

- Judul wajib diisi.
- Jenis desain wajib dipilih.
- Tahun harus 2020 sampai 2035.
- URL Drive dan thumbnail harus diawali `http://` atau `https://` jika diisi.
- Color palette harus hex, contoh `#185FA5, #378ADD, #E6F1FB`.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar CRUD arsip referensi berjalan sesuai role.

## Gemini AI Assistant Fase 10B

Halaman `/dashboard/ai` sekarang menjadi AI Assistant berbasis Gemini untuk role:

- `super_admin`
- `koordinator_divisi`
- `koordinator_acara`

Anggota biasa akan diarahkan ke `/dashboard/unauthorized`.

Alur request:

```txt
Frontend -> API Route Next.js -> Firestore Admin SDK -> Context ringkas -> Gemini API -> Jawaban
```

Endpoint utama:

```txt
POST /api/ai/query
POST /api/ai/send-whatsapp
```

Environment server-side yang dibutuhkan:

```env
GEMINI_API_KEY=
AI_DAILY_LIMIT=75
```

`GEMINI_API_KEY` hanya digunakan di server route dan tidak boleh dibuat sebagai `NEXT_PUBLIC_...`.
`AI_DAILY_LIMIT` juga dibaca server-side saja. Jika kosong atau invalid, aplikasi memakai fallback 20 pertanyaan per user per hari.

Fitur yang tersedia:

- Chat sederhana dengan AI Assistant
- Quick prompt:
  - Ringkas progress hari ini
  - Siapa yang stuck?
  - Siapa yang belum mulai?
  - Apa yang menunggu approval?
  - Deadline terdekat
  - Buat pesan update WA
- Jawaban berdasarkan task, event, user name, dan referensi desain ringkas
- Jawaban bisa disalin
- Jawaban bisa dikirim ke grup WhatsApp
- Query dan jawaban tersimpan di `ai_logs`
- Rate limit sederhana per user per hari, bisa diatur lewat `AI_DAILY_LIMIT`

Data yang dikirim ke Gemini sudah diringkas dan tidak menyertakan token, secret, nomor WhatsApp, email pribadi, Firebase UID, atau raw response Wablas.

Cara test sebagai super admin:

1. Login sebagai `super_admin`.
2. Buka `/dashboard/ai`.
3. Klik quick prompt `Ringkas progress hari ini`.
4. Pastikan AI memberi ringkasan berdasarkan data task.
5. Klik `Salin Jawaban`.
6. Klik `Kirim ke WhatsApp` untuk mengirim ringkasan ke grup.

Cara test sebagai koordinator:

1. Login sebagai `koordinator_divisi` atau `koordinator_acara`.
2. Buka `/dashboard/ai`.
3. Tanyakan `Task apa saja yang stuck?`.
4. Untuk koordinator acara, data dibatasi ke task acara yang dia koordinasi.

Cara test sebagai anggota:

1. Login sebagai `anggota`.
2. Buka `/dashboard/ai`.
3. Aplikasi mengarahkan ke `/dashboard/unauthorized`.

Cara test pertanyaan AI:

1. Buat beberapa task dengan status berbeda: `stuck`, `butuh_bantuan`, `menunggu_approval`.
2. Buka `/dashboard/ai`.
3. Tanyakan `Task apa saja yang butuh bantuan?`.
4. Pastikan AI tidak mengarang jika data kosong.

Cara cek `ai_logs`:

1. Buka Firebase Console.
2. Masuk ke Firestore Database.
3. Buka collection `ai_logs`.
4. Pastikan field `asked_by`, `question`, `context_summary`, `answer`, `model_used`, dan `created_at` tersedia.
5. Pastikan tidak ada API key atau secret yang tersimpan.

Firestore rules untuk `ai_logs`:

- Koordinator dan super admin bisa membaca log.
- Client tidak bisa write langsung.
- Write dilakukan oleh server API menggunakan Firebase Admin SDK.

Setelah update `firestore.rules`, publish ulang rules dari Firebase Console agar pembacaan `ai_logs` sesuai role.

## Persistent AI Chat dan WhatsApp Inbound Bot Fase 10B.2

AI Assistant `/dashboard/ai` sekarang memakai `ai_logs` sebagai chat history.

Fitur tambahan:

- Riwayat chat tetap muncul setelah refresh halaman
- Maksimal 50 log terbaru ditampilkan
- Chat dikelompokkan berdasarkan tanggal: `Hari ini`, `Kemarin`, atau tanggal spesifik
- Bubble user dan AI tampil seperti chat
- Tombol `Refresh Riwayat`
- Composer sticky di bawah area chat
- Enter untuk kirim, Shift+Enter untuk baris baru
- Loading bubble saat AI menjawab
- Tombol `Salin Jawaban` dan `Kirim ke WhatsApp` tetap tersedia

Webhook Wablas untuk AI Bot tersedia di:

```txt
POST /api/webhooks/wablas/gemini
```

Environment tambahan:

```env
WABLAS_WEBHOOK_SECRET=isi_secret_random
```

Webhook memakai query secret:

```txt
/api/webhooks/wablas/gemini?secret=ISI_SECRET
```

Contoh URL development dengan tunnel:

```txt
https://xxxx.ngrok-free.app/api/webhooks/wablas/gemini?secret=ISI_SECRET
```

Contoh URL production Vercel:

```txt
https://jobdex-in.vercel.app/api/webhooks/wablas/gemini?secret=ISI_SECRET
```

Setup di dashboard Wablas:

1. Buka Device Setting.
2. Isi webhook URL di atas.
3. Aktifkan `Get Incoming Message`.
4. Aktifkan `Get Webhook` jika diperlukan oleh device.
5. Pastikan `WABLAS_GROUP_ID` berisi group id target.

Cara pakai bot di WhatsApp group:

```txt
!jobdex siapa yang stuck?
!jobdex ringkas progress hari ini
!jobdex apa yang menunggu approval?
```

Bot hanya memproses pesan yang diawali `!jobdex`. Pesan lain diabaikan agar grup tidak spam.

Cara test chat history web:

1. Login sebagai koordinator atau super admin.
2. Buka `/dashboard/ai`.
3. Kirim pertanyaan.
4. Refresh halaman.
5. Pastikan pertanyaan dan jawaban tetap tampil dari `ai_logs`.

Cara test date grouping:

1. Buka `/dashboard/ai`.
2. Pastikan chat memiliki separator tanggal.
3. Log lama akan tampil dengan tanggal spesifik.

Cara test WhatsApp bot:

1. Pastikan webhook URL sudah terpasang di Wablas.
2. Kirim pesan ke grup:

   ```txt
   !jobdex siapa yang stuck?
   ```

3. Bot membalas dengan format:

   ```txt
   [JobDex.in AI]

   Pertanyaan:
   ...

   Jawaban:
   ...
   ```

4. Cek Firestore `ai_logs`, pastikan `source = "whatsapp"`.
5. Cek Firestore `whatsapp_logs`, pastikan balasan bot tercatat.

Cara test ignore non-trigger:

1. Kirim pesan biasa tanpa `!jobdex`.
2. Bot tidak membalas.

Cara test keamanan webhook:

1. Akses `/api/webhooks/wablas/gemini` tanpa query `secret`.
2. Response harus `401`.
3. Akses dengan secret salah juga harus `401`.

Catatan payload Wablas:

- Parser webhook dibuat defensif karena field payload Wablas bisa berbeda antar setting.
- Parser mencoba membaca `message`, `text`, `body`, `phone`, `sender`, `from`, `name`, `pushName`, `isGroup`, `group_id`, dan `chat_id`.
- Untuk MVP, bot hanya memproses pesan dari group target `WABLAS_GROUP_ID`.
