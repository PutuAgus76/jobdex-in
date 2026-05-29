# PRD — JobDex.in
**Product Requirements Document**
**Versi:** 1.0 (MVP)
**Tanggal:** Mei 2026
**Dibuat oleh:** Product Manager / System Analyst
**Status:** Draft — Siap untuk Development

---

## Daftar Isi
1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals](#3-goals)
4. [Target Users](#4-target-users)
5. [Requirements](#5-requirements)
6. [Core Features](#6-core-features)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [User Flow](#8-user-flow)
9. [System Architecture](#9-system-architecture)
10. [Database Schema](#10-database-schema)
11. [WhatsApp Notification System](#11-whatsapp-notification-system)
12. [AI Assistant with Gemini](#12-ai-assistant-with-gemini)
13. [Upload & Archive System](#13-upload--archive-system)
14. [UI/UX Direction](#14-uiux-direction)
15. [MVP Scope](#15-mvp-scope)
16. [Future Enhancements](#16-future-enhancements)
17. [Security & Technical Constraints](#17-security--technical-constraints)
18. [Environment Variables](#18-environment-variables)
19. [Acceptance Criteria](#19-acceptance-criteria)
20. [Development Notes for AI Coder](#20-development-notes-for-ai-coder)

---

## 1. Overview

**JobDex.in** adalah aplikasi web manajemen job desk yang dirancang khusus untuk divisi **Humas dan Media Kreatif / Pubdok / Hubdok / Publikasi dan Dokumentasi** dalam lingkungan organisasi mahasiswa.

Aplikasi ini menggabungkan fungsionalitas Google Spreadsheet, Notion, WhatsApp notification, dan arsip desain dalam satu platform yang sederhana, terstruktur, dan mudah digunakan—bahkan oleh anggota yang tidak memiliki latar belakang teknis.

Pada MVP, JobDex.in difokuskan untuk **satu organisasi** dengan dua area kerja utama:
- **Job Desk Divisi** — tugas tetap dan rutin dari divisi Humas & Media Kreatif.
- **Job Desk Acara** — tugas yang berkaitan dengan kegiatan/event tertentu yang bersifat temporal.

### Assumptions
- Setiap organisasi memiliki satu instance JobDex (satu organisasi, satu database).
- Semua anggota terdaftar secara manual oleh Super Admin atau mendaftar sendiri lalu diverifikasi.
- WhatsApp grup yang digunakan adalah grup yang dikelola oleh Wablas/WA-blast.
- Cloudinary digunakan sebagai layanan penyimpanan gambar utama untuk MVP.
- Google Drive otomatis (Drive API) ditunda ke versi 1.1; MVP cukup simpan link Google Drive secara manual.
- Gemini API yang digunakan adalah `gemini-1.5-flash` (gratis/hemat) dengan konteks data dari Firestore.
- Semua notifikasi WhatsApp dikirim ke satu grup utama, bukan personal (untuk MVP).
- Bahasa antarmuka menggunakan Bahasa Indonesia.

---

## 2. Problem Statement

Divisi Humas dan Media Kreatif di organisasi mahasiswa menghadapi beberapa masalah operasional yang berulang:

| Masalah | Dampak |
|---|---|
| Pencatatan job desk dilakukan di Google Spreadsheet yang tidak terstruktur | Data berantakan, sering tumpang tindih, tidak ada versi tunggal |
| Koordinasi via WhatsApp grup | Informasi tugas tenggelam di antara pesan lain, mudah terlewat |
| Tidak ada tracking status tugas secara real-time | Koordinator tidak tahu siapa yang stuck, siapa yang belum mulai |
| File desain tersebar di berbagai Google Drive pribadi | Hasil desain sulit ditemukan, tidak terarsip dengan baik |
| Tidak ada sistem referensi desain tahun sebelumnya | Anggota baru harus "menemukan kembali roda", konsistensi visual rendah |
| Tidak ada sistem approval yang terstruktur | Proses revisi tidak terdokumentasi, sering terjadi miskomunikasi |
| Redaksi/copywriting tersebar di berbagai Google Docs | Tidak ada koneksi antara teks dan konten visual |

Masalah-masalah ini menyebabkan inefisiensi, keterlambatan produksi konten, dan kualitas hasil yang tidak konsisten.

---

## 3. Goals

### Goals Bisnis
- Meningkatkan efisiensi koordinasi divisi Humas & Media Kreatif minimal 50% dibandingkan metode manual.
- Menyediakan transparansi status tugas yang dapat diakses kapan saja dan di mana saja.
- Membangun arsip desain organisasi yang terstruktur dan mudah diakses generasi berikutnya.

### Goals Produk
- Memberikan satu platform terpusat untuk mengelola semua job desk Media Kreatif.
- Mengotomasi notifikasi status tugas ke WhatsApp grup tanpa perlu intervensi manual.
- Menyediakan AI assistant yang membantu koordinator mendapatkan ringkasan progres secara instan.
- Memberikan anggota visibilitas penuh terhadap tugas mereka sendiri dan tugas tim secara keseluruhan.

### Goals Teknis
- Membangun aplikasi yang scalable menggunakan Next.js + Firebase.
- Memastikan keamanan data dengan Firebase Security Rules yang ketat.
- Menyimpan semua secret/API key di environment variables, tidak ada yang terekspos di frontend.
- Deployment otomatis via Vercel dengan CI/CD yang minimal.

---

## 4. Target Users

### Persona 1 — Koordinator Divisi (Kadiv Humas & Media Kreatif)
- **Usia:** 19–22 tahun
- **Kebutuhan:** Memantau semua tugas divisi, menetapkan penanggung jawab, memberi approval
- **Pain Point:** Tidak bisa tahu siapa yang stuck tanpa bertanya satu per satu via WhatsApp
- **Tech-savvy:** Menengah — terbiasa pakai Google Workspace dan Canva

### Persona 2 — Koordinator Acara (Panitia/PIC Event)
- **Usia:** 19–22 tahun
- **Kebutuhan:** Membuat daftar job desk per acara, memantau progress event, approve hasil
- **Pain Point:** Kesulitan memastikan semua desain selesai sebelum hari-H
- **Tech-savvy:** Menengah

### Persona 3 — Anggota Biasa (Desainer/Anggota Media Kreatif)
- **Usia:** 18–21 tahun
- **Kebutuhan:** Melihat tugas sendiri, update status, upload hasil desain
- **Pain Point:** Sering lupa deadline karena reminder tenggelam di grup WA
- **Tech-savvy:** Rendah hingga menengah — pakai HP lebih sering dari laptop

### Persona 4 — Super Admin / Ketua Organisasi
- **Usia:** 20–23 tahun
- **Kebutuhan:** Manajemen anggota, akses penuh ke semua data
- **Pain Point:** Tidak ada visibilitas keseluruhan performa divisi
- **Tech-savvy:** Menengah hingga tinggi

---

## 5. Requirements

### Aksesibilitas
- Aplikasi harus dapat diakses melalui Web Browser (Chrome, Firefox, Safari).
- Responsive design: Desktop diutamakan untuk koordinator, mobile-friendly untuk anggota.
- Tidak memerlukan instalasi aplikasi native.

### Pengguna & Autentikasi
- Firebase Authentication sebagai sistem autentikasi utama.
- Login dengan email/password dan opsional Google OAuth.
- Sistem role-based access control (RBAC) dengan minimal 4 level: Super Admin, Koordinator Divisi, Koordinator Acara, Anggota.
- Satu akun dapat memiliki beberapa role (contoh: seseorang bisa jadi Koordinator Acara dan Anggota sekaligus).

### Data & Konten
- Semua data tugas disimpan di Firestore.
- Gambar/file desain disimpan di Cloudinary.
- Link eksternal (Google Docs, Google Drive) disimpan sebagai string URL di Firestore.
- Riwayat aktivitas tugas (status log) disimpan di Firestore subcollection.
- Komentar real-time menggunakan Firebase Realtime Database untuk low-latency.

### Notifikasi
- Notifikasi WhatsApp dikirim via Wablas/WA-blast API dari backend (Next.js API Routes).
- Notifikasi tidak boleh dikirim langsung dari frontend (keamanan token).
- Sistem antrian notifikasi sederhana untuk mencegah spam.

### Performa
- Halaman Dashboard harus ter-load dalam < 3 detik pada koneksi 4G.
- Upload gambar maks 10MB per file (MVP).
- Menggunakan Firebase pagination untuk list tugas yang panjang.

---

## 6. Core Features

### 6.1 Landing Page
Halaman publik yang menjelaskan JobDex.in sebelum login.

**Konten:**
- Hero section dengan tagline dan deskripsi singkat aplikasi.
- Section manfaat utama (3–4 poin unggulan).
- Screenshot/mockup antarmuka (opsional untuk MVP, bisa diisi placeholder).
- Tombol **Login** dan **Daftar Akun**.
- Footer sederhana dengan nama organisasi dan versi aplikasi.

**Catatan:** Landing page bersifat statis, tidak perlu koneksi ke Firestore.

---

### 6.2 Authentication
Sistem autentikasi berbasis Firebase Authentication.

**Fitur:**
- **Login** dengan email + password.
- **Register** dengan email, password, nama lengkap, dan nomor WhatsApp.
- **Google OAuth** (opsional, bisa diaktifkan di Firebase Console).
- **Forgot Password** via link reset email dari Firebase.
- Setelah register, akun memiliki role `anggota` secara default.
- Super Admin dapat mengubah role dari halaman Manajemen Anggota.
- Redirect setelah login: ke Dashboard jika role sudah dikonfigurasi, ke halaman "Lengkapi Profil" jika belum.

**Validasi:**
- Email harus valid dan unik.
- Password minimal 8 karakter, mengandung huruf dan angka.
- Nomor WhatsApp wajib diisi, format Indonesia (08xx atau +628xx).

---

### 6.3 Dashboard
Halaman utama setelah login, menampilkan ringkasan operasional secara visual.

**Widget/Panel yang tersedia:**

| Widget | Deskripsi |
|---|---|
| Total Tugas Aktif | Jumlah semua tugas yang belum selesai |
| Tugas Belum Dimulai | Jumlah tugas dengan status "Belum Dimulai" |
| Sedang Dikerjakan | Jumlah tugas dengan status "Sedang Dikerjakan" |
| Stuck / Terkendala | Jumlah tugas dengan status "Stuck" atau "Butuh Bantuan" |
| Perlu Revisi | Jumlah tugas yang sedang dalam proses revisi |
| Tugas Selesai | Jumlah tugas yang sudah Approved |
| Deadline Dekat | Tugas dengan deadline ≤ 3 hari dari sekarang |
| Progress per Acara | Progress bar untuk setiap acara aktif (% tugas selesai) |
| Progress per Anggota | Tabel ringkasan tugas per anggota |

**Perilaku berdasarkan Role:**
- **Anggota:** Hanya melihat tugas miliknya sendiri di widget.
- **Koordinator:** Melihat tugas yang berada di bawah koordinasinya.
- **Super Admin:** Melihat seluruh data organisasi.

---

### 6.4 Manajemen Anggota
Halaman pengelolaan data anggota, hanya dapat diakses oleh Super Admin dan Koordinator Divisi.

**Fitur:**
- Daftar semua anggota organisasi dalam bentuk tabel.
- Tambah anggota baru (manual, bukan via invite link untuk MVP).
- Edit profil anggota: nama, nomor WhatsApp, divisi, role.
- Nonaktifkan akun anggota (soft delete, data tetap ada).
- Lihat riwayat tugas per anggota.
- Filter anggota berdasarkan divisi atau role.

**Data Profil Anggota:**
- Nama lengkap
- Email (tidak bisa diubah setelah register)
- Nomor WhatsApp
- Divisi
- Role (Super Admin / Koordinator Divisi / Koordinator Acara / Anggota)
- Tanggal bergabung
- Status akun (Aktif / Nonaktif)
- Avatar (opsional, dari Google OAuth atau inisial nama)

---

### 6.5 Job Desk Divisi
Area khusus untuk tugas-tugas tetap dan rutin divisi Humas & Media Kreatif yang bukan bagian dari acara tertentu.

**Fitur:**
- Daftar tugas divisi dalam tampilan tabel dan card view.
- Tambah tugas divisi baru (hanya Koordinator Divisi dan Super Admin).
- Setiap tugas memiliki semua field yang dijelaskan di Bagian Data (lihat Bagian 6.7).
- Filter dan sort berdasarkan: status, deadline, PIC, prioritas.
- Pencarian tugas berdasarkan nama.

**Contoh Tugas Divisi:**
- Pembuatan konten media sosial reguler (Instagram, TikTok)
- Desain template story/feed mingguan
- Dokumentasi kegiatan internal
- Pengelolaan akun media sosial organisasi

---

### 6.6 Job Desk Acara
Area untuk mengelola tugas-tugas yang berkaitan dengan acara/kegiatan tertentu.

**Manajemen Acara:**
- Buat acara baru dengan data: nama acara, tanggal pelaksanaan, deskripsi, koordinator acara, dan daftar anggota acara.
- Daftar semua acara aktif dan arsip acara lama.
- Status acara: Persiapan / Berlangsung / Selesai / Dibatalkan.
- Filter acara berdasarkan status dan tanggal.

**Manajemen Job Desk Acara:**
- Dalam setiap acara, koordinator dapat membuat daftar job desk.
- Setiap job desk acara memiliki data lengkap yang sama dengan job desk divisi.
- Koordinator dapat menetapkan anggota ke setiap job desk.
- Progress acara dihitung otomatis dari persentase tugas yang sudah Approved.

**Contoh Acara:**
- PKKMB (Pengenalan Kehidupan Kampus Mahasiswa Baru)
- Dies Natalis Organisasi
- Seminar Nasional
- Pengabdian ke Sekolah
- Wisuda

---

### 6.7 Task Detail Page
Setiap tugas memiliki halaman detail tersendiri yang dapat diakses via URL unik (`/tasks/[taskId]`).

**Data yang ditampilkan dan dapat diedit:**

| Field | Tipe Data | Wajib | Bisa Diedit Oleh |
|---|---|---|---|
| Nama Tugas | Text | Ya | Koordinator |
| Jenis Tugas | Enum (Divisi/Acara) | Ya | Koordinator |
| Nama Acara | Reference | Jika Acara | Koordinator |
| Penanggung Jawab (PIC) | Reference ke User | Ya | Koordinator |
| Anggota Terlibat | Array Reference | Tidak | Koordinator |
| Koordinator | Reference ke User | Ya | Super Admin |
| Deadline | Date | Ya | Koordinator |
| Status | Enum | Ya | Anggota PIC, Koordinator |
| Prioritas | Enum (Rendah/Sedang/Tinggi/Kritis) | Ya | Koordinator |
| Deskripsi Tugas | Rich Text / Long Text | Tidak | Koordinator |
| Redaksi/Copywriting | Long Text | Tidak | Koordinator, PIC |
| Link Google Docs Redaksi | URL | Tidak | Koordinator, PIC |
| Link Referensi Desain Lama | URL | Tidak | Koordinator |
| Link Google Drive Referensi | URL | Tidak | Koordinator |
| Color Palette | Array Hex Color | Tidak | Koordinator |
| Arahan Visual/Supergrafis | Long Text | Tidak | Koordinator |
| Catatan Revisi | Long Text | Tidak | Koordinator |
| Catatan Kendala/Stuck | Long Text | Tidak | PIC |
| Link Hasil Desain | URL | Tidak | PIC |
| Upload Hasil Gambar | File → Cloudinary URL | Tidak | PIC |
| Status Approval | Enum (Pending/Approved/Revisi) | Auto | Koordinator |

**Aksi yang tersedia di Task Detail Page:**

| Tombol/Aksi | Tersedia untuk |
|---|---|
| Update Status | PIC, Koordinator |
| Minta Bantuan | PIC, Anggota Terlibat |
| Submit Hasil | PIC |
| Approve | Koordinator |
| Minta Revisi + Catatan | Koordinator |
| Tambah Komentar | Semua anggota terlibat, Koordinator |
| Upload Gambar | PIC |
| Edit Data Tugas | Koordinator |
| Hapus Tugas | Super Admin, Koordinator (jika belum ada progress) |

**Activity Log (Riwayat):**
- Setiap perubahan status dicatat otomatis dengan timestamp dan nama user.
- Ditampilkan di bagian bawah halaman detail dalam urutan kronologis terbalik.

---

### 6.8 Fitur Upload Hasil Desain
Sistem upload gambar terintegrasi dengan Cloudinary.

**Alur Upload:**
1. PIC klik tombol "Upload Hasil" di Task Detail Page.
2. Muncul dialog upload file (drag & drop atau browse).
3. Validasi file: format JPG/PNG/WEBP, maks 10MB.
4. File di-upload ke Cloudinary via Next.js API Route (bukan langsung dari browser ke Cloudinary untuk keamanan).
5. URL hasil upload disimpan di Firestore pada collection `task_uploads`.
6. Preview gambar ditampilkan di halaman tugas.
7. Sistem mengirim notifikasi WhatsApp ke grup bahwa PIC telah upload hasil.

**Data yang disimpan per upload:**
- `upload_url` (Cloudinary URL)
- `thumbnail_url` (transformasi Cloudinary otomatis)
- `uploaded_by` (user ID)
- `uploaded_at` (timestamp)
- `file_name` (nama file asli)
- `file_size` (bytes)
- `version_number` (1, 2, 3, dst. untuk tracking revisi)

---

### 6.9 Arsip Referensi Desain
Perpustakaan desain masa lalu yang dapat dijadikan referensi oleh anggota baru.

**Kategorisasi Referensi:**
- Berdasarkan **Acara** (PKKMB 2024, Dies Natalis 2023, dst.)
- Berdasarkan **Jenis Desain**: Poster, Name Tag, Twibbon, Feed Instagram, Story Instagram, Banner, Sertifikat, Dokumentasi, Animasi Welcome, Merchandise

**Data per Referensi:**
- Nama/judul referensi
- Acara terkait (opsional)
- Jenis desain
- Tahun
- Link Google Drive
- Thumbnail (URL gambar)
- Catatan style/supergrafis
- Color palette yang digunakan
- Keterangan tambahan

**Akses:** Semua anggota dapat melihat arsip. Hanya Koordinator dan Super Admin yang dapat menambah/edit/hapus.

---

### 6.10 AI Assistant dengan Google Gemini
Fitur AI berbasis teks untuk membantu koordinator dan anggota mendapatkan informasi progres secara cepat.

*(Lihat detail teknis di Bagian 12)*

---

## 7. User Roles & Permissions

### Matriks Hak Akses

| Fitur/Aksi | Super Admin | Koordinator Divisi | Koordinator Acara | Anggota |
|---|:---:|:---:|:---:|:---:|
| Lihat Dashboard (semua) | ✅ | ✅ | ✅ | ❌ |
| Lihat Dashboard (sendiri) | ✅ | ✅ | ✅ | ✅ |
| Kelola Anggota | ✅ | ✅ | ❌ | ❌ |
| Buat Acara | ✅ | ✅ | ✅ | ❌ |
| Edit/Hapus Acara | ✅ | ✅ | Miliknya saja | ❌ |
| Buat Tugas Divisi | ✅ | ✅ | ❌ | ❌ |
| Buat Tugas Acara | ✅ | ✅ | Acaranya saja | ❌ |
| Edit Data Tugas | ✅ | ✅ | Acaranya saja | ❌ |
| Hapus Tugas | ✅ | ✅ | Acaranya saja | ❌ |
| Ubah Status Tugas | ✅ | ✅ | ✅ | PIC saja |
| Upload Hasil Desain | ✅ | ✅ | ✅ | PIC saja |
| Approve Tugas | ✅ | ✅ | Acaranya saja | ❌ |
| Minta Revisi | ✅ | ✅ | Acaranya saja | ❌ |
| Lihat Semua Tugas | ✅ | Divisinya | Acaranya | Miliknya |
| Kelola Arsip Referensi | ✅ | ✅ | ✅ | ❌ |
| Lihat Arsip Referensi | ✅ | ✅ | ✅ | ✅ |
| Akses AI Assistant | ✅ | ✅ | ✅ | ❌ |
| Manajemen Organisasi | ✅ | ❌ | ❌ | ❌ |

### Catatan Role
- **Super Admin:** Satu per organisasi, dibuat saat setup awal. Memiliki akses penuh ke semua fitur.
- **Koordinator Divisi:** Mengelola semua job desk divisi dan semua anggota divisi.
- **Koordinator Acara:** Hanya mengelola acara yang mereka buat atau ditugaskan sebagai koordinator.
- **Anggota:** Hanya bisa lihat dan update tugas yang ditugaskan ke mereka (sebagai PIC).

---

## 8. User Flow

### 8.1 Flow Anggota Biasa

```
Login → Dashboard (lihat tugas sendiri)
     ↓
Klik tugas → Task Detail Page
     ↓
Update status → "Sedang Dikerjakan"
     ↓ (sistem kirim WA)
Kerjakan desain...
     ↓
Upload hasil gambar → Cloudinary
     ↓ (sistem kirim WA)
Status otomatis → "Menunggu Approval"
     ↓
Koordinator review → Approve atau Minta Revisi
     ↓ (sistem kirim WA)
[Jika revisi] → Anggota update → Upload ulang → "Menunggu Approval"
     ↓
[Jika approve] → Status "Approved / Selesai"
```

### 8.2 Flow Koordinator Divisi

```
Login → Dashboard (lihat semua tugas divisi)
     ↓
Buat tugas divisi baru → Isi semua field
     ↓
Tetapkan PIC dan anggota terlibat
     ↓ (sistem kirim WA ke PIC)
Monitor progress via Dashboard
     ↓
Terima notifikasi WA saat ada update
     ↓
Jika ada yang stuck → Bantu resolusi via komentar
     ↓
Review hasil upload anggota
     ↓
Klik "Approve" atau "Minta Revisi" + tulis catatan
     ↓ (sistem kirim WA)
Tugas selesai
```

### 8.3 Flow Koordinator Acara

```
Login → Navigasi ke "Job Desk Acara"
     ↓
Buat acara baru → Isi nama, tanggal, deskripsi
     ↓
Tambah anggota acara dari daftar member
     ↓
Buat daftar job desk untuk acara tersebut
     ↓
Untuk setiap job desk: tetapkan PIC, deadline, referensi, redaksi
     ↓ (sistem kirim WA ke semua PIC)
Monitor progress acara via halaman detail acara
     ↓
Review dan approve setiap tugas
     ↓
Acara selesai → Arsipkan referensi desain ke sistem arsip
```

### 8.4 Flow Upload Hasil Desain

```
Anggota klik "Upload Hasil" di Task Detail Page
     ↓
Dialog upload muncul (drag & drop atau browse)
     ↓
Validasi file (format: JPG/PNG/WEBP, maks 10MB)
     ↓
[Jika tidak valid] → Tampilkan pesan error
     ↓
[Jika valid] → File dikirim ke Next.js API Route /api/upload
     ↓
API Route upload ke Cloudinary menggunakan SDK server-side
     ↓
Cloudinary kembalikan URL
     ↓
URL disimpan di Firestore (task_uploads collection)
     ↓
Preview gambar muncul di halaman tugas
     ↓
Status tugas otomatis berubah ke "Menunggu Approval"
     ↓
Notifikasi WA dikirim ke grup
```

### 8.5 Flow Revisi dan Approval

```
Koordinator melihat tugas dengan status "Menunggu Approval"
     ↓
Koordinator buka Task Detail Page
     ↓
Lihat preview hasil upload anggota
     ↓
Keputusan:
  [Approve] → Klik tombol "Approve"
            → Status berubah ke "Approved / Selesai"
            → Notifikasi WA: "Tugas disetujui"
            → Tidak bisa diubah lagi kecuali Super Admin

  [Revisi]  → Klik tombol "Minta Revisi"
            → Form muncul untuk isi catatan revisi
            → Status berubah ke "Perlu Revisi"
            → Notifikasi WA: "Tugas perlu revisi + catatan"
            → Anggota menerima catatan dan mulai revisi
            → Status ke "Revisi Dikerjakan"
            → Proses kembali ke Upload Hasil
```

### 8.6 Flow AI Assistant

```
Koordinator buka panel AI Assistant
     ↓
Ketik pertanyaan, contoh: "Siapa yang belum mulai?"
     ↓
Frontend kirim request ke Next.js API Route /api/ai/query
     ↓
API Route ambil data relevan dari Firestore
     ↓
Data diringkas menjadi context/prompt
     ↓
Request dikirim ke Gemini API dengan context + pertanyaan user
     ↓
Gemini kembalikan jawaban teks
     ↓
Jawaban ditampilkan di panel AI Assistant
     ↓ (opsional)
Koordinator klik "Kirim ke WhatsApp" → notifikasi terkirim
```

### 8.7 Flow Notifikasi WhatsApp

```
Event terjadi di sistem (status berubah, upload, approve, dll.)
     ↓
Frontend/Backend trigger API Route /api/notifications/whatsapp
     ↓
API Route memformat pesan sesuai template
     ↓
API Route kirim POST request ke Wablas API
     ↓
Wablas kirim pesan ke grup WhatsApp yang terdaftar
     ↓
Response Wablas dicatat di collection whatsapp_logs di Firestore
     ↓ (jika gagal)
Log error, retry maksimal 2 kali, lalu catat sebagai failed
```

---

## 9. System Architecture

### 9.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT LAYER                     │
│           Browser (Next.js Frontend/SSR)             │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────┐
│                  SERVER LAYER                         │
│          Next.js API Routes (Vercel)                  │
│  /api/auth  /api/tasks  /api/upload                  │
│  /api/notifications  /api/ai  /api/events            │
└──────┬──────────┬──────────┬────────────┬────────────┘
       │          │          │            │
┌──────▼──┐ ┌────▼────┐ ┌───▼──────┐ ┌──▼──────────┐
│Firebase │ │Firebase │ │Cloudinary│ │External APIs│
│  Auth   │ │Firestore│ │ Storage  │ │ Wablas  AI  │
│         │ │+ RTDB   │ │          │ │ Gemini      │
└─────────┘ └─────────┘ └──────────┘ └─────────────┘
```

### 9.2 Pembagian Penyimpanan Data

| Data | Lokasi | Alasan |
|---|---|---|
| Profil user, tugas, acara, arsip | Firestore | Struktur fleksibel, query powerful |
| Riwayat status tugas | Firestore (subcollection) | Bagian dari dokumen tugas |
| Komentar real-time | Firebase Realtime Database | Latency rendah, sync otomatis |
| Gambar/file desain | Cloudinary | CDN global, transformasi otomatis |
| Link Google Docs/Drive | String URL di Firestore | Hanya referensi eksternal |
| Token auth session | Firebase Auth (cookie) | Managed oleh Firebase SDK |

### 9.3 Sequence Diagram — Login dan Melihat Tugas

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend (Next.js)
    participant FA as Firebase Auth
    participant FS as Firestore
    
    U->>FE: Buka /login, isi email & password
    FE->>FA: signInWithEmailAndPassword()
    FA-->>FE: ID Token + User Object
    FE->>FS: Ambil data user (users/{uid})
    FS-->>FE: Data user + role
    FE-->>U: Redirect ke /dashboard
    FE->>FS: Query tugas milik user
    FS-->>FE: Daftar tugas
    FE-->>U: Render Dashboard
```

### 9.4 Sequence Diagram — Koordinator Membuat Tugas Baru

```mermaid
sequenceDiagram
    participant K as Koordinator
    participant FE as Frontend
    participant API as API Route /api/tasks
    participant FS as Firestore
    participant WA as Wablas API
    
    K->>FE: Isi form tugas baru, submit
    FE->>API: POST /api/tasks (body: data tugas)
    API->>FS: Verifikasi role koordinator
    FS-->>API: Role confirmed
    API->>FS: Tambah dokumen ke collection tasks
    FS-->>API: taskId baru
    API->>FS: Tambah entry ke task_status_logs
    API->>WA: Kirim notif "Tugas baru dibuat"
    WA-->>API: Status pengiriman
    API->>FS: Simpan ke whatsapp_logs
    API-->>FE: { success: true, taskId }
    FE-->>K: Redirect ke /tasks/[taskId]
```

### 9.5 Sequence Diagram — Anggota Mengubah Status Tugas

```mermaid
sequenceDiagram
    participant A as Anggota
    participant FE as Frontend
    participant API as API Route /api/tasks/[id]/status
    participant FS as Firestore
    participant WA as Wablas API
    
    A->>FE: Klik "Update Status" → pilih status baru
    FE->>API: PATCH /api/tasks/[id]/status
    API->>FS: Verifikasi: apakah A adalah PIC tugas ini?
    FS-->>API: Confirmed (atau rejected)
    API->>FS: Update tasks/{id}.status
    API->>FS: Tambah log ke tasks/{id}/status_logs
    API->>WA: Kirim notif perubahan status
    WA-->>API: OK
    API-->>FE: { success: true, newStatus }
    FE-->>A: Update UI status tugas
```

### 9.6 Sequence Diagram — Upload Hasil Desain

```mermaid
sequenceDiagram
    participant A as Anggota
    participant FE as Frontend
    participant API as API Route /api/upload
    participant CL as Cloudinary
    participant FS as Firestore
    participant WA as Wablas API
    
    A->>FE: Pilih file gambar (maks 10MB)
    FE->>FE: Validasi format & ukuran
    FE->>API: POST /api/upload (multipart form data)
    API->>CL: Upload via Cloudinary SDK (server-side)
    CL-->>API: { secure_url, public_id, thumbnail_url }
    API->>FS: Simpan ke task_uploads subcollection
    API->>FS: Update tasks/{id}.status = "Menunggu Approval"
    API->>FS: Tambah status log
    API->>WA: Kirim notif "Anggota upload hasil"
    WA-->>API: OK
    API-->>FE: { uploadUrl, thumbnailUrl }
    FE-->>A: Tampilkan preview gambar
```

### 9.7 Sequence Diagram — AI Gemini Menjawab Progress

```mermaid
sequenceDiagram
    participant K as Koordinator
    participant FE as Frontend
    participant API as API Route /api/ai/query
    participant FS as Firestore
    participant GM as Gemini API
    
    K->>FE: Ketik pertanyaan di AI Assistant Panel
    FE->>API: POST /api/ai/query { question, eventId? }
    API->>FS: Ambil data tugas (filter by eventId jika ada)
    FS-->>API: Array data tugas + status + PIC
    API->>API: Ringkas data menjadi context string
    API->>GM: POST ke Gemini API (context + question)
    GM-->>API: Jawaban teks
    API->>FS: Simpan ke ai_logs collection
    API-->>FE: { answer: "..." }
    FE-->>K: Tampilkan jawaban di panel
```

---

## 10. Database Schema

### 10.1 Rekomendasi Penyimpanan

**Firestore (Utama):**
- `organizations`, `users`, `divisions`, `events`, `event_members`
- `tasks`, `task_assignees`, `task_status_logs`, `task_uploads`
- `design_references`, `color_palettes`, `whatsapp_logs`, `ai_logs`

**Firebase Realtime Database:**
- `comments/{taskId}` — komentar real-time per tugas
- `typing_status/{taskId}` — indikator user sedang mengetik (opsional)

**Cloudinary:**
- Gambar hasil desain, thumbnail preview

---

### 10.2 Detail Schema Collection Firestore

#### Collection: `organizations`
Satu dokumen per organisasi.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `name` | string | Nama organisasi |
| `slug` | string | Identifier unik, contoh: `humas-universitasxyz` |
| `whatsapp_group_id` | string | ID/token grup WA untuk notifikasi |
| `logo_url` | string | URL logo organisasi (Cloudinary) |
| `created_at` | timestamp | Waktu dibuat |
| `updated_at` | timestamp | Waktu terakhir diperbarui |

---

#### Collection: `users`
Satu dokumen per anggota terdaftar.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string | Sama dengan Firebase Auth UID |
| `organization_id` | string | FK ke `organizations` |
| `name` | string | Nama lengkap |
| `email` | string | Email (unique, dari Firebase Auth) |
| `whatsapp_number` | string | Format: `628xxxxxxxxxx` |
| `role` | enum | `super_admin`, `koordinator_divisi`, `koordinator_acara`, `anggota` |
| `division_id` | string | FK ke `divisions` |
| `avatar_url` | string | URL foto profil (opsional) |
| `is_active` | boolean | Status akun |
| `created_at` | timestamp | Waktu bergabung |
| `updated_at` | timestamp | Waktu update profil terakhir |

*Aturan akses: User hanya bisa baca/update dokumen miliknya sendiri. Super Admin bisa baca semua.*

---

#### Collection: `divisions`
Master data divisi dalam organisasi.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `organization_id` | string | FK ke `organizations` |
| `name` | string | Nama divisi (contoh: "Humas & Media Kreatif") |
| `description` | string | Deskripsi singkat divisi |
| `coordinator_id` | string | FK ke `users` (Koordinator Divisi) |
| `created_at` | timestamp | Waktu dibuat |

---

#### Collection: `events`
Satu dokumen per acara/kegiatan.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `organization_id` | string | FK ke `organizations` |
| `name` | string | Nama acara |
| `description` | string | Deskripsi acara |
| `event_date` | date | Tanggal pelaksanaan acara |
| `coordinator_id` | string | FK ke `users` (Koordinator Acara) |
| `status` | enum | `persiapan`, `berlangsung`, `selesai`, `dibatalkan` |
| `progress_percentage` | number | Otomatis dihitung (0–100) |
| `created_at` | timestamp | Waktu dibuat |
| `updated_at` | timestamp | Waktu update terakhir |

---

#### Subcollection: `events/{eventId}/event_members`
Daftar anggota yang terlibat dalam acara.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Document ID |
| `user_id` | string | FK ke `users` |
| `role_in_event` | string | Peran dalam acara (opsional) |
| `added_at` | timestamp | Waktu ditambahkan |

---

#### Collection: `tasks`
Tugas utama (job desk divisi maupun acara).

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `organization_id` | string | FK ke `organizations` |
| `type` | enum | `divisi`, `acara` |
| `division_id` | string | FK ke `divisions` (jika type=divisi) |
| `event_id` | string | FK ke `events` (jika type=acara) |
| `name` | string | Nama tugas |
| `description` | string | Deskripsi tugas |
| `pic_id` | string | FK ke `users` (Penanggung Jawab) |
| `coordinator_id` | string | FK ke `users` (Koordinator) |
| `deadline` | timestamp | Batas waktu pengerjaan |
| `status` | enum | Lihat daftar status di bawah |
| `priority` | enum | `rendah`, `sedang`, `tinggi`, `kritis` |
| `copywriting` | string | Teks redaksi/caption |
| `copywriting_docs_url` | string | Link Google Docs |
| `design_reference_url` | string | Link referensi desain lama |
| `drive_reference_url` | string | Link Google Drive referensi |
| `color_palette` | array[string] | Array hex color, contoh: `["#FF5733", "#C0392B"]` |
| `visual_direction` | string | Arahan visual/supergrafis |
| `revision_notes` | string | Catatan revisi dari koordinator |
| `stuck_notes` | string | Catatan kendala dari anggota |
| `result_design_url` | string | Link hasil desain final |
| `approval_status` | enum | `pending`, `approved`, `need_revision` |
| `approved_by` | string | FK ke `users` |
| `approved_at` | timestamp | Waktu di-approve |
| `created_by` | string | FK ke `users` |
| `created_at` | timestamp | Waktu dibuat |
| `updated_at` | timestamp | Waktu update terakhir |

**Daftar Nilai Status Tugas:**
`belum_dimulai`, `sedang_dikerjakan`, `butuh_bantuan`, `stuck`, `menunggu_materi`, `draft_selesai`, `perlu_revisi`, `revisi_dikerjakan`, `menunggu_approval`, `approved`, `ditunda`

---

#### Subcollection: `tasks/{taskId}/assignees`
Anggota yang terlibat dalam tugas (selain PIC).

| Field | Tipe | Deskripsi |
|---|---|---|
| `user_id` | string | FK ke `users` |
| `added_at` | timestamp | Waktu ditambahkan |

---

#### Subcollection: `tasks/{taskId}/status_logs`
Riwayat perubahan status tugas.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Document ID |
| `from_status` | string | Status sebelumnya |
| `to_status` | string | Status baru |
| `changed_by` | string | FK ke `users` |
| `note` | string | Catatan opsional saat update status |
| `created_at` | timestamp | Waktu perubahan |

---

#### Subcollection: `tasks/{taskId}/uploads`
File gambar yang diupload untuk tugas ini.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Document ID |
| `upload_url` | string | URL Cloudinary (full size) |
| `thumbnail_url` | string | URL Cloudinary (thumbnail) |
| `public_id` | string | Cloudinary public ID |
| `file_name` | string | Nama file asli |
| `file_size` | number | Ukuran file dalam bytes |
| `version_number` | number | Nomor versi upload (1, 2, 3, ...) |
| `uploaded_by` | string | FK ke `users` |
| `uploaded_at` | timestamp | Waktu upload |

---

#### Collection: `design_references`
Arsip referensi desain tahun sebelumnya.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Document ID |
| `organization_id` | string | FK ke `organizations` |
| `title` | string | Judul/nama referensi |
| `event_name` | string | Nama acara terkait (opsional) |
| `design_type` | enum | `poster`, `name_tag`, `twibbon`, `feed_ig`, `story_ig`, `banner`, `sertifikat`, `dokumentasi`, `animasi`, `merchandise`, `lainnya` |
| `year` | number | Tahun desain dibuat |
| `drive_url` | string | Link Google Drive |
| `thumbnail_url` | string | URL preview (Cloudinary atau Google Drive thumbnail) |
| `style_notes` | string | Catatan style/supergrafis |
| `color_palette` | array[string] | Array hex color |
| `notes` | string | Catatan tambahan |
| `created_by` | string | FK ke `users` |
| `created_at` | timestamp | Waktu ditambahkan |

---

#### Collection: `whatsapp_logs`
Pencatatan semua notifikasi WhatsApp yang dikirim.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Document ID |
| `organization_id` | string | FK ke `organizations` |
| `task_id` | string | FK ke `tasks` (jika terkait tugas) |
| `event_type` | string | Jenis event trigger, contoh: `status_changed` |
| `message_content` | string | Isi pesan yang dikirim |
| `recipient` | string | Nomor/ID grup WA |
| `status` | enum | `sent`, `failed`, `pending` |
| `wablas_response` | string | Raw response dari Wablas API |
| `retry_count` | number | Jumlah percobaan ulang |
| `created_at` | timestamp | Waktu pengiriman |

---

#### Collection: `ai_logs`
Pencatatan semua query dan jawaban AI Assistant.

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | string (auto) | Document ID |
| `organization_id` | string | FK ke `organizations` |
| `asked_by` | string | FK ke `users` |
| `question` | string | Pertanyaan yang diajukan |
| `context_summary` | string | Ringkasan data Firestore yang dikirim ke Gemini |
| `answer` | string | Jawaban dari Gemini |
| `model_used` | string | Model Gemini yang digunakan |
| `tokens_used` | number | Estimasi token (jika tersedia) |
| `created_at` | timestamp | Waktu query |

---

### 10.3 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    organizations {
        string id PK
        string name
        string slug
        string whatsapp_group_id
        string logo_url
        timestamp created_at
    }
    
    users {
        string id PK
        string organization_id FK
        string division_id FK
        string name
        string email
        string whatsapp_number
        string role
        boolean is_active
        timestamp created_at
    }
    
    divisions {
        string id PK
        string organization_id FK
        string coordinator_id FK
        string name
        string description
    }
    
    events {
        string id PK
        string organization_id FK
        string coordinator_id FK
        string name
        date event_date
        string status
        number progress_percentage
        timestamp created_at
    }
    
    event_members {
        string id PK
        string event_id FK
        string user_id FK
        string role_in_event
        timestamp added_at
    }
    
    tasks {
        string id PK
        string organization_id FK
        string event_id FK
        string division_id FK
        string pic_id FK
        string coordinator_id FK
        string name
        string type
        string status
        string priority
        string approval_status
        timestamp deadline
        string color_palette
        timestamp created_at
    }
    
    task_assignees {
        string id PK
        string task_id FK
        string user_id FK
    }
    
    task_status_logs {
        string id PK
        string task_id FK
        string changed_by FK
        string from_status
        string to_status
        string note
        timestamp created_at
    }
    
    task_uploads {
        string id PK
        string task_id FK
        string uploaded_by FK
        string upload_url
        string thumbnail_url
        number version_number
        timestamp uploaded_at
    }
    
    design_references {
        string id PK
        string organization_id FK
        string title
        string design_type
        number year
        string drive_url
        timestamp created_at
    }
    
    whatsapp_logs {
        string id PK
        string organization_id FK
        string task_id FK
        string event_type
        string status
        timestamp created_at
    }
    
    ai_logs {
        string id PK
        string organization_id FK
        string asked_by FK
        string question
        string answer
        timestamp created_at
    }

    organizations ||--o{ users : "memiliki"
    organizations ||--o{ divisions : "memiliki"
    organizations ||--o{ events : "menyelenggarakan"
    organizations ||--o{ tasks : "mengelola"
    divisions ||--o{ tasks : "memiliki tugas"
    divisions ||--o{ users : "memiliki anggota"
    events ||--o{ tasks : "memiliki job desk"
    events ||--o{ event_members : "memiliki anggota"
    users ||--o{ event_members : "terlibat dalam"
    users ||--o{ tasks : "menjadi PIC"
    tasks ||--o{ task_assignees : "melibatkan"
    tasks ||--o{ task_status_logs : "memiliki log"
    tasks ||--o{ task_uploads : "memiliki upload"
    users ||--o{ task_uploads : "mengupload"
    users ||--o{ task_status_logs : "mengubah status"
    users ||--o{ ai_logs : "mengajukan query"
```

### 10.4 Realtime Database Structure (Firebase RTDB)

```json
{
  "comments": {
    "{taskId}": {
      "{commentId}": {
        "text": "Desainnya sudah bagus, tapi font perlu disesuaikan",
        "user_id": "uid_123",
        "user_name": "Budi Santoso",
        "created_at": 1748000000000
      }
    }
  },
  "online_status": {
    "{userId}": {
      "is_online": true,
      "last_seen": 1748000000000
    }
  }
}
```

---

## 11. WhatsApp Notification System

### 11.1 Konfigurasi Wablas/WA-blast

Integrasi menggunakan Wablas API (atau WA-blast sebagai alternatif). Semua request ke API Wablas dilakukan **dari Next.js API Routes (server-side)**, bukan dari frontend. Hal ini penting untuk menjaga keamanan `WABLAS_API_TOKEN`.

### 11.2 Daftar Event Notifikasi

| Event | Trigger | Template Pesan |
|---|---|---|
| Tugas Baru Dibuat | POST /api/tasks | `[JobDex.in] Tugas Baru\nTugas: {nama_tugas}\nPIC: {nama_pic}\nDeadline: {deadline}\nDibuat oleh: {koordinator}` |
| Tugas Ditetapkan ke Anggota | Saat PIC ditentukan | `[JobDex.in] Kamu Mendapat Tugas\nTugas: {nama_tugas}\nDeadline: {deadline}\nKoordinator: {koordinator}` |
| Status Berubah | PATCH status | `[JobDex.in] Update Tugas\nNama: {nama_anggota}\nTugas: {nama_tugas}\nStatus: {status_baru}\nCatatan: {note}\nDeadline: {deadline}` |
| Anggota Stuck | Status → stuck | `[JobDex.in] ⚠️ Perlu Bantuan\nAnggota: {nama}\nTugas: {nama_tugas}\nKendala: {stuck_notes}` |
| Upload Hasil | Upload berhasil | `[JobDex.in] Hasil Diupload\nAnggota: {nama}\nTugas: {nama_tugas}\nStatus: Menunggu Approval\nPreview: {thumbnail_url}` |
| Koordinator Minta Revisi | Approve → need_revision | `[JobDex.in] Revisi Diperlukan\nTugas: {nama_tugas}\nPIC: {nama_pic}\nCatatan Revisi: {revision_notes}` |
| Koordinator Approve | Approve | `[JobDex.in] ✅ Tugas Disetujui\nTugas: {nama_tugas}\nPIC: {nama_pic}\nDisetujui oleh: {koordinator}` |
| Deadline Dekat | Cron job harian | `[JobDex.in] ⏰ Deadline Mendekat\nTugas: {nama_tugas}\nPIC: {nama_pic}\nDeadline: {deadline} (besok!)` |

### 11.3 Implementasi Cron Job Deadline Reminder

Untuk reminder deadline, gunakan Vercel Cron Jobs yang dapat dikonfigurasi di `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-reminder",
      "schedule": "0 8 * * *"
    }
  ]
}
```

API Route `/api/cron/deadline-reminder` akan:
1. Query Firestore untuk tugas dengan deadline = besok + status bukan `approved` atau `ditunda`.
2. Kirim notifikasi WhatsApp untuk setiap tugas tersebut.
3. Catat di `whatsapp_logs`.

### 11.4 Anti-Spam dan Error Handling

- Batasi notifikasi yang sama ke grup maksimal 1 kali per 5 menit (check di `whatsapp_logs`).
- Jika Wablas API gagal, retry maksimal 2 kali dengan interval 30 detik.
- Jika masih gagal, catat status `failed` di `whatsapp_logs` tanpa crash server.
- Log semua notifikasi untuk audit trail.

---

## 12. AI Assistant with Gemini

### 12.1 Arsitektur Integrasi

Gemini tidak memiliki akses langsung ke Firestore. Alur kerja:

```
User Query → Next.js API Route → Firestore (ambil data) → Ringkas data → Gemini API → Jawaban
```

Komponen utama:
- **Model:** `gemini-1.5-flash` (gratis, cukup untuk use case ini)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **SDK:** `@google/generative-ai` npm package

### 12.2 Kemampuan AI Assistant (MVP)

| Pertanyaan Contoh | Cara Kerja |
|---|---|
| "Siapa yang belum mulai mengerjakan tugas?" | Ambil tasks filter status=belum_dimulai, kirim daftar nama+tugas ke Gemini |
| "Tugas apa yang sedang stuck?" | Ambil tasks filter status=stuck, kirim + stuck_notes ke Gemini |
| "Berapa persen progress PKKMB?" | Hitung % approved tasks di event PKKMB, buat ringkasan |
| "Siapa yang paling banyak tugas belum selesai?" | Aggregate tasks per user, kirim sebagai tabel ke Gemini |
| "Buat pesan update progress ke WA" | Gemini format data progress menjadi pesan WA yang friendly |
| "Tugas apa yang deadline-nya minggu ini?" | Filter tasks deadline, format jawaban dengan Gemini |

### 12.3 Struktur Prompt

```javascript
const systemPrompt = `Kamu adalah asisten koordinasi untuk divisi Humas dan Media Kreatif 
organisasi mahasiswa. Kamu membantu koordinator mendapatkan informasi tentang progress tugas 
dengan cepat dan akurat. Jawab dalam Bahasa Indonesia yang ringkas dan mudah dipahami. 
Jangan mengarang data — hanya gunakan data yang diberikan di bawah ini.`;

const dataContext = `
DATA TUGAS SAAT INI (per ${new Date().toLocaleDateString('id-ID')}):
${JSON.stringify(filteredTasksSummary, null, 2)}
`;

const fullPrompt = `${systemPrompt}\n\n${dataContext}\n\nPertanyaan: ${userQuestion}`;
```

### 12.4 Batasan dan Pertimbangan Keamanan

- **Jangan kirim data sensitif** (password, token, nomor WA) ke Gemini.
- **Batasi context**: Hanya kirim field yang relevan (nama tugas, status, deadline, PIC name).
- **Rate limiting**: Batasi 20 query per user per hari untuk menghindari biaya berlebih.
- **Catat semua query** di `ai_logs` collection untuk monitoring.
- API key Gemini **hanya ada di server** (environment variable), tidak pernah di frontend.

### 12.5 UI AI Assistant

Panel AI Assistant berbentuk floating sidebar atau drawer yang muncul di samping kanan layar. Tampilan seperti chat bubble sederhana:
- Input teks dengan placeholder: "Tanya tentang progress tugas..."
- Tombol "Kirim" dan shortcut `Enter`
- Riwayat percakapan selama sesi (tidak persisten antar sesi)
- Tombol "Kirim ke WhatsApp" di bawah setiap jawaban
- Tombol "Salin" untuk copy jawaban

---

## 13. Upload & Archive System

### 13.1 Upload ke Cloudinary

Upload gambar dilakukan via server (Next.js API Route) menggunakan Cloudinary SDK Node.js. Ini memastikan `CLOUDINARY_API_SECRET` tidak terekspos ke client.

**Flow Server-side Upload:**

```javascript
// /api/upload/route.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  
  // Konversi ke buffer, upload ke Cloudinary
  const result = await cloudinary.uploader.upload(fileBuffer, {
    folder: `jobdex/${organizationId}/${taskId}`,
    transformation: [{ width: 1200, crop: 'limit' }]
  });
  
  // Simpan URL ke Firestore
  // Kirim notifikasi WA
  
  return Response.json({ url: result.secure_url });
}
```

### 13.2 Struktur Folder Cloudinary

```
jobdex/
  {organizationId}/
    tasks/
      {taskId}/
        v1_original.jpg
        v2_revisi.jpg
    references/
      {referenceId}/
        thumbnail.jpg
    logos/
      org_logo.png
```

### 13.3 Arsip Referensi Desain

Untuk menambahkan referensi baru ke arsip:
1. Koordinator buka menu "Arsip Referensi".
2. Klik "Tambah Referensi Baru".
3. Isi form: judul, jenis desain, tahun, link Google Drive, upload thumbnail (opsional), catatan style, color palette.
4. Simpan ke Firestore collection `design_references`.

Referensi dapat difilter berdasarkan: jenis desain, tahun, nama acara.

---

## 14. UI/UX Direction

### 14.1 Design Philosophy

JobDex.in mengadopsi pendekatan **"Spreadsheet yang Hidup"** — familiar bagi pengguna Google Sheets, tetapi lebih informatif, interaktif, dan visual. Filosofi desain utama:

- **Clarity over Cleverness**: Semua informasi mudah dibaca tanpa perlu belajar terlebih dahulu.
- **Action-Forward**: Tombol dan CTA selalu terlihat jelas tanpa perlu scroll.
- **Familiar but Fresh**: Mirip Notion + Linear + Spreadsheet, tapi tetap terasa ringan untuk organisasi mahasiswa.

### 14.2 Layout Utama

**Sidebar Navigation (kiri, fixed):**
- Logo JobDex.in
- Menu: Dashboard, Job Desk Divisi, Job Desk Acara, Anggota, Arsip Referensi, AI Assistant, Pengaturan
- Avatar + nama user di bagian bawah

**Main Content Area (tengah/kanan):**
- Breadcrumb navigasi di atas
- Judul halaman + action buttons di kanan
- Konten utama

### 14.3 Tampilan Tugas

**Table View:**
- Kolom: Nama Tugas, PIC, Status (badge warna), Prioritas, Deadline, Acara, Aksi
- Sortable dan filterable
- Mirip tampilan spreadsheet Google Sheets

**Card View:**
- Grid 3 kolom (desktop) atau 1 kolom (mobile)
- Setiap card menampilkan: nama tugas, PIC avatar, status badge, deadline countdown, progress bar upload
- Mirip Trello board

**Toggle View** dengan tombol di pojok kanan atas: ikon tabel ⊞ dan ikon grid ⊟

### 14.4 Status Badge Color Coding

| Status | Warna | Badge Style |
|---|---|---|
| Belum Dimulai | Abu-abu | `bg-gray-100 text-gray-600` |
| Sedang Dikerjakan | Biru | `bg-blue-100 text-blue-700` |
| Butuh Bantuan | Oranye | `bg-orange-100 text-orange-700` |
| Stuck / Terkendala | Merah | `bg-red-100 text-red-700` |
| Menunggu Materi | Kuning | `bg-yellow-100 text-yellow-700` |
| Draft Selesai | Indigo | `bg-indigo-100 text-indigo-700` |
| Perlu Revisi | Merah muda | `bg-pink-100 text-pink-700` |
| Revisi Dikerjakan | Ungu | `bg-purple-100 text-purple-700` |
| Menunggu Approval | Kuning tua | `bg-amber-100 text-amber-700` |
| Approved / Selesai | Hijau | `bg-green-100 text-green-700` |
| Ditunda | Abu-abu tua | `bg-slate-100 text-slate-600` |

### 14.5 Task Detail — Drawer/Modal Pattern

Saat user klik tugas di table view, muncul **side drawer** dari kanan (seperti Notion) yang menampilkan detail tugas tanpa meninggalkan halaman daftar. Fitur-fitur:
- Header: nama tugas + status badge + tombol "Buka Full Page"
- Tabs: Detail, Upload, Komentar, Riwayat
- Footer: tombol Update Status, Upload, Approve/Revisi

### 14.6 Color Palette UI

- **Primary:** `#4F46E5` (Indigo 600) — warna utama CTA
- **Background:** `#F8FAFC` (Slate 50) — background halaman
- **Surface:** `#FFFFFF` — card, sidebar
- **Text Primary:** `#1E293B` (Slate 800)
- **Text Secondary:** `#64748B` (Slate 500)
- **Border:** `#E2E8F0` (Slate 200)
- **Success:** `#16A34A` (Green 600)
- **Warning:** `#D97706` (Amber 600)
- **Danger:** `#DC2626` (Red 600)

### 14.7 Typography

Konsisten dengan arahan di PRD contoh:
- **Sans (UI utama):** `Geist Sans, ui-sans-serif, system-ui`
- **Mono (kode, ID):** `JetBrains Mono, monospace`
- Font size: Base 14px, Heading H1 24px, H2 20px, H3 16px

### 14.8 Responsiveness

- **Desktop (≥1024px):** Layout penuh dengan sidebar fixed.
- **Tablet (768–1023px):** Sidebar collapsible (toggle dengan hamburger).
- **Mobile (<768px):** Sidebar jadi bottom navigation, card view default, table view tersembunyi.

---

## 15. MVP Scope

### 15.1 MVP Wajib (Versi 1.0)

Fitur-fitur ini harus ada sebelum aplikasi bisa digunakan secara operasional:

- [ ] Landing page statis
- [ ] Firebase Authentication (email/password + Google OAuth)
- [ ] Sistem role: Super Admin, Koordinator Divisi, Koordinator Acara, Anggota
- [ ] Dashboard dengan widget ringkasan (sesuai role)
- [ ] Manajemen anggota (tambah, edit, nonaktifkan)
- [ ] Job Desk Divisi: CRUD tugas divisi
- [ ] Job Desk Acara: CRUD acara + CRUD tugas acara
- [ ] Task Detail Page dengan semua field data tugas
- [ ] Perubahan status tugas + validasi role
- [ ] Activity log / riwayat status otomatis
- [ ] Upload gambar hasil desain via Cloudinary
- [ ] Notifikasi WhatsApp untuk 5 event utama: tugas baru, status berubah, stuck, upload hasil, approve/revisi
- [ ] Arsip Referensi Desain (CRUD manual)
- [ ] Table view + Card view dengan filter dasar
- [ ] Firebase Security Rules dasar

### 15.2 Fitur Versi 1.1

Setelah MVP stabil dan digunakan minimal 2 minggu:

- [ ] AI Assistant dengan Gemini (Bagian 12)
- [ ] Notifikasi WhatsApp untuk semua event (termasuk deadline reminder via cron)
- [ ] Progress bar acara otomatis
- [ ] Filter dan sort lanjutan di tabel tugas
- [ ] Dashboard per acara (halaman detail progress acara)
- [ ] Google OAuth login
- [ ] Multiple upload per tugas (versioning)
- [ ] Komentar real-time menggunakan Firebase RTDB
- [ ] Export data tugas ke CSV/Excel
- [ ] Manajemen color palette global organisasi

### 15.3 Fitur Masa Depan (Versi 2.0+)

Fitur jangka panjang yang belum diprioritaskan:

- [ ] Google Drive API otomatis (auto-upload hasil final ke Drive folder tertentu)
- [ ] Multi-organisasi (satu platform bisa digunakan banyak organisasi, SaaS model)
- [ ] Upload PDF dan video sebagai hasil desain
- [ ] Integrasi Google Calendar untuk sync deadline
- [ ] Laporan analitik performa anggota (charts, grafik)
- [ ] Template tugas (simpan template job desk untuk acara berulang)
- [ ] Mobile app (React Native atau PWA)
- [ ] Sistem invitation link untuk mendaftar ke organisasi
- [ ] Dark mode
- [ ] Notifikasi email selain WhatsApp
- [ ] Timeline/Gantt chart per acara

---

## 16. Future Enhancements

*(Lihat Bagian 15.3 untuk daftar lengkap)*

Prioritas pengembangan pasca-MVP berdasarkan nilai bisnis:

1. **Google Drive API** — Nilai tinggi, menyelesaikan masalah arsip utama
2. **Analytics Dashboard** — Membantu manajemen organisasi membuat keputusan berbasis data
3. **Template Tugas** — Menghemat waktu koordinator saat membuat job desk acara berulang
4. **Multi-organisasi** — Membuka peluang skalabilitas ke banyak organisasi kampus
5. **Mobile App / PWA** — Meningkatkan aksesibilitas untuk anggota yang dominan mobile

---

## 17. Security & Technical Constraints

### 17.1 Firebase Security Rules

**Prinsip Utama:**
- Semua data bersifat private by default.
- User hanya bisa baca data miliknya jika tidak ada role khusus.
- Pengecekan role dilakukan dengan membaca field `role` di dokumen `users/{userId}`.

**Contoh Aturan Firestore:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isSuperAdmin() {
      return getUserRole() == 'super_admin';
    }
    
    function isKoordinator() {
      return getUserRole() in ['super_admin', 'koordinator_divisi', 'koordinator_acara'];
    }
    
    function isOwnDocument(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwnDocument(userId) || isSuperAdmin();
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isSignedIn();
      allow create: if isKoordinator();
      allow update: if isKoordinator() || 
                       (isSignedIn() && resource.data.pic_id == request.auth.uid);
      allow delete: if isSuperAdmin();
    }
    
    // Status logs — append only
    match /tasks/{taskId}/status_logs/{logId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if false; // Immutable
    }
  }
}
```

### 17.2 API Routes Security

- Semua API Routes Next.js harus memverifikasi Firebase ID Token dari header `Authorization: Bearer <token>`.
- Gunakan Firebase Admin SDK di server untuk verifikasi token.
- Gunakan middleware Next.js untuk memvalidasi token di semua route yang protected.

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Verifikasi dilakukan di dalam API Route masing-masing
}
```

### 17.3 Perlindungan API Keys

| Secret | Lokasi | Cara Digunakan |
|---|---|---|
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server env only | Firebase Admin SDK di API Routes |
| `CLOUDINARY_API_SECRET` | Server env only | Cloudinary upload di API Routes |
| `WABLAS_API_TOKEN` | Server env only | Wablas API di API Routes |
| `GEMINI_API_KEY` | Server env only | Gemini API di API Routes |
| `NEXT_PUBLIC_FIREBASE_*` | Client-safe (public prefix) | Firebase SDK di frontend |

**Aturan:**
- Variabel dengan prefix `NEXT_PUBLIC_` boleh digunakan di frontend (sudah didesain Firebase SDK untuk itu).
- Semua secret tanpa prefix `NEXT_PUBLIC_` **hanya boleh ada di server** (API Routes, middleware, server components).
- Jangan pernah hardcode API key di source code.
- Gunakan `.env.local` untuk development, Vercel Environment Variables untuk production.

### 17.4 Validasi Input

- **Upload gambar:** Validasi MIME type di server (bukan hanya ekstensi), cek ukuran maks 10MB.
- **Nomor WhatsApp:** Regex validation format Indonesia `^(\+62|62|0)8[1-9][0-9]{7,10}$`, normalisasi ke `628xxxxxxxxxx`.
- **URL fields:** Validasi format URL dasar sebelum menyimpan ke Firestore.
- **Sanitasi teks:** Pastikan tidak ada script injection di field teks panjang (gunakan DOMPurify untuk render HTML jika diperlukan).
- **Rate limiting:** Implementasi rate limit di API Routes menggunakan Vercel Edge Config atau simple in-memory store.

### 17.5 Constraint Teknis

- Next.js 14+ dengan App Router (bukan Pages Router).
- Semua sensitive operations di Server Components atau API Routes.
- Gunakan `server-only` package untuk file yang tidak boleh diimpor di client.
- Firebase Admin SDK hanya di server; Firebase Client SDK di client.
- Cloudinary upload hanya via server (bukan direct upload dari browser).

---

## 18. Environment Variables

Buat file `.env.local` di root project dengan variabel berikut:

```env
# =============================================
# FIREBASE CLIENT SDK (boleh public, NEXT_PUBLIC prefix)
# =============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jobdex-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jobdex-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jobdex-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://jobdex-xxx-default-rtdb.firebaseio.com

# =============================================
# FIREBASE ADMIN SDK (SERVER ONLY — jangan tambah NEXT_PUBLIC_)
# =============================================
FIREBASE_ADMIN_PROJECT_ID=jobdex-xxx
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@jobdex-xxx.iam.gserviceaccount.com
# Ganti \n dengan actual newline atau encode sebagai base64
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"

# =============================================
# CLOUDINARY (SERVER ONLY)
# =============================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-cloudinary-secret

# =============================================
# WABLAS / WA-BLAST (SERVER ONLY)
# =============================================
WABLAS_API_URL=https://console.wablas.com/api
WABLAS_API_TOKEN=your-wablas-api-token
WABLAS_SECRET_KEY=your-wablas-secret-key
# Nomor/ID grup WhatsApp tujuan notifikasi
WABLAS_GROUP_ID=628xxxxxxxxxx-1234567890@g.us

# =============================================
# GOOGLE GEMINI AI (SERVER ONLY)
# =============================================
GEMINI_API_KEY=AIzaSy...

# =============================================
# APP CONFIG
# =============================================
NEXT_PUBLIC_APP_URL=https://jobdex.in
NEXT_PUBLIC_APP_NAME=JobDex.in
# Untuk cron job Vercel
CRON_SECRET=your-random-secret-for-cron-auth

# =============================================
# DEVELOPMENT ONLY
# =============================================
NODE_ENV=development
```

**Catatan untuk Vercel Deployment:**
- Tambahkan semua variabel di Vercel Dashboard → Project → Settings → Environment Variables.
- Untuk `FIREBASE_ADMIN_PRIVATE_KEY`, gunakan format dengan literal `\n` atau encode ke base64 terlebih dahulu.
- Tandai variabel server-only sebagai "Non-public" di Vercel.

---

## 19. Acceptance Criteria

### AC-01: Autentikasi

| ID | Kriteria | Priority |
|---|---|---|
| AC-01-01 | User dapat mendaftar dengan email, password, nama, dan nomor WhatsApp | P1 |
| AC-01-02 | User dapat login dengan email dan password yang terdaftar | P1 |
| AC-01-03 | User yang belum login di-redirect ke halaman login | P1 |
| AC-01-04 | User dapat logout dari semua perangkat | P1 |
| AC-01-05 | Password reset email terkirim saat klik "Lupa Password" | P2 |
| AC-01-06 | Login dengan Google OAuth berhasil dan role default = anggota | P2 |

### AC-02: Manajemen Anggota

| ID | Kriteria | Priority |
|---|---|---|
| AC-02-01 | Super Admin dan Koordinator dapat melihat daftar semua anggota | P1 |
| AC-02-02 | Super Admin dapat menambah anggota baru secara manual | P1 |
| AC-02-03 | Super Admin dapat mengubah role anggota | P1 |
| AC-02-04 | Anggota dapat mengedit profil sendiri (nama, nomor WA) | P1 |
| AC-02-05 | Akun yang dinonaktifkan tidak bisa login | P1 |

### AC-03: Manajemen Acara

| ID | Kriteria | Priority |
|---|---|---|
| AC-03-01 | Koordinator dapat membuat acara baru dengan semua field wajib | P1 |
| AC-03-02 | Koordinator dapat menambah/hapus anggota dari acara | P1 |
| AC-03-03 | Anggota biasa tidak dapat membuat atau menghapus acara | P1 |
| AC-03-04 | Progress acara ter-update otomatis berdasarkan % tugas approved | P2 |

### AC-04: Manajemen Tugas

| ID | Kriteria | Priority |
|---|---|---|
| AC-04-01 | Koordinator dapat membuat tugas baru (divisi/acara) dengan semua field | P1 |
| AC-04-02 | Koordinator dapat menetapkan PIC dan anggota terlibat ke tugas | P1 |
| AC-04-03 | Anggota hanya dapat melihat tugas yang ditugaskan ke mereka | P1 |
| AC-04-04 | PIC dapat mengubah status tugas miliknya | P1 |
| AC-04-05 | Setiap perubahan status tersimpan di status_logs dengan timestamp | P1 |
| AC-04-06 | Koordinator dapat mengubah status tugas apa saja di koordinasinya | P1 |
| AC-04-07 | Anggota biasa tidak dapat mengubah status tugas orang lain | P1 |
| AC-04-08 | Task Detail Page menampilkan semua data tugas dan riwayat | P1 |

### AC-05: Upload Hasil Desain

| ID | Kriteria | Priority |
|---|---|---|
| AC-05-01 | PIC dapat mengupload gambar (JPG/PNG/WEBP) di Task Detail Page | P1 |
| AC-05-02 | File lebih dari 10MB ditolak dengan pesan error yang jelas | P1 |
| AC-05-03 | File berhasil tersimpan di Cloudinary dan URL tersimpan di Firestore | P1 |
| AC-05-04 | Preview gambar muncul di halaman tugas setelah upload berhasil | P1 |
| AC-05-05 | Status tugas otomatis berubah ke "Menunggu Approval" setelah upload | P1 |
| AC-05-06 | Format file selain JPG/PNG/WEBP ditolak | P1 |

### AC-06: Notifikasi WhatsApp

| ID | Kriteria | Priority |
|---|---|---|
| AC-06-01 | Notifikasi terkirim ke grup WA saat tugas baru dibuat | P1 |
| AC-06-02 | Notifikasi terkirim saat status tugas berubah | P1 |
| AC-06-03 | Notifikasi terkirim saat anggota upload hasil desain | P1 |
| AC-06-04 | Notifikasi terkirim saat koordinator approve atau minta revisi | P1 |
| AC-06-05 | Semua notifikasi tercatat di collection whatsapp_logs | P1 |
| AC-06-06 | Kegagalan pengiriman WA tidak menyebabkan error di UI | P1 |

### AC-07: Approval dan Revisi

| ID | Kriteria | Priority |
|---|---|---|
| AC-07-01 | Koordinator dapat menekan tombol "Approve" di Task Detail Page | P1 |
| AC-07-02 | Setelah di-approve, status tugas berubah ke "Approved / Selesai" | P1 |
| AC-07-03 | Koordinator dapat menekan "Minta Revisi" dan mengisi catatan revisi | P1 |
| AC-07-04 | Catatan revisi tersimpan di field revision_notes dan activity log | P1 |
| AC-07-05 | Anggota biasa tidak dapat menekan tombol Approve | P1 |

### AC-08: Arsip Referensi

| ID | Kriteria | Priority |
|---|---|---|
| AC-08-01 | Koordinator dapat menambah referensi desain baru ke arsip | P1 |
| AC-08-02 | Semua anggota dapat melihat arsip referensi | P1 |
| AC-08-03 | Arsip dapat difilter berdasarkan jenis desain dan tahun | P2 |
| AC-08-04 | Anggota biasa tidak dapat mengedit atau menghapus referensi | P1 |

### AC-09: Dashboard

| ID | Kriteria | Priority |
|---|---|---|
| AC-09-01 | Dashboard menampilkan jumlah tugas per status (sesuai role) | P1 |
| AC-09-02 | Widget "Deadline Dekat" menampilkan tugas dengan deadline ≤ 3 hari | P1 |
| AC-09-03 | Anggota hanya melihat data tugas miliknya di Dashboard | P1 |
| AC-09-04 | Koordinator melihat data semua tugas di bawah koordinasinya | P1 |

### AC-10: Keamanan

| ID | Kriteria | Priority |
|---|---|---|
| AC-10-01 | Firebase Security Rules mencegah akses tidak sah ke data | P1 |
| AC-10-02 | API Routes memverifikasi Firebase ID Token sebelum memproses | P1 |
| AC-10-03 | Tidak ada API key (Cloudinary, Wablas, Gemini) yang terekspos di frontend | P1 |
| AC-10-04 | Upload gambar hanya bisa dilakukan oleh PIC tugas tersebut | P1 |

---

## 20. Development Notes for AI Coder

### 20.1 Project Structure (Next.js App Router)

```
jobdex/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── register/page.jsx
│   ├── (dashboard)/
│   │   ├── layout.jsx           # Sidebar + auth check
│   │   ├── dashboard/page.jsx
│   │   ├── members/page.jsx
│   │   ├── division-tasks/page.jsx
│   │   ├── events/
│   │   │   ├── page.jsx         # Daftar acara
│   │   │   └── [eventId]/page.jsx  # Detail acara
│   │   ├── tasks/
│   │   │   └── [taskId]/page.jsx   # Task detail page
│   │   ├── archive/page.jsx
│   │   └── ai-assistant/page.jsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js  (tidak diperlukan jika pure Firebase)
│   │   ├── tasks/
│   │   │   ├── route.js          # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.js      # GET, PUT, DELETE
│   │   │       └── status/route.js  # PATCH status
│   │   ├── upload/route.js
│   │   ├── notifications/
│   │   │   └── whatsapp/route.js
│   │   ├── ai/
│   │   │   └── query/route.js
│   │   └── cron/
│   │       └── deadline-reminder/route.js
│   ├── layout.jsx               # Root layout
│   └── page.jsx                 # Landing page
├── components/
│   ├── ui/                      # Reusable UI primitives
│   ├── task/
│   │   ├── TaskTable.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskDetailDrawer.jsx
│   │   ├── TaskStatusBadge.jsx
│   │   └── UploadSection.jsx
│   ├── dashboard/
│   │   ├── StatsWidget.jsx
│   │   └── DeadlineAlert.jsx
│   └── ai/
│       └── AIAssistantPanel.jsx
├── lib/
│   ├── firebase/
│   │   ├── client.js            # Firebase Client SDK init
│   │   ├── admin.js             # Firebase Admin SDK init (server-only)
│   │   └── db.js                # Firestore helper functions
│   ├── cloudinary.js            # Cloudinary server helper
│   ├── wablas.js                # Wablas notification helper
│   └── gemini.js                # Gemini AI helper
├── hooks/
│   ├── useAuth.js               # Auth context hook
│   ├── useTasks.js              # Firestore tasks hook
│   └── useRole.js               # Role check hook
├── context/
│   └── AuthContext.jsx
├── middleware.js                # Route protection
├── .env.local
└── vercel.json                  # Cron config
```

### 20.2 Urutan Pengembangan yang Disarankan

Ikuti urutan ini untuk menghindari ketergantungan yang tidak perlu:

1. Setup project: `npx create-next-app@latest jobdex --typescript --tailwind --app`
2. Install dependencies: `firebase`, `firebase-admin`, `cloudinary`, `@google/generative-ai`
3. Konfigurasi Firebase (Auth + Firestore + RTDB)
4. Implementasi AuthContext dan middleware proteksi route
5. Landing page (statis)
6. Login + Register page
7. Layout dashboard (sidebar + header)
8. Dashboard page (widget dengan data dummy dulu)
9. Manajemen Anggota (CRUD)
10. Job Desk Divisi (CRUD tugas)
11. Job Desk Acara (CRUD acara + tugas)
12. Task Detail Page + perubahan status
13. Upload gambar (Cloudinary integration)
14. WhatsApp notifications (Wablas)
15. Arsip Referensi Desain
16. Firebase Security Rules
17. Testing dan bug fixing
18. Deploy ke Vercel

### 20.3 Packages yang Direkomendasikan

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "firebase": "^10.x",
    "firebase-admin": "^12.x",
    "cloudinary": "^2.x",
    "@google/generative-ai": "^0.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "axios": "^1.x"
  }
}
```

Opsional UI Library (pilih salah satu):
- **shadcn/ui** (rekomendasi — component-by-component, tidak membebani bundle)
- **Radix UI** primitives langsung

### 20.4 Pola Kode Penting

**Firebase Auth Token Verification di API Routes:**
```javascript
// lib/firebase/admin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length === 0 
  ? initializeApp({ credential: cert({ ... }) }) 
  : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// Di setiap API Route:
const token = request.headers.get('Authorization')?.split('Bearer ')[1];
const decodedToken = await adminAuth.verifyIdToken(token);
const userId = decodedToken.uid;
```

**Mengirim Request dari Client ke API Route:**
```javascript
// Selalu sertakan Firebase ID Token
const user = auth.currentUser;
const token = await user.getIdToken();

const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(taskData),
});
```

**Firestore Query dengan Pagination:**
```javascript
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

const TASKS_PER_PAGE = 20;

const q = query(
  collection(db, 'tasks'),
  where('organization_id', '==', orgId),
  where('pic_id', '==', userId),
  orderBy('deadline', 'asc'),
  limit(TASKS_PER_PAGE),
  startAfter(lastDocument) // untuk halaman berikutnya
);
```

### 20.5 Hal-hal yang Perlu Diperhatikan

- **Firebase Admin Private Key:** Saat menyimpan di environment variable, private key berisi newline `\n`. Di Vercel, masukkan apa adanya (dengan newline literal). Di `.env.local`, escape menjadi `\\n` atau bungkus dengan tanda kutip.
- **Cloudinary Upload:** Jangan gunakan unsigned upload dari client. Selalu gunakan server-side upload via API Route untuk keamanan.
- **Wablas Rate Limit:** Beri jeda minimal 1 detik antar notifikasi untuk menghindari throttling.
- **Gemini Context Limit:** Model `gemini-1.5-flash` memiliki context window yang besar, tetapi tetap ringkas data yang dikirim (hanya field yang relevan) untuk efisiensi biaya dan kecepatan.
- **Firebase Realtime Database untuk Komentar:** Gunakan `onValue` listener di client untuk subscribe perubahan komentar secara real-time. Jangan lupa unsubscribe saat component unmount.
- **Firestore Indexes:** Setiap compound query (`where` + `orderBy` pada field berbeda) memerlukan index komposit. Buat di Firebase Console atau via `firestore.indexes.json`.
- **Vercel Cron:** Free plan Vercel mendukung 2 cron jobs. Gunakan bijak. Untuk deadline reminder, satu cron harian sudah cukup.

---

*Dokumen PRD ini dibuat untuk keperluan pengembangan JobDex.in versi MVP. Revisi dapat dilakukan berdasarkan feedback pengguna setelah deployment pertama. Semua keputusan desain di sini didasarkan pada kebutuhan operasional divisi Humas & Media Kreatif organisasi mahasiswa.*

---

**Versi Dokumen:**
- v1.0 — Mei 2026 — Inisiasi PRD lengkap untuk MVP
