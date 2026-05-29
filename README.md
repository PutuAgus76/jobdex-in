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
