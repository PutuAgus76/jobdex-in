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
