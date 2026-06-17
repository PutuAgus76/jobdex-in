# WhatsApp Bot JobDex.in Command Documentation

Dokumentasi ini menjelaskan seluruh perintah (commands) WhatsApp bot JobDex.in (menggunakan prefix `!jobdex`), alur otorisasi, hak akses (RBAC), matriks keamanan, serta catatan teknis hasil audit.

---

## 1. Overview WhatsApp Bot JobDex.in

WhatsApp Bot JobDex.in adalah asisten berbasis AI dan task automation yang terintegrasi langsung dengan database Firestore. Bot ini mempermudah koordinasi antar anggota organisasi mahasiswa khususnya divisi Humas dan Media Kreatif/Pubdok.

Fitur utama bot meliputi:
* **Workflow Automation**: Update status tugas, pengiriman hasil pekerjaan (upload), permintaan revisi, penuntasan checklist, dan pengarsipan tugas.
* **Informasi & Monitoring**: Cek detail tugas, tugas aktif individu (tugas saya), briefing ringkas harian, serta laporan keterlambatan pic (siapa belum update).
* **AI Assistant**: Pencarian referensi desain di database internal, panduan format interaktif, dan tanya jawab umum seputar job desk organisasi.
* **Manajemen Perutean**: Menghubungkan grup WhatsApp khusus ke acara/event tertentu untuk pengiriman reminder terjadwal secara dinamis.

---

## 2. Prefix Command

Seluruh perintah yang dikenali oleh bot **wajib** diawali dengan prefix:

```txt
!jobdex
```

Setiap pesan yang tidak diawali dengan prefix `!jobdex` akan diabaikan secara otomatis oleh webhook handler.

---

## 3. Ringkasan Semua Command

Berikut adalah tabel ringkasan seluruh command `!jobdex` yang didukung oleh sistem saat ini:

| No. | Command | Intent Internal | Fungsi | Role yang Boleh | Personal/Grup | Mengubah Data? | Handler File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `!jobdex cek grup` | `cek_grup` | Mengecek status grup WhatsApp (koneksi event/divisi) | Semua terdaftar | Grup / Personal | Tidak | [route.ts](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) |
| 2 | `!jobdex cek role saya` | `cek_role` | Mengecek peran/role pengirim di JobDex.in | Semua terdaftar | Grup / Personal | Tidak | [route.ts](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) |
| 3 | `!jobdex cek pengirim` | `cek_pengirim` | Menampilkan nomor JID dan profile pengirim | Siapa saja (buka auth) | Grup / Personal | Tidak | [route.ts](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) |
| 4 | `!jobdex briefing` | `briefing` | Laporan ringkasan statistik status pengerjaan tugas | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Tidak | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 5 | `!jobdex siapa belum update` | `siapa_belum_update` | Daftar PIC yang belum update task >= 2 hari | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Tidak | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 6 | `!jobdex hubungkan grup acara [nama]` | `hubungkan_grup_acara` | Menghubungkan grup WhatsApp saat ini ke acara | Super Admin, Koord Acara, Koord Divisi | Hanya Grup | Ya (Events, Logs) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 7 | `!jobdex tugas saya` | `tugas_saya` | Menampilkan daftar tugas aktif (belum disetujui) PIC | Semua terdaftar | Grup / Personal | Tidak | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 8 | `!jobdex detail task [nama/kode]` | `detail_task` | Menampilkan detail lengkap suatu tugas | Semua terdaftar | Grup / Personal | Tidak | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 9 | `!jobdex upload hasil [nama/kode]` | `upload_hasil` | Mengirim link hasil pengerjaan (draft/final) | Super Admin, Koord Divisi, Koord Acara, PIC | Grup / Personal | Ya (Tasks, Logs, Events) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 10 | `!jobdex minta revisi [nama/kode]` | `minta_revisi` | Mengubah status task menjadi perlu revisi | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Tasks, Logs, Events) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 11 | `!jobdex cek checklist [nama/kode]` | `cek_checklist` | Menampilkan checklist pekerjaan dari suatu tugas | Semua terdaftar | Grup / Personal | Tidak | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 12 | `!jobdex tambah catatan [nama/kode]` | `tambah_catatan` | Menambahkan catatan log pengerjaan tugas | Super Admin, Koord Divisi, Koord Acara, PIC | Grup / Personal | Ya (Tasks, Logs) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 13 | `!jobdex ganti pic [nama/kode] ke [pic]` | `ganti_pic` | Mengganti pelaksana (PIC) suatu tugas | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Tasks, Logs) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 14 | `!jobdex bantuan` | `bantuan_task` | Menampilkan panduan teks daftar perintah | Semua terdaftar | Grup / Personal | Tidak | [route.ts](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) |
| 15 | `!jobdex update status [nama/kode] ...` | `update_status` | Memperbarui status tugas (+ catatan kendala) | Super Admin, Koord Divisi, Koord Acara, PIC | Grup / Personal | Ya (Tasks, Logs) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 16 | `!jobdex approve task [nama/kode]` | `approve_task` | Menyetujui hasil pekerjaan tugas (approved) | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Tasks, Logs) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 17 | `!jobdex checklist [nama/kode] [item] selesai` | `checklist_task` | Menandai satu item checklist tugas selesai | Super Admin, Koord Divisi, Koord Acara, PIC | Grup / Personal | Ya (Tasks, Logs) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 18 | `!jobdex archive task [nama/kode]` | `archive_task` | Mengajukan draf pengarsipan tugas (membuat ARC) | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Previews) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 19 | `!jobdex konfirmasi archive [kode]` | `confirm_archive` | Mengonfirmasi draf pengarsipan (ARC) ke database | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Tasks, Logs, Previews) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 20 | `!jobdex edit task [nama/kode]` | `edit_task` | Mengajukan draf perubahan detail tugas (EDT) | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Previews) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 21 | `!jobdex konfirmasi edit [kode]` | `confirm_edit` | Mengonfirmasi draf perubahan (EDT) ke database | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Tasks, Logs, Previews) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 22 | `!jobdex batal edit [kode]` | `cancel_edit` | Membatalkan draf perubahan (EDT) pending | Semua terdaftar | Grup / Personal | Ya (Previews) | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 23 | `!jobdex deadline [kategori]` | `deadline_query` | Membaca daftar tugas berisiko berdasarkan deadline | Semua terdaftar | Grup / Personal | Tidak | [whatsapp-task-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts) |
| 24 | `!jobdex tambah jobdesk` | `create_task_preview` | Mengajukan draf penambahan tugas baru (Preview) | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Previews) | [whatsapp-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts) |
| 25 | `!jobdex tambah banyak jobdesk` | `bulk_create_task_preview` | Mengajukan draf penambahan banyak tugas sekaligus | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Previews) | [whatsapp-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts) |
| 26 | `!jobdex tambah acara` | `create_event_preview` | Mengajukan draf pembuatan acara baru (Preview) | Super Admin, Koord Divisi | Grup / Personal | Ya (Previews) | [whatsapp-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts) |
| 27 | `!jobdex tambah referensi` | `create_reference_preview` | Mengajukan draf penambahan referensi desain (Preview) | Super Admin, Koord Divisi, Koord Acara | Grup / Personal | Ya (Previews) | [whatsapp-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts) |
| 28 | `!jobdex konfirmasi [PREVIEW_ID]` | `confirm_command` | Mengeksekusi draf (tambah tugas/acara/referensi) | Sesuai permission entity | Grup / Personal | Ya (Entities, Previews) | [whatsapp-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts) |
| 29 | `!jobdex batal [PREVIEW_ID]` | `cancel_command` | Membatalkan draf (tambah tugas/acara/referensi) | Semua terdaftar | Grup / Personal | Ya (Previews) | [whatsapp-command-executor.ts](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts) |
| 30 | `!jobdex event grup` | `event_grup` | Menampilkan semua acara yang terhubung ke grup WA | Semua terdaftar | Grup / Personal | Tidak | [route.ts](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) |
| 31 | `!jobdex cari [keyword]` | `reference_search` | Mencari referensi desain dari database internal | Semua terdaftar | Grup / Personal | Tidak (hanya AI log) | [reference-search.ts](file:///D:/Download/jobdescin/src/lib/server/reference-search.ts) |
| 32 | `!jobdex [pertanyaan bebas]` | `gemini_fallback` | Tanya jawab asisten umum JobDex.in | Semua terdaftar | Grup / Personal | Tidak (hanya AI log) | [route.ts](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) |

---

## 4. Detail Command Satu per Satu

Berikut adalah spesifikasi teknis dan fungsional dari masing-masing command yang ditemukan di source code JobDex.in:

### 4.1. `!jobdex cek grup`
* **Intent Internal**: `cek_grup`
* **Format**: `!jobdex cek grup`
* **Variasi Parser**: `cek grup`
* **Fungsi**: Mengecek apakah grup WhatsApp yang sedang digunakan sudah terhubung ke event/divisi di JobDex.in.
* **Role Pengguna**: Semua user terdaftar (tidak dibatasi role).
* **Tempat**: Grup WhatsApp (jika personal chat, info grup akan terdeteksi kosong).
* **Data yang Dibaca**: `events` (via `findEventByGroupId`), `divisions` (membandingkan `whatsapp_group_id`).
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex cek grup
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Debug Grup]

  Group ID: 120363427255190681
  Group Name: SIE PUBDOK RAKER 2026
  Terhubung ke event: RAKER 2026
  Terhubung ke divisi: -
  Status: Terhubung
  ```
* **Contoh Output Gagal/Belum Terhubung**:
  ```txt
  [*JobdexIn* Debug Grup]

  Group ID: 120363427255190681
  Group Name: Group Test
  Terhubung ke event: -
  Terhubung ke divisi: -
  Status: Belum terhubung
  ```
* **Contoh Output Akses Ditolak (Nomor Tidak Terdaftar)**:
  ```txt
  [*JobdexIn* Auth]

  Nomor WhatsApp kamu terdeteksi: 628123456789

  Namun nomor ini belum terhubung dengan akun JobdexIn.
  Silakan hubungi admin untuk menambahkan nomor WhatsApp ke profil akun.
  ```

---

### 4.2. `!jobdex cek role saya`
* **Intent Internal**: `cek_role`
* **Format**: `!jobdex cek role saya`
* **Variasi Parser**: `cek role saya`, `cek role`
* **Fungsi**: Mengecek status role pengguna pengirim yang terdaftar di sistem.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `users` (pencarian berdasarkan nomor WhatsApp JID).
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex cek role saya
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Cek Role]

  Halo Putu Agus,
  Nomor terdeteksi: 628123456789
  Role Anda saat ini: Koordinator Divisi
  ```

---

### 4.3. `!jobdex cek pengirim`
* **Intent Internal**: `cek_pengirim`
* **Format**: `!jobdex cek pengirim`
* **Variasi Parser**: `cek pengirim`
* **Fungsi**: Menampilkan detail nomor WhatsApp pengirim dan status terhubungnya di sistem. Merupakan command utilitas debug publik yang tidak memerlukan registrasi.
* **Role Pengguna**: Siapa saja (bypasses auth check).
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `users` (mencocokkan nomor WhatsApp).
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex cek pengirim
  ```
* **Contoh Output**:
  ```txt
  [*JobdexIn* Debug Pengirim]

  Nomor terdeteksi: 628123456789
  Sumber: group.sender
  User: Putu Agus
  Role: Koordinator Divisi
  Group ID: 120363427255190681
  ```

---

### 4.4. `!jobdex briefing`
* **Intent Internal**: `briefing`
* **Format**: `!jobdex briefing`
* **Variasi Parser**: `briefing`
* **Fungsi**: Menghasilkan briefing ringkas berisi rekap jumlah task yang overdue, menunggu approval, stuck/butuh bantuan, dan deadline hari ini sesuai cakupan role pengirim.
* **Role Pengguna**: `super_admin` (global), `koordinator_divisi` (hanya divisi terkait), `koordinator_acara` (hanya acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks` (di mana `is_archived == false`).
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex briefing
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Briefing]

  Halo Putu Agus, ini ringkasan task yang perlu diperhatikan hari ini:

  🔴 2 task overdue
  ⏳ 1 task menunggu approval
  ⚠️ 0 task stuck / butuh bantuan
  📅 1 task deadline hari ini

  Ketik !jobdex tugas overdue atau !jobdex menunggu approval untuk detailnya.
  ```

---

### 4.5. `!jobdex siapa belum update`
* **Intent Internal**: `siapa_belum_update`
* **Format**: `!jobdex siapa belum update`
* **Variasi Parser**: `siapa belum update`
* **Fungsi**: Menampilkan daftar pelaksana (PIC) tugas aktif yang tidak melakukan pembaruan (update) status/catatan pengerjaan selama 2 hari atau lebih.
* **Role Pengguna**: `super_admin`, `koordinator_divisi`, `koordinator_acara`. `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`.
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex siapa belum update
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Siapa Belum Update]

  Daftar PIC yang belum update progress task (>= 2 hari):

  1. Made Anggota: 2 task belum diupdate
  2. Ketut Anggota: 1 task belum diupdate

  Saran: Hubungi PIC terkait untuk menanyakan progress.
  ```

---

### 4.6. `!jobdex hubungkan grup acara [nama]`
* **Intent Internal**: `hubungkan_grup_acara`
* **Format**: `!jobdex hubungkan grup acara [Nama Acara]`
* **Variasi Parser**: `hubungkan grup acara [nama]`, `hubungkan grup acara [nama]`
* **Fungsi**: Menghubungkan grup WhatsApp saat ini dengan acara tertentu. Jika terhubung, notifikasi dan rekap mingguan acara tersebut akan diarahkan ke grup ini.
* **Role Pengguna**: `super_admin` (global), `koordinator_acara` (khusus acara miliknya), `koordinator_divisi` (hanya jika divisinya memiliki setidaknya satu tugas di acara tersebut). `anggota` ditolak.
* **Tempat**: Hanya Grup WhatsApp (akan gagal di personal chat).
* **Data yang Dibaca**: `events` (via fuzzy matching nama), `users`, `divisions`, `tasks`.
* **Data yang Diubah**: `events` (menyimpan `whatsapp_group_id`, `whatsapp_group_name`, `whatsapp_group_verified = true`, linked timestamp & user), `activity_logs` (menambahkan log aktivitas).
* **Contoh Input**:
  ```txt
  !jobdex hubungkan grup acara RAKER 2026
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Grup Acara]

  Grup ini berhasil dihubungkan ke acara:
  RAKER 2026

  Group ID: 120363427255190681
  Mulai sekarang reminder untuk task acara ini akan diarahkan ke grup ini.
  ```

---

### 4.7. `!jobdex tugas saya`
* **Intent Internal**: `tugas_saya`
* **Format**: `!jobdex tugas saya [variasi]`
* **Variasi Parser**: 
  - `tugas saya` (default/semua tugas aktif)
  - `tugas saya minggu ini`
  - `tugas saya belum selesai`
  - `tugas saya deadline dekat`
* **Fungsi**: Menampilkan daftar tugas aktif yang didelegasikan kepada pengirim (PIC) beserta status, prioritas, dan sisa hari deadline (misal H-3, Overdue).
* **Role Pengguna**: Semua user terdaftar (terutama role `anggota`/PIC).
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks` (filter `pic_id == user.id` dan `status != approved` dan `is_archived == false`), `events`, `divisions`.
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex tugas saya minggu ini
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Tugas Saya]

  Halo Made Anggota, berikut tugas aktif kamu:

  1. Desain feed opening
     Status: Sedang Dikerjakan
     Prioritas: Tinggi
     Deadline: 18 Juni 2026 (H-1)
     Acara/Divisi: RAKER 2026
  ```

---

### 4.8. `!jobdex detail task [nama/kode]`
* **Intent Internal**: `detail_task`
* **Format**: `!jobdex detail task [nama task]` atau `!jobdex detail task kode [KODE]`
* **Variasi Parser**: `detail task [nama/kode]`, `detail jobdesk [nama/kode]`
* **Fungsi**: Menampilkan spesifikasi teknis lengkap dari satu tugas (PIC, deadline, redaksi copy, link referensi, arahan visual, status penyelesaian checklist, dan catatan perubahan terakhir).
* **Role Pengguna**: 
  - `super_admin` (global akses)
  - `koordinator_divisi` (hanya tugas divisi terkait)
  - `koordinator_acara` (hanya tugas acara terkait)
  - `anggota` (hanya tugas yang pic_id-nya === user.id)
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks` (termasuk subcollection `status_logs`), `users`, `events`, `divisions`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `whatsapp_task_candidates` (jika nama task bermakna ganda/ambigu, sistem menulis kode kandidat sementara).
* **Contoh Input**:
  ```txt
  !jobdex detail task Desain feed
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Detail Task]

  Task: Desain feed opening
  Status: Sedang Dikerjakan
  Prioritas: Tinggi
  PIC: Made Anggota
  Deadline: 18 Juni 2026 (H-1)
  Acara/Divisi: RAKER 2026

  Redaksi:
  Materi redaksi HUT RI ke-81 terlampir di Google Docs.

  Referensi:
  https://drive.google.com/drive/folders/abcdef

  Arahan Visual:
  Warna dominan biru, clean, gaya neo-brutalisme.

  Checklist:
  - Redaksi/materi tersedia: Selesai
  - Referensi desain tersedia: Selesai
  - Draft awal: Belum
  - Revisi internal: Belum
  - Finalisasi desain: Belum
  - Upload hasil: Belum

  Catatan terakhir:
  Update status via WhatsApp: Materi redaksi sudah lengkap, siap dikerjakan.
  ```

---

### 4.9. `!jobdex upload hasil [nama/kode]`
* **Intent Internal**: `upload_hasil`
* **Format**:
  ```txt
  !jobdex upload hasil [nama task]
  link: [URL]
  catatan: [CATATAN]
  ```
  atau dengan prefix `kode [KODE]`.
* **Variasi Parser**: `upload hasil [nama/kode]`, `kirim hasil [nama/kode]`
* **Fungsi**: Mengunggah hasil desain (link Drive/Canva) untuk ditinjau koordinator. Aksi ini mengubah status task menjadi `menunggu_approval`, status approval menjadi `pending`, dan mencentang item checklist "Upload hasil ke Drive" secara otomatis.
* **Role Pengguna**: 
  - `super_admin`
  - `koordinator_divisi` (tugas divisi terkait)
  - `koordinator_acara` (tugas acara terkait)
  - `anggota` (hanya jika PIC tugas terkait)
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (mengupdate status, link Drive, catatan, dan checklist), `status_logs` (menulis log status), `events` (recalculating percentage progress).
* **Contoh Input**:
  ```txt
  !jobdex upload hasil Desain feed
  link: https://drive.google.com/file/d/abcdef
  catatan: Draft 1 siap di-review.
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Upload Hasil]

  Hasil task berhasil dikirim.

  Task: Desain feed opening
  PIC: Made Anggota
  Status baru: Menunggu Approval
  Link: https://drive.google.com/file/d/abcdef

  Koordinator dapat mengecek dan approve/revisi task ini.
  ```

---

### 4.10. `!jobdex minta revisi [nama/kode]`
* **Intent Internal**: `minta_revisi`
* **Format**:
  ```txt
  !jobdex minta revisi [nama task]
  catatan: [CATATAN REVISI]
  ```
  atau menggunakan `kode [KODE]`.
* **Variasi Parser**: `minta revisi [nama/kode]`, `revisi task [nama/kode]`
* **Fungsi**: Meminta PIC melakukan perbaikan atas hasil tugas yang sudah di-upload. Mengubah status task menjadi `perlu_revisi` dan mendistribusikan catatan revisi.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (mengubah status menjadi `perlu_revisi`, menyimpan `revision_notes`), `status_logs` (menulis log status), `events` (recalculating percentage progress).
* **Contoh Input**:
  ```txt
  !jobdex minta revisi Desain feed
  catatan: Font di bagian tanggal terlalu kecil, tolong diperbesar.
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Minta Revisi]

  Revisi berhasil diminta.

  Task: Desain feed opening
  PIC: Made Anggota
  Status baru: Perlu Revisi

  Catatan revisi:
  Font di bagian tanggal terlalu kecil, tolong diperbesar.
  ```

---

### 4.11. `!jobdex cek checklist [nama/kode]`
* **Intent Internal**: `cek_checklist`
* **Format**: `!jobdex cek checklist [nama task]` atau dengan `kode [KODE]`
* **Variasi Parser**: `cek checklist [nama/kode]`
* **Fungsi**: Menampilkan daftar list kelengkapan tugas (Redaksi, Referensi, Draft, Revisi, Final, Upload) beserta status penuntasannya (Selesai/Belum).
* **Role Pengguna**: 
  - `super_admin`
  - `koordinator_divisi` (tugas divisi terkait)
  - `koordinator_acara` (tugas acara terkait)
  - `anggota` (hanya jika PIC tugas terkait)
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex cek checklist Desain feed
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Cek Checklist]

  Task: Desain feed opening

  1. Redaksi/materi tersedia: Selesai
  2. Referensi desain tersedia: Selesai
  3. Mulai desain/draft awal: Belum
  4. Revisi internal: Belum
  5. Finalisasi desain: Belum
  6. Upload hasil ke Drive: Belum
  ```

---

### 4.12. `!jobdex tambah catatan [nama/kode]`
* **Intent Internal**: `tambah_catatan`
* **Format**:
  ```txt
  !jobdex tambah catatan [nama task]
  catatan: [CATATAN]
  ```
  atau dengan `kode [KODE]`.
* **Variasi Parser**: `tambah catatan [nama/kode]`
* **Fungsi**: Menambahkan log catatan pengerjaan kustom ke log status (history) tugas tanpa mengubah status tugas saat ini.
* **Role Pengguna**: 
  - `super_admin`
  - `koordinator_divisi` (tugas divisi terkait)
  - `koordinator_acara` (tugas acara terkait)
  - `anggota` (hanya jika PIC tugas terkait)
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (update `updated_at`), `status_logs` (membuat log baru).
* **Contoh Input**:
  ```txt
  !jobdex tambah catatan Desain feed
  catatan: Sudah koordinasi dengan pembicara dan aset foto baru terkirim setengah.
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Tambah Catatan]

  Catatan berhasil ditambahkan.

  Task: Desain feed opening
  Oleh: Made Anggota

  Catatan:
  Sudah koordinasi dengan pembicara dan aset foto baru terkirim setengah.
  ```

---

### 4.13. `!jobdex ganti pic [nama/kode] ke [nama]`
* **Intent Internal**: `ganti_pic`
* **Format**: `!jobdex ganti pic [nama task] ke [Nama PIC Baru]` atau `!jobdex ganti pic kode [KODE] ke [Nama PIC Baru]`
* **Variasi Parser**: `ganti pic [nama/kode] ke [pic]`, `assign task [nama/kode] ke [pic]`
* **Fungsi**: Mengubah PIC pelaksana tugas ke anggota lain.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users` (fuzzy search mencari target PIC baru), `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (mengubah properti `pic_id`), `status_logs` (mencatat aktivitas pergantian PIC).
* **Contoh Input**:
  ```txt
  !jobdex ganti pic Desain feed ke Ketut Anggota
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Ganti PIC]

  PIC task berhasil diganti.

  Task: Desain feed opening
  PIC lama: Made Anggota
  PIC baru: Ketut Anggota
  ```

---

### 4.14. `!jobdex bantuan`
* **Intent Internal**: `bantuan_task`
* **Format**: `!jobdex bantuan`
* **Variasi Parser**: `bantuan`, `bantuan task`, `help`
* **Fungsi**: Menampilkan daftar panduan seluruh command penting terstruktur WhatsApp Bot JobDex.in.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: None.
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex bantuan
  ```
* **Contoh Output**:
  ```txt
  [*JobdexIn* Bantuan]

  Command utama:
  - !jobdex tugas saya
  - !jobdex detail task [nama task]
  - !jobdex update status [nama task] menjadi [status]
  - !jobdex upload hasil [nama task]
    link: ...
    catatan: ...
  - !jobdex minta revisi [nama task]
    catatan: ...
  - !jobdex cek checklist [nama task]
  - !jobdex checklist [nama task] redaksi selesai
  - !jobdex tambah catatan [nama task]
    catatan: ...
  - !jobdex ganti pic [nama task] ke [nama anggota]
  - !jobdex cari referensi desain [keyword]
  - !jobdex tambah referensi
    nama: ...
    jenis: ...
    acara: ...
    tahun: ...
    link: ...
  - !jobdex cek grup
  - !jobdex event grup
  - !jobdex hubungkan grup acara [nama acara]
  ```

---

### 4.15. `!jobdex update status [nama/kode] menjadi [status]`
* **Intent Internal**: `update_status`
* **Format**:
  ```txt
  !jobdex update status [nama task] menjadi [status]
  ```
  atau
  ```txt
  !jobdex update status [nama task] menjadi [status] catatan: [keterangan]
  ```
  atau dengan prefix `kode [KODE]`.
* **Variasi Parser**: `update status ... menjadi ...`, `ubah status ... ke ...`, `ganti status ... ke ...`
* **Fungsi**: Memperbarui status pengerjaan tugas.
* **Status yang Didukung**: 
  - `belum_dimulai` (belum mulai)
  - `sedang_dikerjakan` (dikerjakan / kerja)
  - `butuh_bantuan` (bantuan)
  - `stuck` (macet)
  - `menunggu_materi` (materi)
  - `draft_selesai` (draft)
  - `perlu_revisi` (revisi)
  - `revisi_dikerjakan`
  - `menunggu_approval` (approval)
  - `approved` (approve / acc / selesai)
  - `ditunda` (tunda)
* **Role Pengguna**: 
  - `super_admin`
  - `koordinator_divisi` (tugas divisi terkait)
  - `koordinator_acara` (tugas acara terkait)
  - `anggota` (hanya jika PIC tugas terkait)
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (mengupdate status, updated_at, menyimpan `stuck_notes` jika status stuck/butuh_bantuan/menunggu_materi), `status_logs` (mencatat aktivitas).
* **Catatan Risiko**: Untuk status **stuck**, **butuh bantuan**, dan **menunggu materi**, parameter `catatan:` wajib disertakan. Jika kosong, bot mengembalikan error: `Catatan wajib diisi untuk status "stuck", "butuh bantuan", atau "menunggu materi".`
* **Contoh Input**:
  ```txt
  !jobdex update status Desain feed menjadi stuck catatan: Laptop crash, perlu diservis 2 hari.
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Status]

  Status task berhasil diperbarui.

  Tugas: Desain feed opening
  Status baru: Stuck
  Catatan: Laptop crash, perlu diservis 2 hari.
  Diperbarui oleh: Made Anggota
  ```

---

### 4.16. `!jobdex approve task [nama/kode]`
* **Intent Internal**: `approve_task`
* **Format**: `!jobdex approve task [nama task]` atau `!jobdex approve task kode [KODE]`
* **Variasi Parser**: `approve task [nama/kode]`, `approve jobdesk [nama/kode]`, `approve kode [kode]`, `acc task [nama/kode]`, `acc jobdesk [nama/kode]`
* **Fungsi**: Menyetujui pengerjaan tugas secara instan. Mengubah status pengerjaan dan status approval menjadi `approved` secara permanen.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (mengubah `status` dan `approval_status` menjadi `approved`, mencatat `approved_by` ID, nama, role, dan timestamp), `status_logs` (mencatat persetujuan).
* **Contoh Input**:
  ```txt
  !jobdex approve task Desain feed
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Approval]

  Task berhasil di-approve.

  Tugas: Desain feed opening
  PIC: Made Anggota
  Approved oleh: Putu Agus
  Waktu: 18 Juni 2026 14:30 WITA
  ```

---

### 4.17. `!jobdex checklist [nama/kode] [item] selesai`
* **Intent Internal**: `checklist_task`
* **Format**: `!jobdex checklist [nama task] [item] selesai` atau `!jobdex checklist kode [KODE] [item] selesai`
* **Variasi Parser**: `checklist [nama/kode] [item] selesai`
* **Fungsi**: Menandai salah satu dari 6 item checklist standard pengerjaan tugas selesai.
* **Item Keyword yang Didukung**:
  - `redaksi` (materi) -> mencentang "Redaksi/materi tersedia"
  - `referensi` -> mencentang "Referensi desain tersedia"
  - `draft` -> mencentang "Mulai desain/draft awal"
  - `revisi` -> mencentang "Revisi internal"
  - `final` -> mencentang "Finalisasi desain"
  - `upload` -> mencentang "Upload hasil ke Drive"
* **Role Pengguna**: 
  - `super_admin`
  - `koordinator_divisi` (tugas divisi terkait)
  - `koordinator_acara` (tugas acara terkait)
  - `anggota` (hanya jika PIC tugas terkait)
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `tasks` (mengupdate status array `checklist_items` beserta ID pemicu, nama pelaksana, dan waktu penuntasan), `status_logs` (mencatat checklist).
* **Contoh Input**:
  ```txt
  !jobdex checklist Desain feed redaksi selesai
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Checklist]

  Item checklist berhasil ditandai selesai.

  Tugas: Desain feed opening
  Item: Redaksi/materi tersedia
  PIC/Penuntas: Made Anggota
  ```

---

### 4.18. `!jobdex archive task [nama/kode]`
* **Intent Internal**: `archive_task`
* **Format**: `!jobdex archive task [nama task]` atau `!jobdex archive kode [KODE]`
* **Variasi Parser**: `archive task ...`, `arsipkan task ...`, `arsipkan jobdesk ...`, `archive kode ...`
* **Fungsi**: Mengajukan draf pengarsipan tugas. Perintah ini tidak langsung mengarsipkan tugas, melainkan menghasilkan Preview ID berawalan `ARC` yang harus dikonfirmasi.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users`, `whatsapp_task_candidates`.
* **Data yang Diubah**: `whatsapp_task_edit_previews` (menyimpan draf `archive_task` berstatus `pending` selama 30 menit).
* **Contoh Input**:
  ```txt
  !jobdex archive task Desain feed
  ```
* **Contoh Output Sukses (Meminta Konfirmasi)**:
  ```txt
  [*JobdexIn* Archive]

  Task ini akan diarsipkan:
  Desain feed opening

  Kode: ARC38G

  Konfirmasi:
  !jobdex konfirmasi archive ARC38G
  ```

---

### 4.19. `!jobdex konfirmasi archive [kode]`
* **Intent Internal**: `confirm_archive`
* **Format**: `!jobdex konfirmasi archive [kode]`
* **Variasi Parser**: `konfirmasi archive [kode]`
* **Fungsi**: Menyetujui dan menerapkan pengarsipan tugas berdasarkan kode `ARC` pending.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `whatsapp_task_edit_previews` (filter `code == ARC_CODE`), `tasks`.
* **Data yang Diubah**: `tasks` (mengubah `is_archived = true`), `status_logs` (mencatat pengarsipan), `whatsapp_task_edit_previews` (mengubah status menjadi `confirmed`).
* **Contoh Input**:
  ```txt
  !jobdex konfirmasi archive ARC38G
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Confirm Archive]

  Tugas berhasil diarsipkan.

  Tugas: Desain feed opening
  Diarsipkan oleh: Putu Agus
  ```

---

### 4.20. `!jobdex edit task [nama/kode]`
* **Intent Internal**: `edit_task`
* **Format**:
  ```txt
  !jobdex edit task [nama task]
  [parameter]: [nilai baru]
  ```
  atau dengan prefix `edit kode [KODE]`.
* **Parameter yang Didukung**: `pic`, `deadline`, `prioritas`/`priority`, `judul`/`name`, `deskripsi`/`description`, `redaksi`/`copywriting`, `referensi`/`design_reference_url`, `warna`/`color_palette`, `arahan_visual`/`visual_direction`.
* **Variasi Parser (Short Edit)**:
  - `ubah deadline [task/kode] ke [date]`
  - `ganti pic [task/kode] ke [pic]`
  - `ubah prioritas [task/kode] ke [prio]`
  - `edit warna [task/kode] jadi [warna]`
  - `edit referensi [task/kode] jadi [ref]`
* **Fungsi**: Mengajukan draf perubahan detail tugas. Mengembalikan kode edit berawalan `EDT` untuk dikonfirmasi.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks`, `users` (jika mengubah PIC), `whatsapp_task_candidates`.
* **Data yang Diubah**: `whatsapp_task_edit_previews` (menyimpan draf `edit_task` berstatus `pending` selama 30 menit).
* **Contoh Input (Full Block)**:
  ```txt
  !jobdex edit task Desain feed
  pic: Ketut Anggota
  deadline: 20 Juni 2026
  prioritas: kritis
  ```
* **Contoh Output Sukses (Meminta Konfirmasi)**:
  ```txt
  [*JobdexIn* Preview Edit Task]

  Saya menemukan task:
  Desain feed opening

  Perubahan yang akan diterapkan:
  - PIC: Made Anggota → Ketut Anggota
  - Deadline: 18 Juni 2026 → 20 Juni 2026
  - Prioritas: Tinggi → Kritis

  Kode Edit: EDT92A

  Untuk menyimpan perubahan, balas:
  !jobdex konfirmasi edit EDT92A

  Untuk membatalkan:
  !jobdex batal edit EDT92A
  ```

---

### 4.21. `!jobdex konfirmasi edit [kode]`
* **Intent Internal**: `confirm_edit`
* **Format**: `!jobdex konfirmasi edit [kode]`
* **Variasi Parser**: `konfirmasi edit [kode]`
* **Fungsi**: Menerapkan draf perubahan detail tugas ke database Firestore berdasarkan kode `EDT` pending.
* **Role Pengguna**: `super_admin`, `koordinator_divisi` (tugas divisi terkait), `koordinator_acara` (tugas acara terkait). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `whatsapp_task_edit_previews`, `tasks`.
* **Data yang Diubah**: `tasks` (mengubah field-field sesuai draf perubahan), `status_logs` (mencatat daftar field yang diubah), `whatsapp_task_edit_previews` (mengubah status menjadi `confirmed`).
* **Contoh Input**:
  ```txt
  !jobdex konfirmasi edit EDT92A
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Confirm Edit]

  Perubahan tugas berhasil disimpan.

  Tugas: Desain feed opening
  Disimpan oleh: Putu Agus
  ```

---

### 4.22. `!jobdex batal edit [kode]`
* **Intent Internal**: `cancel_edit`
* **Format**: `!jobdex batal edit [kode]`
* **Variasi Parser**: `batal edit [kode]`
* **Fungsi**: Membatalkan draf perubahan detail tugas pending sehingga statusnya berubah menjadi `cancelled`.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `whatsapp_task_edit_previews`.
* **Data yang Diubah**: `whatsapp_task_edit_previews` (mengubah status menjadi `cancelled`).
* **Contoh Input**:
  ```txt
  !jobdex batal edit EDT92A
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Cancel Edit]

  Draf perubahan detail tugas (EDT92A) berhasil dibatalkan.
  ```

---

### 4.23. `!jobdex deadline [kategori]`
* **Intent Internal**: `deadline_query`
* **Format**: `!jobdex deadline [kategori]`
* **Variasi Parser**:
  - `deadline dekat`
  - `tugas h-7` / `tugas h-5` / `tugas h-3` / `tugas h-1`
  - `tugas hari ini` / `tugas overdue`
  - `siapa yang belum mulai` / `siapa yang stuck` / `siapa yang butuh bantuan`
  - `siapa yang menunggu materi` / `siapa yang menunggu approval`
  - `tugas berisiko` / `tugas kritis` / `tugas prioritas tinggi`
* **Fungsi**: Membaca dan menampilkan daftar tugas aktif yang dikelompokkan berdasarkan parameter tingkat risiko deadline atau status pengerjaan tertentu.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `tasks` (filter `is_archived == false` dan `status != approved`), `users`, `events`, `divisions`.
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex deadline dekat
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Deadline]

  Ditemukan 2 tugas berisiko:

  1. Desain feed opening
     PIC: Made Anggota
     Deadline: 18 Juni 2026
     Acara/Divisi: RAKER 2026
     Status: Sedang Dikerjakan
     Prioritas: Tinggi
     Risk: Kuning / H-1
  ```

---

### 4.24. `!jobdex tambah jobdesk` (Single Creation)
* **Intent Internal**: `create_task_preview`
* **Format**:
  ```txt
  !jobdex tambah jobdesk
  tipe: divisi/acara
  judul: [JUDUL]
  pic: [NAMA PIC]
  deadline: [TANGGAL]
  prioritas: rendah/sedang/tinggi/kritis
  deskripsi: [DESKRIPSI TUGAS]
  [acara: NAMA ACARA (wajib jika tipe: acara)]
  [redaksi: LINK DOCS]
  [referensi: LINK REF]
  [warna: PALET WARNA]
  [arahan visual: ARAHAN]
  ```
* **Fungsi**: Memvalidasi data pendaftaran tugas baru. Jika valid, sistem menghasilkan Preview ID berawalan konkon (misal `6 karakter acak` seperti `XY97R2`) dan mencatatnya ke Firestore. Eksekusi penulisan database baru dilakukan setelah konfirmasi.
* **Role Pengguna**: `super_admin`, `koordinator_divisi`, `koordinator_acara` (hanya untuk acara miliknya). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `users` (mencocokkan nama PIC), `events` (mencocokkan acara jika tipe: acara).
* **Data yang Diubah**: `ai_command_previews` (menyimpan preview status `pending`).
* **Contoh Input**:
  ```txt
  !jobdex tambah jobdesk
  tipe: acara
  acara: RAKER 2026
  judul: Desain feed opening
  pic: Made Anggota
  deadline: 18 Juni 2026
  prioritas: tinggi
  deskripsi: Feed pembuka raker
  ```
* **Contoh Output Sukses (Meminta Konfirmasi)**:
  ```txt
  [*JobdexIn* AI] Preview

  Saya membaca rencana tambah job desk:

  Tipe: Acara
  Acara: RAKER 2026
  Judul: Desain feed opening
  PIC: Made Anggota
  Deadline: 18 Juni 2026
  Prioritas: tinggi
  Deskripsi: Feed pembuka raker

  Status validasi:
  - PIC ditemukan: Made Anggota (anggota)
  - Deadline terbaca: 18 Juni 2026
  - Acara ditemukan: RAKER 2026
  - Field wajib lengkap

  ✅ Pengirim dikenali: Putu Agus (koordinator divisi)

  Preview ID: XY97R2
  Untuk menyimpan ke database, balas:
  !jobdex konfirmasi XY97R2
  ```

---

### 4.25. `!jobdex tambah banyak jobdesk` (Bulk Creation)
* **Intent Internal**: `bulk_create_task_preview`
* **Format**:
  ```txt
  !jobdex tambah banyak jobdesk
  tipe: divisi/acara
  [acara: NAMA ACARA (wajib jika tipe: acara)]
  1. judul: [JUDUL 1] | pic: [PIC 1] | deadline: [DEADLINE 1] | prioritas: [PRIO 1]
  2. judul: [JUDUL 2] | pic: [PIC 2] | deadline: [DEADLINE 2] | prioritas: [PRIO 2]
  ```
* **Fungsi**: Memproses pendaftaran banyak tugas sekaligus dalam format terstruktur. Mengembalikan satu Preview ID untuk eksekusi massal (menggunakan prinsip All-or-Nothing).
* **Role Pengguna**: `super_admin`, `koordinator_divisi`, `koordinator_acara` (hanya untuk acara miliknya). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `users`, `events`.
* **Data yang Diubah**: `ai_command_previews` (menyimpan draf pending).
* **Contoh Input**:
  ```txt
  !jobdex tambah banyak jobdesk
  tipe: divisi
  1. judul: Banner Raker | pic: Made Anggota | deadline: 18 Juni 2026 | prioritas: tinggi
  2. judul: Poster Raker | pic: Ketut Anggota | deadline: 20 Juni 2026 | prioritas: sedang
  ```
* **Contoh Output Sukses (Meminta Konfirmasi)**:
  ```txt
  [*JobdexIn* AI] Preview Bulk

  Saya membaca 2 rencana job desk (Divisi):

  1. Banner Raker
     PIC: Made Anggota (anggota)
     Deadline: 18 Juni 2026
     Prioritas: tinggi
  2. Poster Raker
     PIC: Ketut Anggota (anggota)
     Deadline: 20 Juni 2026
     Prioritas: sedang

  Validasi:
  - 2 task terbaca
  - PIC ditemukan: 2/2
  - 0/2 deadline bermasalah

  ✅ Pengirim dikenali: Putu Agus (koordinator divisi)

  Preview ID: BUK12C
  Untuk menyimpan ke database, balas:
  !jobdex konfirmasi BUK12C
  ```

---

### 4.26. `!jobdex tambah acara`
* **Intent Internal**: `create_event_preview`
* **Format**:
  ```txt
  !jobdex tambah acara
  nama: [NAMA ACARA]
  tanggal: [TANGGAL]
  koordinator: [NAMA KOORDINATOR]
  deskripsi: [DESKRIPSI]
  ```
* **Fungsi**: Memvalidasi pembuatan acara/kegiatan baru. Mengembalikan Preview ID untuk konfirmasi.
* **Role Pengguna**: `super_admin`, `koordinator_divisi`. Koordinator Acara & Anggota ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `users` (mencocokkan koordinator acara).
* **Data yang Diubah**: `ai_command_previews`.
* **Contoh Input**:
  ```txt
  !jobdex tambah acara
  nama: PKKMB 2026
  tanggal: 1 Agustus 2026
  koordinator: Made Anggota
  deskripsi: Pengenalan kampus mahasiswa baru
  ```
* **Contoh Output Sukses (Meminta Konfirmasi)**:
  ```txt
  [*JobdexIn* AI] Preview

  Saya membaca rencana tambah acara:

  Nama: PKKMB 2026
  Tanggal: 1 Agustus 2026
  Koordinator: Made Anggota
  Deskripsi: Pengenalan kampus mahasiswa baru

  Status validasi:
  - Koordinator ditemukan: Made Anggota (anggota)
  - Tanggal terbaca: 1 Agustus 2026
  - Field wajib lengkap

  ✅ Pengirim dikenali: Putu Agus (koordinator divisi)

  Preview ID: EVT88K
  Untuk menyimpan ke database, balas:
  !jobdex konfirmasi EVT88K
  ```

---

### 4.27. `!jobdex tambah referensi`
* **Intent Internal**: `create_reference_preview`
* **Format**:
  ```txt
  !jobdex tambah referensi
  scope: divisi/acara
  [acara: NAMA ACARA (wajib jika scope: acara)]
  [divisi: NAMA DIVISI (wajib jika scope: divisi)]
  tahun: [TAHUN]
  judul: [JUDUL REFERENSI]
  jenis: poster/feed/story/nametag/video/sertifikat/lainnya
  [link drive: LINK]
  [link canva: LINK]
  [link docs: LINK]
  [link lain: LINK]
  [warna: PALET WARNA]
  [arahan visual: ARAHAN]
  [catatan: CATATAN]
  ```
* **Fungsi**: Memvalidasi draf penambahan referensi desain (misalnya poster panitia tahun lalu, aset twibbon, dll). Mengembalikan Preview ID berawalan konkon referensi.
* **Role Pengguna**: `super_admin` (global), `koordinator_divisi` (hanya divisi miliknya), `koordinator_acara` (hanya acara miliknya). `anggota` ditolak.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `events` (mencocokkan acara jika scope: acara).
* **Data yang Diubah**: `ai_command_previews`.
* **Contoh Input**:
  ```txt
  !jobdex tambah referensi
  scope: acara
  acara: RAKER 2026
  tahun: 2026
  judul: Aset Twibbon Raker
  jenis: twibbon
  link drive: https://drive.google.com/file/d/abcdef
  ```
* **Contoh Output Sukses (Meminta Konfirmasi)**:
  ```txt
  [*JobdexIn* AI] Preview

  Saya membaca rencana tambah referensi desain:

  Scope: Acara
  Acara: RAKER 2026
  Tahun: 2026
  Judul: Aset Twibbon Raker
  Jenis: twibbon
  Link Drive: https://drive.google.com/file/d/abcdef

  Status validasi:
  - Acara ditemukan: RAKER 2026
  - Akses diizinkan: Koordinator Divisi
  - Field wajib lengkap
  - Minimal satu link tersedia

  ✅ Pengirim dikenali: Putu Agus (koordinator divisi)

  Preview ID: REF92P
  Untuk menyimpan ke database, balas:
  !jobdex konfirmasi referensi REF92P
  ```

---

### 4.28. `!jobdex konfirmasi [PREVIEW_ID]`
* **Intent Internal**: `confirm_command`
* **Format**: `!jobdex konfirmasi [PREVIEW_ID]` atau `!jobdex konfirmasi referensi [PREVIEW_ID]` (jika scope referensi).
* **Variasi Parser**: `konfirmasi [PREVIEW_ID]`, `konfirmasi referensi [PREVIEW_ID]`
* **Fungsi**: Menyetujui dan memproses draf penulisan data baru (Task, Event, atau Reference) ke database Firestore.
* **Role Pengguna**: Bergantung pada tipe draf asli (Super Admin/Koordinator terkait).
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `ai_command_previews` (filter `confirmation_code == PREVIEW_ID`), `users`, `events`.
* **Data yang Diubah**:
  - `ai_command_previews` (update status menjadi `confirmed`).
  - Menulis dokumen baru ke collection target: `tasks`, `events`, atau `design_references`.
  - Subcollection `tasks/{id}/status_logs` (mencatat inisiasi pengerjaan jika tipenya task).
  - `events` (recalculating progress jika tipenya task).
* **Contoh Input**:
  ```txt
  !jobdex konfirmasi XY97R2
  ```
* **Contoh Output Sukses**:
  ```txt
  Job desk berhasil dibuat.

  Judul: Desain feed opening
  PIC: Made Anggota
  Deadline: 18 Juni 2026
  Acara: RAKER 2026
  Dibuat oleh: Putu Agus
  Status awal: Belum Dimulai
  ```

---

### 4.29. `!jobdex batal [PREVIEW_ID]`
* **Intent Internal**: `cancel_command`
* **Format**: `!jobdex batal [PREVIEW_ID]` atau `!jobdex batal referensi [PREVIEW_ID]` (jika referensi).
* **Variasi Parser**: `batal [PREVIEW_ID]`, `batal referensi [PREVIEW_ID]`
* **Fungsi**: Membatalkan draf penulisan data pending sehingga statusnya berubah menjadi `cancelled`.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `ai_command_previews`.
* **Data yang Diubah**: `ai_command_previews` (mengubah status menjadi `cancelled`).
* **Contoh Input**:
  ```txt
  !jobdex batal XY97R2
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* AI]

  Rencana tindakan "create_task_preview" (ID: XY97R2) berhasil dibatalkan oleh Putu Agus.
  ```

---

### 4.30. `!jobdex event grup`
* **Intent Internal**: `event_grup`
* **Format**: `!jobdex event grup`
* **Variasi Parser**: `event grup`, `acara grup`
* **Fungsi**: Menampilkan seluruh daftar acara (event) aktif yang sudah memiliki relasi dengan grup WhatsApp khusus.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `events` (mengambil dokumen dengan `whatsapp_group_id` terisi).
* **Data yang Diubah**: None.
* **Contoh Input**:
  ```txt
  !jobdex event grup
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* Grup Acara]

  Daftar acara yang memiliki grup WhatsApp khusus:

  1. RAKER 2026
     Group ID: 120363427255190681
     Status: Terhubung
  ```

---

### 4.31. `!jobdex cari [keyword]`
* **Intent Internal**: `reference_search` (atau via AI fallback deteksi)
* **Format**: `!jobdex cari [keyword]` atau `!jobdex cari referensi desain [keyword]`
* **Fungsi**: Mencari referensi desain di database internal Firestore `design_references` secara cerdas (mendukung pencarian tipe aset twibbon, nametag, poster, dll, filter tahun, penyaringan kemiripan string, serta reranking menggunakan DeepSeek API jika token API dikonfigurasi).
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `design_references`.
* **Data yang Diubah**: `ai_logs` (menyimpan riwayat pertanyaan).
* **Contoh Input**:
  ```txt
  !jobdex cari poster Raker 2026
  ```
* **Contoh Output Sukses**:
  ```txt
  [JobDex.in Referensi]

  Saya mencari referensi yang paling dekat dengan “poster / pamflet / flyer / feed / publikasi”.

  Ditemukan 1 referensi yang paling relevan:

  1. Poster Raker Anggota
     Kegiatan: RAKER 2026
     Tahun: 2026
     Alasan relevan: Sesuai dengan pencarian desain poster.
     File:
     - poster_final.png
       Type: image/png
       Link: https://drive.google.com/file/d/abcdef
  ```

---

### 4.32. `!jobdex [pertanyaan bebas]`
* **Intent Internal**: `gemini_fallback` (asisten umum)
* **Format**: `!jobdex bagaimana cara menambah tugas?` atau `!jobdex ringkas progress Raker`
* **Fungsi**: Tanya jawab asisten umum JobDex.in menggunakan Gemini AI. Konteks database (statistik task, event, divisi, members) di-inject secara dinamis agar jawaban AI akurat sesuai data riil.
* **Role Pengguna**: Semua user terdaftar.
* **Tempat**: Personal & Group.
* **Data yang Dibaca**: `buildAIContext` (membaca ringkasan statistik tasks, events, divisions, users), `ai_logs`.
* **Data yang Diubah**: `ai_logs` (menyimpan riwayat chat).
* **Contoh Input**:
  ```txt
  !jobdex ada berapa tugas yang stuck saat ini?
  ```
* **Contoh Output Sukses**:
  ```txt
  [*JobdexIn* AI]

  Pertanyaan: ada berapa tugas yang stuck saat ini?

  Jawaban:
  Saat ini terdapat 1 tugas yang stuck, yaitu tugas "Desain Banner Opening" (PIC: Made Anggota) karena terkendala laptop rusak.
  ```

---

## 5. Role Access Matrix

Berikut adalah matriks hak akses otorisasi eksekusi WhatsApp Bot JobDex.in:

| Command / Tindakan | Super Admin | Koord Divisi | Koord Acara | Anggota (PIC) | Tidak Terdaftar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Utilitas Publik** (`cek_pengirim`) | Boleh | Boleh | Boleh | Boleh | Boleh |
| **Cek Grup** (`cek_grup`) | Boleh | Boleh | Boleh | Boleh | Ditolak |
| **Cek Role** (`cek_role`) | Boleh | Boleh | Boleh | Boleh | Ditolak |
| **Bantuan & Format** (`bantuan_task`) | Boleh | Boleh | Boleh | Boleh | Ditolak |
| **Melihat Tugas Saya** (`tugas_saya`) | Boleh | Boleh | Boleh | Boleh (Tugas PIC) | Ditolak |
| **Melihat Detail Tugas** (`detail_task`) | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Terbatas (Tugas PIC) | Ditolak |
| **Cek Checklist Tugas** (`cek_checklist`)| Boleh | Terbatas (Divisi) | Terbatas (Acara) | Terbatas (Tugas PIC) | Ditolak |
| **Update Status Tugas** (`update_status`) | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Terbatas (Tugas PIC) | Ditolak |
| **Tanda Checklist Selesai** (`checklist_task`)| Boleh | Terbatas (Divisi) | Terbatas (Acara) | Terbatas (Tugas PIC) | Ditolak |
| **Upload Hasil Tugas** (`upload_hasil`) | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Terbatas (Tugas PIC) | Ditolak |
| **Tambah Catatan Tugas** (`tambah_catatan`)| Boleh | Terbatas (Divisi) | Terbatas (Acara) | Terbatas (Tugas PIC) | Ditolak |
| **Briefing Laporan** (`briefing`) | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Cek Laporan Update** (`siapa_belum_update`)| Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Minta Revisi Tugas** (`minta_revisi`) | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Ganti PIC Tugas** (`ganti_pic`) | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Deadline Queries** (`deadline_query`) | Boleh | Boleh (Global) | Boleh (Global) | Boleh (Global) | Ditolak |
| **Hubungkan Grup Acara** (`hubungkan_grup_acara`)| Boleh | Terbatas (Divisi)* | Terbatas (Acara) | Ditolak | Ditolak |
| **Tambah Tugas Preview** (`create_task_preview`)| Boleh | Boleh | Terbatas (Acara) | Ditolak | Ditolak |
| **Tambah Bulk Tasks Preview** | Boleh | Boleh | Terbatas (Acara) | Ditolak | Ditolak |
| **Tambah Acara Preview** (`create_event_preview`)| Boleh | Boleh | Ditolak | Ditolak | Ditolak |
| **Tambah Referensi Preview** | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Konfirmasi Draf Baru** (`confirm_command`)| Boleh | Sesuai draf | Sesuai draf (Acara) | Ditolak | Ditolak |
| **Edit Detail Tugas Preview** (`edit_task`)| Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Konfirmasi Edit/Archive** | Boleh | Terbatas (Divisi) | Terbatas (Acara) | Ditolak | Ditolak |
| **Batal Draf Edit/Archive/Create** | Boleh | Boleh | Boleh | Boleh | Ditolak |
| **Cari Referensi Desain** (`reference_search`)| Boleh | Boleh | Boleh | Boleh | Ditolak |
| **Tanya Jawab AI** (`gemini_fallback`) | Boleh | Boleh | Boleh | Boleh | Ditolak |

### Catatan Scope Otorisasi:
1. **Super Admin**: Otorisasi global tak terbatas untuk membaca dan menulis data apa pun.
2. **Koordinator Divisi**: Dibatasi hanya untuk tugas tipe divisi yang memiliki ID divisi sama dengan user pelaksana (`task.type === "divisi" && task.division_id === user.division_id`).
3. **Koordinator Acara**: Dibatasi hanya untuk tugas tipe acara yang ia koordinasikan (`task.type === "acara" && task.coordinator_id === user.id`).
4. **Anggota (PIC)**: Dibatasi sangat ketat hanya untuk tugas pengerjaan di mana user terdaftar sebagai PIC utama (`task.pic_id === user.id`). Hanya diizinkan melakukan pembacaan detail, checklist penuntasan, upload link hasil, dan update status. Dilarang melakukan tindakan administratif (ganti PIC, minta revisi, approve, edit data, archive).
5. **Tidak Terdaftar**: Seluruh command selain `cek_pengirim` akan ditolak di level webhook sebelum dijalankan.
6. **Hubungkan Grup Acara (Divisi)**: Koordinator Divisi diizinkan menghubungkan grup acara jika divisi tersebut didelegasikan setidaknya satu tugas pada acara yang dituju.

---

## 6. Contoh Output Sukses/Gagal

Berikut adalah salinan visual pesan WhatsApp (success/failure responses) untuk command utama:

### 6.1. Contoh Akses Ditolak (RBAC Block)
```txt
[*JobdexIn* Akses Ditolak]

Kamu terdeteksi sebagai: Made Anggota (Anggota)
Aksi ini tidak diizinkan untuk role kamu atau task ini bukan dalam cakupan akses kamu.
```

### 6.2. Contoh Pengirim Belum Terdaftar (Auth Block)
```txt
[*JobdexIn* Auth]

Nomor WhatsApp kamu terdeteksi: 6289987654321

Namun nomor ini belum terhubung dengan akun JobdexIn.
Silakan hubungi admin untuk menambahkan nomor WhatsApp ke profil akun.
```

### 6.3. Contoh Kesalahan Parameter Status (Format Block)
```txt
[*JobdexIn* Status]

Format status tidak dikenali.

Pilih salah satu status yang didukung:
- belum dimulai
- sedang dikerjakan
- butuh bantuan
- stuck
- menunggu materi
- draft selesai
- perlu revisi
- revisi dikerjakan
- menunggu approval
- approve / approved / acc
- ditunda
```

### 6.4. Contoh Kesalahan Validasi PIC (Creation Preview Block)
```txt
[*JobdexIn* AI] Preview

Saya membaca rencana tambah job desk:

Tipe: Divisi
Judul: Desain Poster HUT
PIC: Sumesta C
Deadline: 15 Juni 2026
Prioritas: sedang

Status validasi:
- PIC tidak ditemukan ("Sumesta C")
- Deadline terbaca: 15 Juni 2026
- Field wajib lengkap

⚠️ Catatan: Nomor WhatsApp Anda belum terhubung ke akun JobdexIn, sehingga command eksekusi nantinya tidak dapat dijalankan.

Preview ini belum disimpan ke database.
```

---

## 7. Catatan Keamanan & Hasil Audit Temuan Celah Rawan

Berdasarkan audit menyeluruh terhadap kode server-side, berikut adalah tabel temuan celah keamanan, inkonsistensi pelabelan, dan kode mati (dead code):

| No | Masalah / Temuan | File Sumber | Dampak | Rekomendasi Perbaikan |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Kebocoran Data Lintas Role (Data Leakage)** | [whatsapp-task-command-executor.ts:L87-225](file:///D:/Download/jobdescin/src/lib/server/whatsapp-task-command-executor.ts#L87-225) | Pengguna dengan role `anggota` (PIC) dapat membaca data tenggat waktu (deadline) seluruh divisi dan acara lain melalui command `!jobdex deadline [kategori]`. | Tambahkan parameter `user: UserProfile` ke `handleDeadlineQuery` dan batasi list task yang ditampilkan sesuai divisi/acara pelaksana seperti pada `handleTugasSayaCommand`. |
| 2 | **Inkonsistensi Brand Label (`JobDex.in` vs `*JobdexIn*`)** | [reference-search.ts:L648,L662](file:///D:/Download/jobdescin/src/lib/server/reference-search.ts#L648) dan [route.ts (ai_logs)](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts) | Response pencarian referensi masih menampilkan header mentah `[JobDex.in Referensi]` dan `[JobDex.in]`. Ini melanggar aturan WhatsApp-safe label di `whatsapp-labels.ts` dan dapat menyebabkan WhatsApp mendeteksi nama brand sebagai link tak dikenal. | Ganti string statis tersebut menggunakan konstanta `WA_LABEL.ai` atau format `[*JobdexIn* Referensi]`. |
| 3 | **Persetujuan Tanpa Validasi Pembuat (Attribution Hijack)** | [whatsapp-command-executor.ts:L165](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts#L165) | Satu Koordinator dapat mengonfirmasi Preview ID (berkas tugas/acara/referensi) yang diajukan oleh Koordinator lain secara bebas karena konfirmasi hanya memvalidasi level role, bukan pemilik draf (`requested_by`). | Tambahkan validasi kecocokan `previewData.requested_by === user.id` sebelum penulisan Firestore dieksekusi di `confirmPreviewCommand`. |
| 4 | **Kode Mati (Dead Code) `approve_task_preview`** | [whatsapp-command-parser.ts:L655,L702](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-parser.ts#L655) dan [whatsapp-command-preview.ts:L560](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-preview.ts#L560) | Parser `approve_task_preview` dan preview builder-nya tidak akan pernah dieksekusi karena command `approve task` ditangkap terlebih dahulu oleh kondisi di baris parser 655 (`approve_task`). | Hapus helper parser `parseApproveTaskCommand` dan kode preview di `whatsapp-command-preview.ts` untuk merapikan codebase. |
| 5 | **Bypass Autentikasi `template_help` & `progress_question`** | [route.ts:L733](file:///D:/Download/jobdescin/src/app/api/webhooks/wablas/gemini/route.ts#L733) | Intent `template_help` (command `format`) bypasses auth check karena masuk `isBantuan`. Meskipun aman karena hanya teks panduan, asisten fallback AI tetap terpicu yang memakan biaya token Gemini API secara cuma-cuma dari pengirim asing. Sedangkan `progress_question` parsed tetapi tidak di-handle, jatuh ke AI fallback. | Buat rute handler lokal di webhook untuk langsung membalas `template_help` menggunakan template string `CASE_1_TEMPLATE` dkk secara statis tanpa melempar pertanyaan ke Gemini API. Sediakan juga penanganan terstruktur untuk `progress_question`. |
| 6 | **Pembatalan Tindakan Tanpa Validasi (Bypass Cancel Guard)** | [whatsapp-command-executor.ts:L110](file:///D:/Download/jobdescin/src/lib/server/whatsapp-command-executor.ts#L110) | Fungsi `cancelPreviewCommand` dan `handleCancelEditTaskCommand` mengizinkan anggota biasa membatalkan draf edit/tambah milik Koordinator lain karena tidak ada guard role di level pembatalan. | Tambahkan guard pengecekan role `user.role !== "anggota"` sebelum membatalkan draf draf baru di collection previews. |

---

## 8. Command yang Perlu Dikembangkan ke Depan

Untuk peningkatan fungsionalitas dan keamanan bot di fase selanjutnya, berikut adalah rekomendasi pengembangan:
1. **Penyatuan Sistem Konfirmasi**: Mengintegrasikan sistem konfirmasi ber-PIN kembali secara terbatas untuk perintah berisiko tinggi (misalnya pengarsipan/penghapusan tugas) demi keamanan ekstra.
2. **Log Riwayat Penugasan (PIC History)**: Mencatat riwayat ganti PIC secara detail di subcollection tasks untuk keperluan audit performa panitia.

---

## 9. Hasil Penyempurnaan & Hardening (Fase 22C)

Fase 22C berfokus pada penyempurnaan, hardening, dan testing command WhatsApp `!jobdex` sesuai dengan rencana audit. Berikut adalah detail implementasi yang berhasil diselesaikan:

### A. Pencegahan Kebocoran Data (Data Leakage) pada `deadline_query`
* **Implementasi**: Parameter `user: UserProfile` diteruskan ke `handleDeadlineQuery`. List tugas disaring secara ketat berdasarkan hak akses role:
  - `super_admin`: melihat seluruh tugas aktif.
  - `koordinator_divisi`: melihat tugas divisi miliknya.
  - `koordinator_acara`: melihat tugas acara yang dikoordinasikannya.
  - `anggota`: melihat tugas di mana user adalah PIC-nya saja.
* **Hasil**: Anggota tidak bisa lagi membaca data task lintas divisi/acara, dan jika list kosong, bot membalas dengan ramah.

### B. Konsistensi Label WhatsApp-safe (`*JobdexIn*`)
* **Implementasi**: Semua hardcoded string `JobDex.in` atau `[JobDex.in Referensi]` di respon text bot telah digantikan dengan konstanta label WhatsApp-safe yang menggunakan format bold `*JobdexIn*` dari `whatsapp-labels.ts` (misalnya `WA_LABEL.referensi`). Hal ini mencegah WhatsApp mendeteksi nama platform sebagai link eksternal yang tidak dikenal.

### C. Validasi Pembuat Preview saat Konfirmasi (Ownership Guard)
* **Implementasi**: Ketika user mengirimkan perintah konfirmasi (`!jobdex konfirmasi [PREVIEW_ID]`), sistem memvalidasi bahwa `previewData.requested_by === user.id` (atau user adalah `super_admin`).
* **Cakupan**: Berlaku pada konfirmasi preview biasa (`ai_command_previews`), draf edit (`EDT`), dan draf archive (`ARC`). Pengguna lain yang bukan pembuat draf akan ditolak dengan pesan `[*JobdexIn* Akses Ditolak]`.

### D. Pembersihan Kode Mati (Dead Code Removal)
* **Implementasi**: Menghapus parser `approve_task_preview` dan preview builder case `approve_task_preview` dari `whatsapp-command-parser.ts` dan `whatsapp-command-preview.ts` karena command `approve task` sudah diproses langsung secara synchronous. Warning ESLint dibersihkan seluruhnya.

### E. Template Bantuan Statis (Token Optimization)
* **Implementasi**: Command `format jobdesk`, `format acara`, dan `format referensi` dibalas secara instan menggunakan string template statis tanpa memicu pemanggilan API Gemini AI. Ini menghemat penggunaan token AI dan merespon dalam milidetik.

### F. Penanganan Terstruktur Progress Question
* **Implementasi**: Jika pengguna bertanya tentang progress (seperti `!jobdex gimana progress?` atau `!jobdex siapa yang stuck?`), bot tidak langsung melempar ke AI fallback, melainkan mengarahkan ke daftar command progress terstruktur yang relevan.

### G. Dokumentasi Hasil Uji (Simulated/Manual Test)
* **Hasil Uji**: Hasil pengujian dicatat di dalam dokumen [WHATSAPP_COMMAND_TEST_PLAN.md](file:///d:/Download/jobdescin/docs/WHATSAPP_COMMAND_TEST_PLAN.md). Seluruh skenario RBAC, validasi kepemilikan, template bantuan statis, dan penanganan format error telah lolos verifikasi simulated test. Compilation check (`npm run build`) berjalan bersih tanpa error.

---

## 10. Hasil Penyempurnaan & Natural Language Automation (Fase 22D)

Fase 22D mengimplementasikan parser perintah berbasis bahasa alami (Natural Language Command Layer) hibrida dan otomatisasi cerdas guna mempermudah interaksi pengguna. Dokumentasi lengkap mengenai fungsionalitas ini berada pada dokumen [WHATSAPP_NATURAL_COMMANDS.md](file:///d:/Download/jobdescin/docs/WHATSAPP_NATURAL_COMMANDS.md).

Berikut adalah rangkuman penyempurnaan utama:
1. **Hybrid Parser**: Dukungan bahasa alami asinkron berbasis Gemini AI yang melengkapi parser regex bawaan untuk menangkap intent pembuatan tugas (tunggal & bulk), update status, revisi, dan approval.
2. **Smart PIC Resolver**: Pencarian profil PIC secara fleksibel berdasarkan nama lengkap, nickname, alias, maupun nomor WhatsApp dengan skema fuzzy matching dan penanganan ketidakjelasan (ambiguitas).
3. **Auto Checklist & References**: Pembagian tugas ke dalam 4 kategori khusus (Desain, Dokumentasi, Copywriting, Administrasi) dengan daftar checklist otomatis, serta integrasi saran referensi desain pada preview pembuatan tugas.
4. **Smart Reminders**: Pengingat berkala harian (H-3 belum mulai, H-1 urgent, stuck > 12 jam, menunggu materi/approval) yang ditargetkan secara personal maupun dikirimkan ke grup acara terkait.
5. **Actionable Briefing**: Ringkasan laporan harian koordinasi acara yang padat dan terstruktur bagi pemangku kepentingan (koordinator).

