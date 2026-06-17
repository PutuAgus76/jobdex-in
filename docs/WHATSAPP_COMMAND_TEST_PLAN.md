# WHATSAPP_COMMAND_TEST_PLAN.md
# Test Plan: WhatsApp Command `!jobdex`
# Fase 22C — Penyempurnaan & Hardening

> **Test Group**: `120363406824082148`
> **Jangan test di grup produksi.**
> **Jangan tampilkan token/API key/secret.**

---

## Daftar Test Case

### TC-01 — Bantuan Role-Aware (`!jobdex bantuan task`)

| # | Skenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | User role = `anggota` | `!jobdex bantuan task` | Hanya tampil command anggota: tugas saya, detail, update, upload, checklist, catatan, cari |
| 2 | User role = `koordinator_divisi` | `!jobdex bantuan task` | Tampil semua command anggota + bagian "Tambahan untuk Koordinator" |
| 3 | User role = `super_admin` | `!jobdex bantuan task` | Tampil semua command termasuk "Tambahan untuk Super Admin" |
| 4 | Nama pengirim disapa | `!jobdex bantuan task` | Pesan berisi `Halo [Nama],` |

---

### TC-02 — Deadline Query Scope (`!jobdex deadline dekat`)

| # | Skenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | User `anggota` — tidak ada task miliknya | `!jobdex deadline dekat` | "Belum ada tugas kamu yang masuk kategori ini." |
| 2 | User `anggota` — ada task sebagai PIC | `!jobdex deadline dekat` | Hanya task di mana `pic_id === user.id` |
| 3 | User `koordinator_divisi` | `!jobdex deadline dekat` | Hanya task `type=divisi` dengan `division_id === user.division_id` |
| 4 | User `koordinator_acara` | `!jobdex deadline dekat` | Hanya task `type=acara` dengan `coordinator_id === user.id` |
| 5 | User `super_admin` | `!jobdex deadline dekat` | Semua task sesuai query |
| 6 | Query type overdue | `!jobdex tugas overdue` | Task dengan deadline sudah lewat |
| 7 | Output capped | — (>10 task tersedia) | Maks 10 task ditampilkan + catatan "...dan N tugas lainnya" |

---

### TC-03 — Preview Ownership (`!jobdex konfirmasi / !jobdex batal`)

| # | Skenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | User konfirmasi preview milik orang lain | `!jobdex konfirmasi ABCDEF` | Error: "Preview ID ini dibuat oleh pengguna lain" |
| 2 | Super admin konfirmasi preview orang lain | `!jobdex konfirmasi ABCDEF` | ✅ Diizinkan |
| 3 | Pembuat preview konfirmasi miliknya sendiri | `!jobdex konfirmasi ABCDEF` | ✅ Preview dieksekusi |
| 4 | User batal preview milik orang lain | `!jobdex batal ABCDEF` | Error: "Preview ID ini dibuat oleh pengguna lain" |
| 5 | Kode tidak ada di sistem | `!jobdex konfirmasi XXXXXX` | Error: "Preview ID tidak ditemukan" |
| 6 | Kode sudah expired | `!jobdex konfirmasi ABCDEF` | Error: "sudah kedaluwarsa (Batas waktu 30 menit)" |

---

### TC-04 — Confirm Edit Ownership (`!jobdex konfirmasi edit EDTXXX`)

| # | Skenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | User konfirmasi edit milik orang lain | `!jobdex konfirmasi edit EDTABC` | Error: "Preview ID ini dibuat oleh pengguna lain" |
| 2 | Super admin konfirmasi edit orang lain | `!jobdex konfirmasi edit EDTABC` | ✅ Diizinkan |
| 3 | Kode expired | `!jobdex konfirmasi edit EDTABC` | Error: "Kode edit telah kadaluwarsa (batas 30 menit)" |
| 4 | Kode tidak ada | `!jobdex konfirmasi edit INVALID` | Error: "Kode edit tidak ditemukan atau sudah diproses" |

---

### TC-05 — Template Help Static (`!jobdex format jobdesk`)

| # | Skenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Format jobdesk | `!jobdex format jobdesk` | Format tambah jobdesk dengan semua field (tanpa AI fallback) |
| 2 | Format referensi | `!jobdex format referensi` | Format tambah referensi dengan field: judul, jenis, acara, tahun, link |
| 3 | Format acara | `!jobdex format acara` | Format tambah acara dengan field: nama, tanggal, koordinator, deskripsi |
| 4 | Tidak ada AI log dibuat | — | Tidak ada entry di `ai_logs` collection untuk intent ini |

---

### TC-06 — Progress Question (`!jobdex gimana progress?`)

| # | Skenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Pertanyaan progress natural | `!jobdex gimana progress task?` | Mengarahkan ke daftar command: deadline dekat, tugas overdue, briefing, dll |
| 2 | Pertanyaan stuck | `!jobdex siapa yang stuck?` | Mengarahkan ke daftar command spesifik |
| 3 | Tidak ada AI fallback | — | Tidak ada entry `ai_logs` untuk intent ini |

---

### TC-07 — Error Label Konsistensi

| # | Skenario | Expected Output |
|---|----------|-----------------|
| 1 | Task tidak ditemukan | Pesan diawali dengan label yang benar, misal `[*JobdexIn* Detail Task]` |
| 2 | Upload hasil tanpa link | Label `[*JobdexIn* Upload Hasil]` bukan literal `${WA_LABEL.uploadHasil}` |
| 3 | Kode edit expired | Label `[*JobdexIn* Confirm Edit]` bukan literal string |

---

### TC-08 — Negative Test: Invalid Commands

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `!jobdex approve task XYZ` (dead code path) | Ditangkap di handler `approve_task` yang benar |
| 2 | `!jobdex tugas` (tanpa spesifikasi) | Terparse sebagai `tugas_saya` atau fallback dengan pesan bantuan |

---

## Simulasi Response Bot

Berikut contoh simulasi output yang diharapkan untuk beberapa test case penting:

### TC-01.1 — Bantuan Anggota
```
[*JobdexIn* Bantuan]

Halo Budi Santoso,
📋 Command untuk Anggota:
- !jobdex tugas saya
- !jobdex detail task [nama task]
- !jobdex update status [nama task] menjadi [status]
...

Format lengkap: !jobdex format jobdesk
Referensi: !jobdex format referensi
```

### TC-02.1 — Deadline Anggota (kosong)
```
[*JobdexIn* Deadline]

Saya hanya menampilkan tugas yang menjadi tanggung jawab kamu.

Belum ada tugas kamu yang masuk kategori ini.
```

### TC-03.1 — Konfirmasi Orang Lain
```
[*JobdexIn* Akses Ditolak]

Preview ID ini dibuat oleh pengguna lain, sehingga tidak bisa kamu konfirmasi.

Minta pembuat preview untuk mengonfirmasi sendiri, atau hubungi super admin.
```

### TC-05.1 — Format Jobdesk
```
[*JobdexIn* Bantuan]

Format tambah jobdesk:

!jobdex tambah jobdesk
judul: [Nama task]
tipe: divisi / acara
pic: [Nama pelaksana]
deadline: [dd Bulan yyyy]
prioritas: rendah / sedang / tinggi / kritis
acara: [Nama acara] (jika tipe acara)
deskripsi: [Deskripsi singkat]
redaksi: [Teks redaksi/copywriting]
referensi: [URL referensi]
warna: [Warna palette]
arahan visual: [Arahan desain]

Contoh bulk: !jobdex bantuan koordinator
```

---

## Tabel Manual & Simulated Test Matrix

| Command | Role Penguji | Lokasi | Expected Response | Data yang Dibaca | Data yang Diubah | Risiko | Status Test |
|---|---|---|---|---|---|---|---|
| `!jobdex bantuan` | Anggota | Personal/Grup | Menyapa pengirim, menampilkan command khusus anggota (tugas saya, detail, update, upload, checklist, dll.), tanpa AI fallback. | User Profile pengirim | Tidak ada | Sangat rendah | Simulated / Manual |
| `!jobdex bantuan` | Koordinator | Personal/Grup | Menyapa pengirim, menampilkan command anggota + koordinator (briefing, siapa belum update, deadline dekat, ganti pic, tambah jobdesk, dll.). | User Profile pengirim | Tidak ada | Sangat rendah | Simulated / Manual |
| `!jobdex deadline dekat` | Anggota | Personal/Grup | Hanya menampilkan tugas PIC = user pengirim yang deadline <= 5 hari. Jika kosong, menjawab ramah. | Firestore `tasks`, `users`, `events` | Tidak ada | Rendah (tidak bocor data lintas role) | Simulated / Manual |
| `!jobdex deadline dekat` | Koordinator Divisi | Personal/Grup | Menampilkan semua tugas berisiko/deadline dekat di dalam divisinya. | Firestore `tasks` | Tidak ada | Rendah | Simulated / Manual |
| `!jobdex deadline dekat` | Super Admin | Personal/Grup | Menampilkan semua tugas berisiko/deadline dekat lintas divisi/acara. | Firestore `tasks` | Tidak ada | Rendah | Simulated / Manual |
| `!jobdex konfirmasi ABCDEF` (preview milik orang lain) | Koordinator | Personal/Grup | Akses Ditolak: "Preview ID ini dibuat oleh pengguna lain, sehingga tidak bisa kamu konfirmasi." | Firestore `ai_command_previews` | Tidak ada | Rendah | Simulated / Manual |
| `!jobdex konfirmasi ABCDEF` (preview sendiri) | Koordinator | Personal/Grup | Membuat tugas/data sesuai preview dan membalas sukses. | Firestore `ai_command_previews`, users, events | Membuat task baru di Firestore | Sedang (menambah data baru) | Simulated / Manual |
| `!jobdex format jobdesk` | Siapa saja | Personal/Grup | Menampilkan template statis format tambah jobdesk secara instan tanpa memanggil AI. | Tidak ada | Tidak ada | Sangat rendah | Simulated / Manual |
| `!jobdex siapa yang stuck?` | Koordinator/Admin | Personal/Grup | Mengarahkan ke daftar command progress terstruktur (deadline dekat, tugas overdue, briefing, dll.) tanpa AI fallback. | Tidak ada | Tidak ada | Sangat rendah | Simulated / Manual |
| `!jobdex update status [task test] menjadi sedang dikerjakan` | PIC / Koordinator / Admin | Personal/Grup | Mengupdate status task dan mencatat log status. | Firestore `tasks` | Mengupdate field `status`, `updated_at`, menambah `status_logs` | Rendah (hanya mengubah data test) | Simulated / Manual |
| `!jobdex approve task [task test]` | Koordinator / Admin | Personal/Grup | Melakukan approval pada task. | Firestore `tasks` | Mengupdate `status` menjadi `approved`, `approval_status`, menambah log | Rendah (hanya mengubah data test) | Simulated / Manual |

---

## Alasan Live Test Tidak Dilakukan Secara Penuh di WhatsApp

1. **Webhook Localhost**: Server lokal berjalan di port `3000` (`http://localhost:3000`) dan tidak dapat menerima request webhook eksternal dari API Wablas secara langsung tanpa konfigurasi tunnel publik (seperti Ngrok atau Cloudflare Tunnel).
2. **Keamanan Data Produksi**: Beberapa command write dapat mengubah atau menambah data secara permanen, sehingga lebih aman disimulasikan terlebih dahulu secara lokal sebelum dieksekusi langsung di database produksi.
3. **Keterbatasan API/Wablas Token Rate-limiting**: Menghindari pemborosan token API/Gemini dan potensi rate-limiting pada API Wablas selama masa development local.

---

## Command yang Dapat Dijalankan Manual di Grup Test `120363406824082148` (Sesudah Deploy)

Jika deploy sudah disetujui, kirimkan command berikut ke grup test WhatsApp:
1. `!jobdex cek pengirim` (Verifikasi nomor terdaftar & role)
2. `!jobdex bantuan` (Verifikasi bantuan role-aware)
3. `!jobdex format jobdesk` (Verifikasi template statis)
4. `!jobdex deadline dekat` (Verifikasi RBAC/Scope filter)
5. `!jobdex siapa yang stuck?` (Verifikasi intent redirect / progress question)
6. `!jobdex cari desain` (Verifikasi AI reference search)

