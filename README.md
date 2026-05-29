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
