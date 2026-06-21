# JobDex.in Jobdesk Categories, Archive Rules, and Reference Rules

## Overview

Dokumentasi ini mendefinisikan sistem kategori, subkategori, serta aturan pengelolaan **Arsip** dan **Referensi** untuk hasil pekerjaan (jobdesk/tasks) di JobDex.in. Dokumen ini menjadi acuan utama bagi pengembang sebelum melakukan modifikasi pada antarmuka pengguna (UI), database, maupun formulir pembuatan jobdesk.

Dengan sistem ini, JobDex.in dapat mengotomatisasi penyaringan hasil kerja kepanitiaan:
- **Arsip**: Menyimpan bukti fisik/digital pengerjaan tugas secara teratur untuk audit dan histori.
- **Referensi**: Menyediakan contoh/template yang dapat ditiru oleh kepanitiaan tahun berikutnya tanpa mengekspos data sensitif.

---

## Core Concept

### Archive
- **Definisi**: Repositori penyimpanan digital yang berisi seluruh berkas luaran (output) dan tautan pengerjaan dari tugas yang telah diselesaikan (Approved).
- **Aturan Masuk**:
  - Semua jobdesk yang menghasilkan output final secara default direkomendasikan masuk Arsip.
  - Berfungsi sebagai bukti akuntabilitas kerja anggota panitia dan log historis divisi.
  - Hanya dapat diakses oleh panitia internal yang berwenang (tidak untuk konsumsi umum).

### Reference
- **Definisi**: Galeri kurasi yang menyajikan inspirasi desain, contoh format surat, template proposal, template laporan keuangan, dan aset lainnya yang bersifat reusable (dapat digunakan kembali).
- **Aturan Masuk**:
  - Tidak semua dokumen di Arsip masuk ke Referensi. Hanya output yang memiliki nilai guna ulang bagi kepanitiaan berikutnya yang direkomendasikan masuk.
  - File dengan tingkat sensitivitas tinggi (misalnya: data diri peserta, nominal/bukti transfer pembayaran, dan absensi) secara ketat diblokir dari Referensi untuk menjaga kerahasiaan.
  - Aktivitas koordinasi atau log harian tidak diperbolehkan masuk ke Referensi.

### Activity Log
- **Definisi**: Pencatatan aktivitas non-file yang dilakukan untuk kepentingan koordinasi, monitoring, briefing, rapat, atau follow-up.
- **Aturan Masuk**:
  - Jenis output yang digunakan adalah catatan teks, checklist, atau tautan grup koordinasi (opsional).
  - Masuk ke Arsip secara opsional sebagai log histori kegiatan panitia.
  - Sama sekali tidak diperbolehkan masuk ke Referensi.

---

## Rule Summary

Secara ringkas, logika default rekomendasi sistem didasarkan pada tiga parameter utama:
1. **Output Final vs Log**: Apakah pekerjaan menghasilkan file visual/dokumen/tautan workspace atau sekadar aktivitas koordinasi.
2. **Sensitivitas Data**: Data dikategorikan menjadi `normal` (bebas dibagikan sebagai referensi), `internal` (hanya untuk arsip internal panitia), dan `sensitive` (sangat rahasia, tidak boleh masuk referensi).
3. **Kontrol Manual**: Sistem memberikan rekomendasi default saat tugas dibuat, tetapi pembuat tugas (koordinator/sekretaris) memiliki hak penuh untuk mengubah toggle `Masuk Arsip` atau `Jadikan Referensi` sebelum tugas dipublikasikan.

---

## Main Categories

Berikut adalah penjelasan dan pemetaan aturan untuk masing-masing dari 12 kategori utama:

### 1. Desain Publikasi
Kategori ini mencakup seluruh aset visual yang digunakan untuk promosi, publikasi, dekorasi, dan media sosial acara. Sangat kuat untuk dimasukkan ke Arsip dan Referensi.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Poster | Poster acara, poster lomba, poster webinar | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Cocok untuk referensi desain |
| Pamflet | pamflet informasi, pamflet event | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Cocok untuk referensi desain |
| Flyer | flyer promosi singkat | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Cocok untuk referensi desain |
| Feed Instagram | feed single post, carousel | image/canva_link | Ya | Ya | Ya | Opsional | Desain feed media sosial |
| Story Instagram | story live report, story reminder | image/canva_link | Ya | Ya | Ya | Opsional | Berguna untuk referensi template story |
| Reels Cover | cover reels/video pendek | image/canva_link | Ya | Ya | Ya | Opsional | Desain cover video pendek |
| Thumbnail Video | thumbnail YouTube, thumbnail highlight | image/canva_link | Ya | Ya | Ya | Opsional | Desain cover YouTube/highlight |
| Banner Digital | banner website, banner grup, header digital | image/canva_link | Ya | Ya | Ya | Opsional | Desain banner landscape digital |
| Spanduk / Banner Cetak | spanduk acara, backdrop | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain spanduk fisik |
| X-Banner | banner standing event | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain standing banner cetak |
| Baliho | desain baliho besar | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain cetak baliho besar |
| Twibbon | twibbon peserta/panitia | image/canva_link | Ya | Ya | Ya | Opsional | Biasanya format PNG transparan |
| Frame Foto | frame dokumentasi, frame story | image/canva_link | Ya | Ya | Ya | Opsional | Overlay frame dokumentasi |
| Photobooth | desain photobooth acara | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Layout desain photobooth fisik |
| Background Zoom | virtual background webinar/meeting | image/canva_link | Ya | Ya | Ya | Opsional | Resolusi landscape 16:9 |
| Countdown Design | desain H-7, H-3, H-1 | image/canva_link | Ya | Ya | Ya | Opsional | Desain hitung mundur event |
| Announcement Design | pengumuman peserta, pengumuman hasil | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain pengumuman hasil |
| Thank You Post | ucapan terima kasih, after event | image/canva_link | Ya | Ya | Ya | Opsional | Desain ucapan penutup acara |

### 2. Identitas Acara dan Panitia
Kategori ini berisi desain dan dokumen identitas resmi yang membedakan identitas visual acara. Sangat penting sebagai referensi kepanitiaan di masa mendatang.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Name Tag | name tag panitia/peserta | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Identitas peserta/panitia |
| ID Card | kartu identitas panitia | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Kartu panitia/crew |
| Kartu Panitia | versi lokal name tag/id card | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Versi lokal name tag |
| Badge Peserta | tanda peserta/delegasi | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Identitas delegasi/peserta |
| Sertifikat | sertifikat peserta/pemateri/panitia | image/pdf/canva_link/drive_link | Ya | Ya | Opsional | Ya | Template sertifikat sangat penting |
| Piagam | piagam penghargaan | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain piagam pemenang/mitra |
| Plakat Design | desain plakat/cenderamata | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain plakat/cenderamata |
| Kop Surat Acara | template surat khusus acara | image/document/canva_link | Ya | Ya | Ya | Opsional | Kop surat resmi kepanitiaan |
| Logo Acara | logo event/program kerja | image/drive_link | Ya | Ya | Ya | Opsional | Logo utama event |
| Maskot Acara | maskot/karakter event | image/drive_link | Ya | Ya | Ya | Opsional | Maskot/karakter event |
| Brand Guideline Acara | warna, font, style visual acara | pdf/canva_link/figma_link | Ya | Ya | Ya | Opsional | Panduan identitas visual |
| Color Palette | palet warna event | image/canva_link/figma_link | Ya | Ya | Ya | Opsional | Kode warna branding |
| Supergraphic | elemen grafis dekoratif acara | image/drive_link | Ya | Ya | Ya | Opsional | Elemen grafis dekoratif |

### 3. Dokumen Administrasi
Dokumen persuratan resmi, perencanaan, aturan teknis, dan laporan administrasi. Dokumen yang bersifat template atau panduan sangat cocok dijadikan referensi.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Proposal | proposal kegiatan | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Template proposal kegiatan |
| Cover Proposal | desain cover proposal | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Desain cover depan proposal |
| LPJ | laporan pertanggungjawaban | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Template laporan pertanggungjawaban |
| Surat Undangan | undangan resmi | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Surat undangan resmi |
| Surat Permohonan | permohonan izin, dana, peminjaman | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Surat permohonan izin/dana |
| Surat Tugas | surat tugas panitia/delegasi | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Surat tugas kepanitiaan |
| Surat Peminjaman | peminjaman ruang/alat | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Surat pinjam ruang/alat |
| Surat Dispensasi | surat izin/dispensasi | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Surat dispensasi kuliah/kerja |
| Notulen | notulen rapat | pdf/document/drive_link | Ya | Opsional | Ya | Opsional | Hasil catatan rapat koordinasi |
| Rundown | rundown acara | pdf/spreadsheet/drive_link | Ya | Ya | Ya | Opsional | Susunan jadwal acara detail |
| TOR / Term of Reference | kerangka acara | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Panduan materi pembicara |
| Juknis | petunjuk teknis | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Petunjuk teknis lomba/acara |
| Buku Panduan | guidebook peserta/panitia | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Guidebook panduan event |
| SOP | SOP acara/divisi | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Standar operasional prosedur |
| Absensi | daftar hadir | pdf/spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Bersifat internal/sensitif |
| Daftar Peserta | data peserta/delegasi | pdf/spreadsheet/drive_link | Ya | Tidak | Ya | Opsional | Data sensitif peserta (tidak boleh dibagikan) |
| SK Panitia | susunan panitia | pdf/document/drive_link | Ya | Opsional | Ya | Opsional | Struktur kepanitiaan |
| Timeline Kerja | jadwal kerja panitia | pdf/spreadsheet/drive_link | Ya | Ya | Ya | Opsional | Jadwal kerja kepanitiaan |
| Checklist Perlengkapan | list alat/kebutuhan | pdf/spreadsheet/checklist | Ya | Ya | Ya | Opsional | List checklist barang divisi |

### 4. Keuangan dan Spreadsheet
Laporan anggaran dan detail pencatatan transaksi divisi. Mayoritas data berisikan data internal, tetapi template rancangan seperti RAB dan Invoice sangat berguna sebagai referensi.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| RAB | rencana anggaran biaya | spreadsheet/drive_link | Ya | Ya | Ya | Opsional | Template anggaran biaya |
| LPJ Keuangan | laporan dana | spreadsheet/drive_link | Ya | Ya | Ya | Opsional | Template laporan keuangan |
| Rekap Pengeluaran | spreadsheet pengeluaran | spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Data keuangan internal |
| Rekap Pemasukan | dana masuk, sponsor, kas | spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Data keuangan internal |
| Bukti Pembayaran | nota, transfer, invoice | image/pdf | Ya | Tidak | Ya | Opsional | Bukti transfer/kuitansi bayar (sensitif) |
| Invoice | invoice vendor/sponsor | pdf/drive_link | Ya | Ya | Ya | Opsional | Template invoice sponsor/vendor |
| Kwitansi | bukti transaksi | pdf/drive_link | Ya | Ya | Ya | Opsional | Template kuitansi internal |
| Sponsorship Sheet | rekap sponsor | spreadsheet/drive_link | Ya | Ya | Ya | Opsional | Progres list/database sponsor |
| Konsumsi Sheet | rekap konsumsi | spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Detail pembagian makanan |
| Transport Sheet | rekap transportasi | spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Detail armada/biaya transport |
| Merchandise Sheet | rekap kaos, name tag, dsb | spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Rekap data pemesanan merch |

### 5. Konten dan Copywriting
Dokumen naskah promosi, script komunikasi, dan teks penyebaran informasi. Membantu tim berikutnya memelihara format teks promosi yang efektif.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Caption Instagram | caption feed/story/reels | text/document | Ya | Ya | Tidak | Opsional | Teks copy sosmed |
| Copy Poster | teks utama poster/pamflet | text/document | Ya | Ya | Tidak | Opsional | Teks copy promosi |
| Press Release | rilis berita kegiatan | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Rilis berita media partner |
| Narasi MC | script MC | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Script/pemandu pembacaan MC |
| Script Voice Over | narasi video dokumentasi | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Naskah rekaman VO |
| Script Video | script reels/highlight | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Naskah konsep/tata video |
| Sambutan | draft sambutan ketua/pembina | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Konsep teks sambutan |
| Rundown Narasi | narasi teknis acara | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Alur penulisan script detail |
| Broadcast Message | pesan WA publikasi | text/document | Ya | Ya | Tidak | Opsional | Pesan broadcast sosmed |
| Reminder Text | template reminder peserta/panitia | text/document | Ya | Ya | Tidak | Opsional | Pengingat internal/eksternal |
| Template Email | email undangan/konfirmasi | text/document | Ya | Ya | Tidak | Opsional | Draft template email |

### 6. Video dan Multimedia
Mencakup video promosi (teaser), rangkuman acara (highlight), aftermovie, bumper animasi, dan berkas audio pendukung editing.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Video Teaser | teaser acara | video/drive_link | Ya | Ya | Opsional | Ya | Penting untuk referensi video promosi |
| Video Highlight | rangkuman acara | video/drive_link | Ya | Ya | Opsional | Ya | Rangkuman visual event |
| Video Aftermovie | aftermovie event | video/drive_link | Ya | Ya | Opsional | Ya | Video aftermovie utama |
| Video Dokumentasi | dokumentasi utama | video/drive_link | Ya | Ya | Opsional | Ya | Full video dokumentasi acara |
| Video Opening | opening ceremony/event | video/drive_link | Ya | Ya | Opsional | Ya | Video pembuka |
| Video Bumper | bumper pembuka/penutup | video/drive_link | Ya | Ya | Opsional | Ya | Animasi logo durasi pendek |
| Video Testimoni | testimoni peserta/panitia | video/drive_link | Ya | Ya | Opsional | Ya | Review/tanggapan lisan |
| Motion Graphic | animasi publikasi | video/drive_link/figma_link | Ya | Ya | Opsional | Ya | Animasi grafis promosi |
| Lower Third | nama pembicara/MC di video | video/image/drive_link | Ya | Ya | Ya | Opsional | Lower third overlay |
| Subtitle File | file subtitle/caption | document/text | Ya | Opsional | Ya | Opsional | Subtitle srt/vtt |
| Audio Backsound | backsound legal/internal | drive_link | Ya | Opsional | Ya | Opsional | Backsound audio |
| Voice Over | file audio narasi | drive_link | Ya | Opsional | Ya | Opsional | Audio narator |

### 7. Dokumentasi Foto
Hasil tangkapan kamera selama persiapan dan pelaksanaan acara. Hanya foto publikasi yang telah diedit atau folder kurasi foto terpilih yang dianjurkan masuk ke Referensi.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Foto Dokumentasi | foto kegiatan utama | image/drive_link | Ya | Opsional | Ya | Opsional | Foto momen utama |
| Foto Panitia | foto kepanitiaan | image/drive_link | Ya | Opsional | Ya | Opsional | Foto kepanitiaan divisi/angkatan |
| Foto Peserta | foto peserta/delegasi | image/drive_link | Ya | Opsional | Ya | Opsional | Foto interaksi peserta |
| Foto Narasumber | pemateri/tamu | image/drive_link | Ya | Opsional | Ya | Opsional | Foto pemateri/tamu VIP |
| Foto Venue | lokasi kegiatan | image/drive_link | Ya | Opsional | Ya | Opsional | Dokumentasi dekor/layout venue |
| Foto Produk/Barang | dokumentasi barang/event booth | image/drive_link | Ya | Opsional | Ya | Opsional | Foto barang/booth |
| Foto Behind The Scene | proses panitia | image/drive_link | Ya | Opsional | Ya | Opsional | Dokumentasi persiapan panitia |
| Foto Publikasi | foto yang dipakai untuk posting | image/drive_link | Ya | Ya | Ya | Opsional | Foto terpilih pasca editing |
| Selected Photos | foto kurasi terbaik | drive_link | Ya | Ya | Ya | Opsional | Link folder kurasi foto terbaik |
| Dokumentasi Mentah | folder mentah kamera | drive_link | Ya | Tidak | Tidak | Ya | Tautan folder foto RAW kamera (sangat besar) |

### 8. Aset Desain
File mentah aset visual pendukung promosi, mulai dari logo, ilustrasi, hingga tautan template pengerjaan Canva, Figma, PSD, dan AI.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Logo | logo acara/organisasi | image/drive_link | Ya | Ya | Ya | Opsional | Aset visual logo |
| Icon | icon custom event | image/drive_link | Ya | Ya | Ya | Opsional | Custom icon set |
| Ilustrasi | ilustrasi pendukung visual | image/drive_link | Ya | Ya | Ya | Opsional | Custom illustration |
| Pattern | pattern background | image/drive_link | Ya | Ya | Ya | Opsional | Pola background dekoratif |
| Background | background publikasi | image/drive_link | Ya | Ya | Ya | Opsional | Latar belakang grafis |
| Texture | grain, paper texture, dsb | image/drive_link | Ya | Ya | Ya | Opsional | Tekstur pendukung visual |
| Font Pairing | kombinasi font | text/image | Ya | Ya | Tidak | Opsional | Guideline nama-nama font |
| Color Palette | palet event | image/text | Ya | Ya | Ya | Opsional | Paduan hex warna |
| Template Canva | link template Canva | canva_link | Ya | Ya | Tidak | Ya | Tautan shareable template canva |
| Template Figma | link Figma | figma_link | Ya | Ya | Tidak | Ya | Tautan figma file |
| Template Photoshop | PSD publikasi | drive_link | Ya | Ya | Tidak | Ya | Tautan file PSD di GDrive |
| Template Illustrator | AI/vector file | drive_link | Ya | Ya | Tidak | Ya | Tautan file AI di GDrive |
| Mockup | mockup visual produk/media | image/drive_link | Ya | Ya | Ya | Opsional | Desain preview visual produk |
| Asset Drive | folder aset pendukung | drive_link | Ya | Ya | Tidak | Ya | Kumpulan link asset lengkap di Drive |

### 9. Perlengkapan dan Operasional
Dokumen, daftar inventaris, denah, serta catatan pendukung kebutuhan operasional di lapangan. Digunakan untuk merancang tata letak dan logistik acara.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| List Perlengkapan | alat yang dibutuhkan | spreadsheet/document/drive_link | Ya | Ya | Ya | Opsional | Checklist perlengkapan |
| Inventaris Acara | barang dipakai | spreadsheet/drive_link | Ya | Opsional | Ya | Opsional | Catatan log barang inventaris |
| Peminjaman Alat | surat/list alat pinjam | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Surat pinjam alat |
| Layout Ruangan | denah kursi, panggung, booth | image/pdf/drive_link | Ya | Ya | Ya | Opsional | Denah tata letak panggung/meja |
| Denah Venue | lokasi ruangan/tempat acara | image/pdf | Ya | Ya | Ya | Opsional | Peta lokasi ruangan/tempat |
| Rundown Teknis | alur teknis acara | pdf/document/drive_link | Ya | Ya | Ya | Opsional | Rundown detail divisi acara & perlengkapan |
| Cue Card | kartu cue MC/operator | pdf/document/canva_link | Ya | Ya | Ya | Opsional | Kartu pemandu MC/operator |
| Operator Notes | catatan operator audio/visual | pdf/document/text | Ya | Opsional | Ya | Opsional | Catatan operator sound/slide |
| Lighting Notes | catatan lampu/panggung | pdf/document/text | Ya | Opsional | Ya | Opsional | Catatan tata lampu |
| Sound Notes | catatan audio/sound | pdf/document/text | Ya | Opsional | Ya | Opsional | Catatan soundcheck |

### 10. Koordinasi dan Aktivitas Non-File
Jobdesk penugasan harian, follow-up, briefing divisi, monitoring progres, dan rapat koordinasi. Output berupa catatan log aktivitas, bukan file fisik. Sama sekali tidak diperbolehkan masuk Referensi.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Briefing | briefing panitia/PIC | activity_log/text | Opsional | Tidak | Tidak | Tidak | Catatan koordinasi internal |
| Koordinasi Sie Lain | follow-up konsumsi, acara, perlengkapan | activity_log/text | Opsional | Tidak | Tidak | Tidak | Catatan koordinasi lintas divisi |
| Follow-up PIC | cek progres anggota | activity_log/text | Opsional | Tidak | Tidak | Tidak | Pantau progres tugas tim |
| Rapat Internal | rapat divisi | activity_log/text | Opsional | Tidak | Tidak | Tidak | Catatan notula rapat internal |
| Distribusi Tugas | pembagian kerja | activity_log/text/checklist | Opsional | Tidak | Tidak | Tidak | Plot penugasan |
| Cek Kesiapan | cek file, cek alat, cek publikasi | activity_log/text/checklist | Opsional | Tidak | Tidak | Tidak | Pengecekan item |
| Konfirmasi Vendor | chat/vendor/tamu | activity_log/text | Opsional | Tidak | Tidak | Tidak | Catatan konfirmasi vendor |
| Konfirmasi Narasumber | follow-up pemateri | activity_log/text | Opsional | Tidak | Tidak | Tidak | Catatan konfirmasi narasumber |
| Reminder Internal | pengingat deadline | activity_log/text | Opsional | Tidak | Tidak | Tidak | Reminder deadline |
| Monitoring Progress | pantau status | activity_log/text | Opsional | Tidak | Tidak | Tidak | Catatan pantauan progress |
| Review Internal | cek hasil sebelum approve | activity_log/text | Opsional | Tidak | Tidak | Tidak | Review pengerjaan |
| Quality Control | pengecekan hasil akhir | activity_log/text | Opsional | Tidak | Tidak | Tidak | QC kelayakan output |

### 11. Publikasi dan Media Sosial
Kalender editorial konten sosial media, rencana caption, daftar hashtag, proposal medpart, serta laporan performa akun (insight).

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Jadwal Posting | kalender publikasi | spreadsheet/image/drive_link | Ya | Ya | Ya | Opsional | Rencana upload konten |
| Content Plan | rencana konten | spreadsheet/document/drive_link | Ya | Ya | Ya | Opsional | Konsep tulisan/visual konten |
| Content Calendar | kalender konten | spreadsheet/drive_link | Ya | Ya | Ya | Opsional | Jadwal bulanan konten |
| Draft Feed | draft visual feed | image/canva_link/drive_link | Ya | Ya | Ya | Opsional | Draft postingan feed |
| Draft Story | draft story | image/canva_link/drive_link | Ya | Ya | Ya | Opsional | Draft postingan story |
| Draft Reels | draft reels | video/drive_link | Ya | Ya | Ya | Opsional | Draft postingan video pendek |
| Caption Plan | rencana caption | text/document | Ya | Ya | Tidak | Opsional | Teks caption postingan |
| Hashtag List | list hashtag | text/document | Ya | Ya | Tidak | Opsional | Daftar hashtag relevan |
| Media Partner Kit | materi untuk media partner | pdf/drive_link | Ya | Ya | Ya | Opsional | Proposal/materi medpart |
| Publikasi Final | bukti post final | image/drive_link | Ya | Ya | Ya | Opsional | Tangkapan layar bukti postingan tayang |
| Insight Report | laporan engagement | pdf/image/spreadsheet | Ya | Opsional | Ya | Opsional | Laporan performa pasca event |

### 12. Registrasi dan Peserta
Administrasi pendaftaran, absensi, daftar kehadiran, pembuatan kupon, e-ticket, dan sertifikat massal. Data spreadsheet daftar pendaftar adalah data sensitif dan dilarang masuk Referensi.

| Subkategori | Contoh Penggunaan | Jenis Output | Masuk Arsip Default | Masuk Referensi Default | Wajib File | Wajib Link Sumber | Catatan |
|---|---|---|---:|---:|---:|---:|---|
| Form Pendaftaran | link Google Form | drive_link | Ya | Ya | Tidak | Ya | Link form registrasi online |
| Header Google Form | desain header form | image/canva_link | Ya | Ya | Ya | Opsional | Banner header form |
| Rekap Pendaftar | spreadsheet peserta | spreadsheet/drive_link | Ya | Tidak | Ya | Opsional | Rekap pendaftar (sensitif) |
| Rekap Kehadiran | absensi | spreadsheet/drive_link | Ya | Tidak | Ya | Opsional | Absensi kehadiran (sensitif) |
| Sertifikat Peserta | sertifikat bulk | drive_link | Ya | Ya | Tidak | Ya | Drive folder sertifikat massal |
| E-ticket | tiket peserta | pdf/image/canva_link | Ya | Ya | Ya | Opsional | Tiket masuk elektronik |
| Kupon | kupon bazar/konsumsi | image/pdf/canva_link | Ya | Ya | Ya | Opsional | Kupon bazar/konsumsi |
| QR Code Peserta | QR check-in | image/drive_link | Ya | Opsional | Ya | Opsional | QR check-in peserta |
| Data Delegasi | data perwakilan | spreadsheet/drive_link | Ya | Tidak | Ya | Opsional | Data detail delegasi (sensitif) |

---

## Machine-Readable Rule Table

Tabel ringkas di bawah ini disediakan agar mempermudah implementasi logic berbasis aturan (rule-based system) pada sisi kode program.

| category_key | subcategory_key | label | output_types | archive_default | reference_default | requires_file | requires_source_link | sensitivity | notes |
|---|---|---|---|---:|---:|---:|---:|---|---|
| desain_publikasi | poster | Poster | image,pdf,canva_link | true | true | true | false | normal | Cocok untuk referensi desain |
| desain_publikasi | pamflet | Pamflet | image,pdf,canva_link | true | true | true | false | normal | Cocok untuk referensi desain |
| desain_publikasi | flyer | Flyer | image,pdf,canva_link | true | true | true | false | normal | Cocok untuk referensi desain |
| desain_publikasi | feed_instagram | Feed Instagram | image,canva_link | true | true | true | false | normal | Desain feed media sosial |
| desain_publikasi | story_instagram | Story Instagram | image,canva_link | true | true | true | false | normal | Berguna untuk referensi template story |
| desain_publikasi | reels_cover | Reels Cover | image,canva_link | true | true | true | false | normal | Desain cover video pendek |
| desain_publikasi | thumbnail_video | Thumbnail Video | image,canva_link | true | true | true | false | normal | Desain cover YouTube/highlight |
| desain_publikasi | banner_digital | Banner Digital | image,canva_link | true | true | true | false | normal | Desain banner landscape digital |
| desain_publikasi | spanduk_banner_cetak | Spanduk / Banner Cetak | image,pdf,canva_link | true | true | true | false | normal | Desain spanduk fisik |
| desain_publikasi | x_banner | X-Banner | image,pdf,canva_link | true | true | true | false | normal | Desain standing banner cetak |
| desain_publikasi | baliho | Baliho | image,pdf,canva_link | true | true | true | false | normal | Desain cetak baliho besar |
| desain_publikasi | twibbon | Twibbon | image,canva_link | true | true | true | false | normal | Biasanya format PNG transparan |
| desain_publikasi | frame_foto | Frame Foto | image,canva_link | true | true | true | false | normal | Overlay frame dokumentasi |
| desain_publikasi | photobooth | Photobooth | image,pdf,canva_link | true | true | true | false | normal | Layout desain photobooth fisik |
| desain_publikasi | background_zoom | Background Zoom | image,canva_link | true | true | true | false | normal | Resolusi landscape 16:9 |
| desain_publikasi | countdown_design | Countdown Design | image,canva_link | true | true | true | false | normal | Desain hitung mundur event |
| desain_publikasi | announcement_design | Announcement Design | image,pdf,canva_link | true | true | true | false | normal | Desain pengumuman hasil |
| desain_publikasi | thank_you_post | Thank You Post | image,canva_link | true | true | true | false | normal | Desain ucapan penutup acara |
| identitas_acara_dan_panitia | name_tag | Name Tag | image,pdf,canva_link | true | true | true | false | normal | Identitas peserta/panitia |
| identitas_acara_dan_panitia | id_card | ID Card | image,pdf,canva_link | true | true | true | false | normal | Kartu panitia/crew |
| identitas_acara_dan_panitia | kartu_panitia | Kartu Panitia | image,pdf,canva_link | true | true | true | false | normal | Versi lokal name tag |
| identitas_acara_dan_panitia | badge_peserta | Badge Peserta | image,pdf,canva_link | true | true | true | false | normal | Identitas delegasi/peserta |
| identitas_acara_dan_panitia | sertifikat | Sertifikat | image,pdf,canva_link,drive_link | true | true | optional | true | normal | Template sertifikat sangat penting |
| identitas_acara_dan_panitia | piagam | Piagam | image,pdf,canva_link | true | true | true | false | normal | Desain piagam pemenang/mitra |
| identitas_acara_dan_panitia | plakat_design | Plakat Design | image,pdf,canva_link | true | true | true | false | normal | Desain plakat/cenderamata |
| identitas_acara_dan_panitia | kop_surat_acara | Kop Surat Acara | image,document,canva_link | true | true | true | false | normal | Kop surat resmi kepanitiaan |
| identitas_acara_dan_panitia | logo_acara | Logo Acara | image,drive_link | true | true | true | false | normal | Logo utama event |
| identitas_acara_dan_panitia | maskot_acara | Maskot Acara | image,drive_link | true | true | true | false | normal | Maskot/karakter event |
| identitas_acara_dan_panitia | brand_guideline_acara | Brand Guideline Acara | pdf,canva_link,figma_link | true | true | true | false | normal | Panduan identitas visual |
| identitas_acara_dan_panitia | color_palette | Color Palette | image,canva_link,figma_link | true | true | true | false | normal | Kode warna branding |
| identitas_acara_dan_panitia | supergraphic | Supergraphic | image,drive_link | true | true | true | false | normal | Elemen grafis dekoratif |
| dokumen_administrasi | proposal | Proposal | pdf,document,drive_link | true | true | true | false | normal | Template proposal kegiatan |
| dokumen_administrasi | cover_proposal | Cover Proposal | image,pdf,canva_link | true | true | true | false | normal | Desain cover depan proposal |
| dokumen_administrasi | lpj | LPJ | pdf,document,drive_link | true | true | true | false | normal | Template laporan pertanggungjawaban |
| dokumen_administrasi | surat_undangan | Surat Undangan | pdf,document,drive_link | true | true | true | false | normal | Surat undangan resmi |
| dokumen_administrasi | surat_permohonan | Surat Permohonan | pdf,document,drive_link | true | true | true | false | normal | Surat permohonan izin/dana |
| dokumen_administrasi | surat_tugas | Surat Tugas | pdf,document,drive_link | true | true | true | false | normal | Surat tugas kepanitiaan |
| dokumen_administrasi | surat_peminjaman | Surat Peminjaman | pdf,document,drive_link | true | true | true | false | normal | Surat pinjam ruang/alat |
| dokumen_administrasi | surat_dispensasi | Surat Dispensasi | pdf,document,drive_link | true | true | true | false | normal | Surat dispensasi kuliah/kerja |
| dokumen_administrasi | notulen | Notulen | pdf,document,drive_link | true | optional | true | false | internal | Hasil catatan rapat koordinasi |
| dokumen_administrasi | rundown | Rundown | pdf,spreadsheet,drive_link | true | true | true | false | normal | Susunan jadwal acara detail |
| dokumen_administrasi | tor_term_of_reference | TOR / Term of Reference | pdf,document,drive_link | true | true | true | false | normal | Panduan materi pembicara |
| dokumen_administrasi | juknis | Juknis | pdf,document,drive_link | true | true | true | false | normal | Petunjuk teknis lomba/acara |
| dokumen_administrasi | buku_panduan | Buku Panduan | pdf,document,drive_link | true | true | true | false | normal | Guidebook panduan event |
| dokumen_administrasi | sop | SOP | pdf,document,drive_link | true | true | true | false | normal | Standar operasional prosedur |
| dokumen_administrasi | absensi | Absensi | pdf,spreadsheet,drive_link | true | optional | true | false | sensitive | Bersifat internal/sensitif |
| dokumen_administrasi | daftar_peserta | Daftar Peserta | pdf,spreadsheet,drive_link | true | false | true | false | sensitive | Data sensitif peserta (tidak untuk referensi) |
| dokumen_administrasi | sk_panitia | SK Panitia | pdf,document,drive_link | true | optional | true | false | internal | Struktur kepanitiaan |
| dokumen_administrasi | timeline_kerja | Timeline Kerja | pdf,spreadsheet,drive_link | true | true | true | false | normal | Jadwal kerja kepanitiaan |
| dokumen_administrasi | checklist_perlengkapan | Checklist Perlengkapan | pdf,spreadsheet,checklist | true | true | true | false | normal | List checklist barang divisi |
| keuangan_dan_spreadsheet | rab | RAB | spreadsheet,drive_link | true | true | true | false | normal | Template anggaran biaya |
| keuangan_dan_spreadsheet | lpj_keuangan | LPJ Keuangan | spreadsheet,drive_link | true | true | true | false | normal | Template laporan keuangan |
| keuangan_dan_spreadsheet | rekap_pengeluaran | Rekap Pengeluaran | spreadsheet,drive_link | true | optional | true | false | internal | Data keuangan internal |
| keuangan_dan_spreadsheet | rekap_pemasukan | Rekap Pemasukan | spreadsheet,drive_link | true | optional | true | false | internal | Data keuangan internal |
| keuangan_dan_spreadsheet | bukti_pembayaran | Bukti Pembayaran | image,pdf | true | false | true | false | sensitive | Bukti transfer/kuitansi bayar (sensitif) |
| keuangan_dan_spreadsheet | invoice | Invoice | pdf,drive_link | true | true | true | false | normal | Template invoice sponsor/vendor |
| keuangan_dan_spreadsheet | kwitansi | Kwitansi | pdf,drive_link | true | true | true | false | normal | Template kuitansi internal |
| keuangan_dan_spreadsheet | sponsorship_sheet | Sponsorship Sheet | spreadsheet,drive_link | true | true | true | false | normal | Progres list/database sponsor |
| keuangan_dan_spreadsheet | konsumsi_sheet | Konsumsi Sheet | spreadsheet,drive_link | true | optional | true | false | internal | Detail pembagian makanan |
| keuangan_dan_spreadsheet | transport_sheet | Transport Sheet | spreadsheet,drive_link | true | optional | true | false | internal | Detail armada/biaya transport |
| keuangan_dan_spreadsheet | merchandise_sheet | Merchandise Sheet | spreadsheet,drive_link | true | optional | true | false | internal | Rekap data pemesanan merch |
| konten_dan_copywriting | caption_instagram | Caption Instagram | text,document | true | true | false | false | normal | Teks copy sosmed |
| konten_dan_copywriting | copy_poster | Copy Poster | text,document | true | true | false | false | normal | Teks copy promosi |
| konten_dan_copywriting | press_release | Press Release | pdf,document,drive_link | true | true | true | false | normal | Rilis berita media partner |
| konten_dan_copywriting | narasi_mc | Narasi MC | pdf,document,drive_link | true | true | true | false | normal | Script/pemandu pembacaan MC |
| konten_dan_copywriting | script_voice_over | Script Voice Over | pdf,document,drive_link | true | true | true | false | normal | Naskah rekaman VO |
| konten_dan_copywriting | script_video | Script Video | pdf,document,drive_link | true | true | true | false | normal | Naskah konsep/tata video |
| konten_dan_copywriting | sambutan | Sambutan | pdf,document,drive_link | true | true | true | false | normal | Konsep teks sambutan |
| konten_dan_copywriting | rundown_narasi | Rundown Narasi | pdf,document,drive_link | true | true | true | false | normal | Alur penulisan script detail |
| konten_dan_copywriting | broadcast_message | Broadcast Message | text,document | true | true | false | false | normal | Pesan broadcast sosmed |
| konten_dan_copywriting | reminder_text | Reminder Text | text,document | true | true | false | false | normal | Pengingat internal/eksternal |
| konten_dan_copywriting | template_email | Template Email | text,document | true | true | false | false | normal | Draft template email |
| video_dan_multimedia | video_teaser | Video Teaser | video,drive_link | true | true | optional | true | normal | Penting untuk referensi video promosi |
| video_dan_multimedia | video_highlight | Video Highlight | video,drive_link | true | true | optional | true | normal | Rangkuman visual event |
| video_dan_multimedia | video_aftermovie | Video Aftermovie | video,drive_link | true | true | optional | true | normal | Video aftermovie utama |
| video_dan_multimedia | video_dokumentasi | Video Dokumentasi | video,drive_link | true | true | optional | true | normal | Full video dokumentasi acara |
| video_dan_multimedia | video_opening | Video Opening | video,drive_link | true | true | optional | true | normal | Video pembuka |
| video_dan_multimedia | video_bumper | Video Bumper | video,drive_link | true | true | optional | true | normal | Animasi logo durasi pendek |
| video_dan_multimedia | video_testimoni | Video Testimoni | video,drive_link | true | true | optional | true | normal | Review/tanggapan lisan |
| video_dan_multimedia | motion_graphic | Motion Graphic | video,drive_link,figma_link | true | true | optional | true | normal | Animasi grafis promosi |
| video_dan_multimedia | lower_third | Lower Third | video,image,drive_link | true | true | true | false | normal | Lower third overlay |
| video_dan_multimedia | subtitle_file | Subtitle File | document,text | true | optional | true | false | normal | Subtitle srt/vtt |
| video_dan_multimedia | audio_backsound | Audio Backsound | drive_link | true | optional | true | false | internal | Backsound audio |
| video_dan_multimedia | voice_over | Voice Over | drive_link | true | optional | true | false | normal | Audio narator |
| dokumentasi_foto | foto_dokumentasi | Foto Dokumentasi | image,drive_link | true | optional | true | false | normal | Foto momen utama |
| dokumentasi_foto | foto_panitia | Foto Panitia | image,drive_link | true | optional | true | false | normal | Foto kepanitiaan divisi/angkatan |
| dokumentasi_foto | foto_peserta | Foto Peserta | image,drive_link | true | optional | true | false | normal | Foto interaksi peserta |
| dokumentasi_foto | foto_narasumber | Foto Narasumber | image,drive_link | true | optional | true | false | normal | Foto pemateri/tamu VIP |
| dokumentasi_foto | foto_venue | Foto Venue | image,drive_link | true | optional | true | false | normal | Dokumentasi dekor/layout venue |
| dokumentasi_foto | foto_produk_barang | Foto Produk/Barang | image,drive_link | true | optional | true | false | normal | Foto barang/booth |
| dokumentasi_foto | foto_behind_the_scene | Foto Behind The Scene | image,drive_link | true | optional | true | false | normal | Dokumentasi persiapan panitia |
| dokumentasi_foto | foto_publikasi | Foto Publikasi | image,drive_link | true | true | true | false | normal | Foto terpilih pasca editing |
| dokumentasi_foto | selected_photos | Selected Photos | drive_link | true | true | true | false | normal | Link folder kurasi foto terbaik |
| dokumentasi_foto | dokumentasi_mentah | Dokumentasi Mentah | drive_link | true | false | false | true | internal | Tautan folder foto RAW kamera |
| aset_desain | logo | Logo | image,drive_link | true | true | true | false | normal | Aset visual logo |
| aset_desain | icon | Icon | image,drive_link | true | true | true | false | normal | Custom icon set |
| aset_desain | ilustrasi | Ilustrasi | image,drive_link | true | true | true | false | normal | Custom illustration |
| aset_desain | pattern | Pattern | image,drive_link | true | true | true | false | normal | Pola background dekoratif |
| aset_desain | background | Background | image,drive_link | true | true | true | false | normal | Latar belakang grafis |
| aset_desain | texture | Texture | image,drive_link | true | true | true | false | normal | Tekstur pendukung visual |
| aset_desain | font_pairing | Font Pairing | text,image | true | true | false | false | normal | Guideline nama-nama font |
| aset_desain | color_palette | Color Palette | image,text | true | true | true | false | normal | Paduan hex warna |
| aset_desain | template_canva | Template Canva | canva_link | true | true | false | true | normal | Tautan shareable template canva |
| aset_desain | template_figma | Template Figma | figma_link | true | true | false | true | normal | Tautan figma file |
| aset_desain | template_photoshop | Template Photoshop | drive_link | true | true | false | true | normal | Tautan file PSD di GDrive |
| aset_desain | template_illustrator | Template Illustrator | drive_link | true | true | false | true | normal | Tautan file AI di GDrive |
| aset_desain | mockup | Mockup | image,drive_link | true | true | true | false | normal | Desain preview visual produk |
| aset_desain | asset_drive | Asset Drive | drive_link | true | true | false | true | normal | Kumpulan link asset lengkap di Drive |
| perlengkapan_dan_operasional | list_perlengkapan | List Perlengkapan | spreadsheet,document,drive_link | true | true | true | false | normal | Checklist perlengkapan |
| perlengkapan_dan_operasional | inventaris_acara | Inventaris Acara | spreadsheet,drive_link | true | optional | true | false | normal | Catatan log barang inventaris |
| perlengkapan_dan_operasional | peminjaman_alat | Peminjaman Alat | pdf,document,drive_link | true | true | true | false | normal | Surat pinjam alat |
| perlengkapan_dan_operasional | layout_ruangan | Layout Ruangan | image,pdf,drive_link | true | true | true | false | normal | Denah tata letak panggung/meja |
| perlengkapan_dan_operasional | denah_venue | Denah Venue | image,pdf | true | true | true | false | normal | Peta lokasi ruangan/tempat |
| perlengkapan_dan_operasional | rundown_teknis | Rundown Teknis | pdf,document,drive_link | true | true | true | false | normal | Rundown detail divisi acara & perlengkapan |
| perlengkapan_dan_operasional | cue_card | Cue Card | pdf,document,canva_link | true | true | true | false | normal | Kartu pemandu MC/operator |
| perlengkapan_dan_operasional | operator_notes | Operator Notes | pdf,document,text | true | optional | true | false | normal | Catatan operator sound/slide |
| perlengkapan_dan_operasional | lighting_notes | Lighting Notes | pdf,document,text | true | optional | true | false | normal | Catatan tata lampu |
| perlengkapan_dan_operasional | sound_notes | Sound Notes | pdf,document,text | true | optional | true | false | normal | Catatan soundcheck |
| koordinasi_dan_aktivitas_non_file | briefing | Briefing | activity_log,text | optional | false | false | false | internal | Catatan koordinasi internal |
| koordinasi_dan_aktivitas_non_file | koordinasi_sie_lain | Koordinasi Sie Lain | activity_log,text | optional | false | false | false | internal | Catatan koordinasi lintas divisi |
| koordinasi_dan_aktivitas_non_file | follow_up_pic | Follow-up PIC | activity_log,text | optional | false | false | false | internal | Pantau progres tugas tim |
| koordinasi_dan_aktivitas_non_file | rapat_internal | Rapat Internal | activity_log,text | optional | false | false | false | internal | Catatan notula rapat internal |
| koordinasi_dan_aktivitas_non_file | distribusi_tugas | Distribusi Tugas | activity_log,text,checklist | optional | false | false | false | internal | Plot penugasan |
| koordinasi_dan_aktivitas_non_file | cek_kesiapan | Cek Kesiapan | activity_log,text,checklist | optional | false | false | false | internal | Pengecekan item |
| koordinasi_dan_aktivitas_non_file | konfirmasi_vendor | Konfirmasi Vendor | activity_log,text | optional | false | false | false | internal | Catatan konfirmasi vendor |
| koordinasi_dan_aktivitas_non_file | konfirmasi_narasumber | Konfirmasi Narasumber | activity_log,text | optional | false | false | false | internal | Catatan konfirmasi narasumber |
| koordinasi_dan_aktivitas_non_file | reminder_internal | Reminder Internal | activity_log,text | optional | false | false | false | internal | Reminder deadline |
| koordinasi_dan_aktivitas_non_file | monitoring_progress | Monitoring Progress | activity_log,text | optional | false | false | false | internal | Catatan pantauan progress |
| koordinasi_dan_aktivitas_non_file | review_internal | Review Internal | activity_log,text | optional | false | false | false | internal | Review pengerjaan |
| koordinasi_dan_aktivitas_non_file | quality_control | Quality Control | activity_log,text | optional | false | false | false | internal | QC kelayakan output |
| publikasi_dan_media_sosial | jadwal_posting | Jadwal Posting | spreadsheet,image,drive_link | true | true | true | false | normal | Rencana upload konten |
| publikasi_dan_media_sosial | content_plan | Content Plan | spreadsheet,document,drive_link | true | true | true | false | normal | Konsep tulisan/visual konten |
| publikasi_dan_media_sosial | content_calendar | Content Calendar | spreadsheet,drive_link | true | true | true | false | normal | Jadwal bulanan konten |
| publikasi_dan_media_sosial | draft_feed | Draft Feed | image,canva_link,drive_link | true | true | true | false | normal | Draft postingan feed |
| publikasi_dan_media_sosial | draft_story | Draft Story | image,canva_link,drive_link | true | true | true | false | normal | Draft postingan story |
| publikasi_dan_media_sosial | draft_reels | Draft Reels | video,drive_link | true | true | true | false | normal | Draft postingan video pendek |
| publikasi_dan_media_sosial | caption_plan | Caption Plan | text,document | true | true | false | false | normal | Teks caption postingan |
| publikasi_dan_media_sosial | hashtag_list | Hashtag List | text,document | true | true | false | false | normal | Daftar hashtag relevan |
| publikasi_dan_media_sosial | media_partner_kit | Media Partner Kit | pdf,drive_link | true | true | true | false | normal | Proposal/materi medpart |
| publikasi_dan_media_sosial | publikasi_final | Publikasi Final | image,drive_link | true | true | true | false | normal | Tangkapan layar bukti postingan tayang |
| publikasi_dan_media_sosial | insight_report | Insight Report | pdf,image,spreadsheet | true | optional | true | false | normal | Laporan performa pasca event |
| registrasi_dan_peserta | form_pendaftaran | Form Pendaftaran | drive_link | true | true | false | true | normal | Link form registrasi online |
| registrasi_dan_peserta | header_google_form | Header Google Form | image,canva_link | true | true | true | false | normal | Banner header form |
| registrasi_dan_peserta | rekap_pendaftar | Rekap Pendaftar | spreadsheet,drive_link | true | false | true | false | sensitive | Rekap pendaftar (sensitif) |
| registrasi_dan_peserta | rekap_kehadiran | Rekap Kehadiran | spreadsheet,drive_link | true | false | true | false | sensitive | Absensi kehadiran (sensitif) |
| registrasi_dan_peserta | sertifikat_peserta | Sertifikat Peserta | drive_link | true | true | false | true | normal | Drive folder sertifikat massal |
| registrasi_dan_peserta | e_ticket | E-ticket | pdf,image,canva_link | true | true | true | false | normal | Tiket masuk elektronik |
| registrasi_dan_peserta | kupon | Kupon | image,pdf,canva_link | true | true | true | false | normal | Kupon bazar/konsumsi |
| registrasi_dan_peserta | qr_code_peserta | QR Code Peserta | image,drive_link | true | optional | true | false | normal | QR check-in peserta |
| registrasi_dan_peserta | data_delegasi | Data Delegasi | spreadsheet,drive_link | true | false | true | false | sensitive | Data detail delegasi (sensitif) |

---

## Recommended Form Fields

Untuk mengintegrasikan aturan ini dengan UI pembuatan jobdesk, disarankan agar form memiliki field berikut:
- **Kategori utama** (`category_key`): Dropdown pilihan utama.
- **Subkategori** (`subcategory_key`): Dropdown dinamis (dependent dropdown) yang menyesuaikan kategori utama.
- **Jenis output** (`output_types`): Multi-select atau checkbox pilihan output yang diizinkan (misalnya: `image`, `pdf`, `video`, `document`, `spreadsheet`, `canva_link`, `figma_link`, `drive_link`, `text`, `checklist`, `activity_log`).
- **Wajib upload file** (`requires_file`): Toggle/switch boolean (default terisi secara otomatis, dapat dinonaktifkan/diaktifkan manual).
- **Wajib link sumber** (`requires_source_link`): Toggle/switch boolean (default terisi secara otomatis).
- **Masuk arsip** (`archive_default`): Toggle/switch boolean untuk menandai apakah tugas ini otomatis masuk arsip ketika disetujui (default terisi otomatis).
- **Jadikan kandidat referensi** (`reference_default`): Toggle/switch boolean untuk menentukan apakah output tugas ini layak dijadikan contoh inspirasi/template di masa mendatang (default terisi otomatis).
- **Sensitivitas data** (`sensitivity`): Dropdown/radio button pilihan tingkat kerahasiaan: `normal`, `sensitive`, `internal`.
- **Catatan arsip**: Kolom input deskripsi tambahan mengenai format penyimpanan atau panduan penyerahan berkas.

*Penting*: Walaupun nilai default terisi secara otomatis berdasarkan aturan dari subkategori pilihan, admin/koordinator/sekretaris acara harus tetap bisa mengubah opsi-opsi tersebut (override) secara manual sesuai kondisi riil tugas.

---

## Default Rule Behavior

Saat sistem berjalan, reaktivitas formulir dan pemrosesan backend berjalan sebagai berikut:
1. **Reaktivitas UI Form**:
   - Pengguna memilih "Kategori Utama: Desain Publikasi" dan "Subkategori: Poster".
   - Secara dinamis, form UI akan men-check toggle `Wajib upload file` ke status aktif, men-check toggle `Masuk arsip` ke status aktif, men-check toggle `Jadikan kandidat referensi` ke status aktif, dan menyetel `Sensitivitas data` ke `normal`.
2. **Fleksibilitas Pengguna**:
   - Jika poster tersebut memuat informasi internal yang belum boleh dibagikan ke publik/kepada penerus berikutnya, koordinator dapat mematikan toggle `Jadikan kandidat referensi` secara manual sebelum menyimpan tugas.
3. **Mekanisme Pasca-Persetujuan (Post-Approval)**:
   - Anggota panitia mengunggah berkas poster dan link Canva untuk menyelesaikan tugas.
   - Koordinator melakukan pengecekan dan mengeklik "Approve".
   - Backend membaca setelan tugas tersebut:
     - Karena `archive_default` bernilai `true`, data tugas dikirimkan ke tabel/koleksi `Archive`.
     - Karena `reference_default` bernilai `true`, data tugas juga diduplikasi ke galeri `Reference`.
     - Jika salah satu status bernilai `false`, maka data tidak akan diteruskan ke koleksi terkait.

---

## Notes for Future Implementation

1. **Config File & Constants**:
   Aturan-aturan ini harus diimplementasikan sebagai konstanta Javascript/Typescript statis (misal: `src/lib/constants/jobdesk-rules.ts`) agar backend dan frontend dapat mengimpor satu sumber kebenaran (single source of truth) yang sama.
2. **Firestore Schema Update**:
   - Dokumen koleksi `tasks` memerlukan field-field baru: `categoryKey`, `subcategoryKey`, `outputTypes` (array of strings), `requiresFile` (boolean), `requiresSourceLink` (boolean), `archiveDefault` (boolean), `referenceDefault` (boolean), dan `sensitivity` (string).
3. **Penyelarasan Form Dinamis**:
   - Gunakan react-hook-form `setValue` atau `useEffect` di frontend Next.js untuk merespons perubahan dropdown subkategori, sehingga form fields ter-update secara otomatis sesuai dengan data di file constants.
4. **Keamanan Database (Firestore Rules)**:
   - Tambahkan validasi pada level backend atau Firestore Security Rules untuk memastikan tugas dengan `sensitivity = sensitive` tidak pernah diizinkan memiliki field `referenceDefault = true`, guna mencegah kesalahan manusia (human error) oleh koordinator yang dapat membocorkan data pribadi.
