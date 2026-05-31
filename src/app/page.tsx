import {
  Archive,
  Bot,
  CheckCircle2,
  FileCheck2,
  FolderKanban,
  GalleryHorizontalEnd,
  MessageCircle,
  Palette,
  Send,
  Sparkles,
  UploadCloud,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const problems = [
  "Job desk tercecer di chat dan sulit dicari ulang.",
  "Spreadsheet tidak selalu menunjukkan siapa yang stuck.",
  "Hasil desain dan link Drive sering tersebar di banyak tempat.",
  "Referensi visual tahun sebelumnya tidak terdokumentasi rapi.",
];

const features = [
  {
    icon: FolderKanban,
    title: "Job Desk Divisi",
    description:
      "Kelola tugas rutin Humas dan Media Kreatif dalam satu dashboard.",
  },
  {
    icon: GalleryHorizontalEnd,
    title: "Job Desk Acara",
    description:
      "Pisahkan kebutuhan publikasi, dokumentasi, desain, dan PIC setiap acara.",
  },
  {
    icon: Workflow,
    title: "Status Workflow",
    description:
      "Pantau belum mulai, sedang dikerjakan, stuck, revisi, approval, hingga approved.",
  },
  {
    icon: UploadCloud,
    title: "Upload Hasil Desain",
    description:
      "Upload hasil desain ke Cloudinary dan tampilkan preview di detail task.",
  },
  {
    icon: MessageCircle,
    title: "Notifikasi WhatsApp",
    description:
      "Kirim update status, upload, revisi, approve, dan ringkasan ke grup.",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Tanyakan progress, kendala, deadline, atau ringkasan lewat dashboard dan WhatsApp.",
  },
  {
    icon: Archive,
    title: "Arsip Referensi",
    description:
      "Simpan link Drive, color palette, style notes, dan desain tahun sebelumnya.",
  },
  {
    icon: FileCheck2,
    title: "Approval & Revisi",
    description:
      "Koordinator bisa meminta revisi atau menyetujui task dengan activity log.",
  },
];

const workflowSteps = [
  "Buat acara atau job desk",
  "Assign PIC dan koordinator",
  "Anggota update status",
  "Upload hasil desain",
  "Koordinator revisi atau approve",
  "WhatsApp dan AI bantu ringkas progress",
];

const stats = [
  ["24", "Task aktif"],
  ["7", "Menunggu approval"],
  ["3", "Butuh bantuan"],
  ["42", "Referensi desain"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <Container className="py-5">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-white shadow-sm dark:bg-white dark:text-slate-950">
                JD
              </span>
              <div>
                <p className="text-lg font-bold text-slate-950 dark:text-white">
                  JobDex.in
                </p>
                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Humas & Media Kreatif
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="jd-btn-dark">
                <Link href="/dashboard">Masuk Dashboard</Link>
              </Button>
            </div>
          </nav>
        </Container>
      </div>

      <section className="dark relative jd-hero text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,197,94,0.10),transparent_28%,rgba(56,189,248,0.12)_72%,transparent)]" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <Badge className="border border-white/10 bg-white/10 text-slate-100">
              Koordinasi kreatif yang lebih rapi
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Koordinasi job desk organisasi tanpa tenggelam di chat.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              JobDex.in membantu divisi Humas dan Media Kreatif mencatat tugas,
              memantau status anggota, mengarsipkan referensi desain, mengirim
              update WhatsApp, dan merangkum progress dengan AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="jd-btn-light gap-2">
                <Link href="/dashboard">
                  Masuk ke Dashboardnya
                  <Send className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>

          <div className="p-3 jd-glass jd-soft-glow rounded-[8px]">
            <div className="rounded-[8px] border border-white/10 bg-slate-950/90 p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-semibold text-white">
                    Dashboard Koordinasi
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Progress minggu ini
                  </p>
                </div>
                <Badge className="bg-emerald-400/15 text-emerald-200">
                  Live MVP
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {stats.map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[8px] border border-white/10 bg-white/[0.06] p-4"
                  >
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="mt-1 text-sm text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Poster PKKMB", "stuck", "Butuh redaksi final"],
                  [
                    "Feed Open Recruitment",
                    "menunggu approval",
                    "Preview sudah upload",
                  ],
                  [
                    "Dokumentasi Seminar",
                    "sedang dikerjakan",
                    "Deadline dekat",
                  ],
                ].map(([task, status, note]) => (
                  <div
                    key={task}
                    className="rounded-[8px] border border-white/10 bg-white/[0.05] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{task}</p>
                      <span className="rounded-full bg-sky-400/10 px-2 py-1 text-xs font-semibold text-sky-200">
                        {status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Badge variant="warning">Masalah yang sering muncul</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                Kerja kreatif kampus bergerak cepat. Dokumentasinya harus ikut
                rapi.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {problems.map((problem) => (
                <div
                  key={problem}
                  className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {problem}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-16 dark:bg-slate-950">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="info">Fitur utama</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Semua alur koordinasi kreatif di satu tempat.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Dari pembagian PIC sampai approval desain, JobDex.in menjaga
              pekerjaan tetap terlihat dan mudah ditindaklanjuti.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex size-11 items-center justify-center rounded-[8px] bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <Badge variant="success">Workflow</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                Dari brief sampai approved, statusnya jelas.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Koordinator bisa melihat siapa yang memegang task, kapan
                deadline, apa kendalanya, dan kapan desain siap disetujui.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflowSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="dark jd-hero py-16 text-white">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[8px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <Bot className="size-10 text-sky-300" />
              <h2 className="mt-5 text-3xl font-bold">
                AI Assistant untuk ringkasan progress.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Tanyakan siapa yang stuck, task mana yang menunggu approval,
                deadline terdekat, atau minta dibuatkan update singkat untuk
                grup.
              </p>
              <div className="mt-5 rounded-[8px] border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">
                  !jobdex siapa yang stuck?
                </p>
                <p className="mt-2">
                  Bot WhatsApp membaca data JobDex.in dan membalas ringkas ke
                  grup.
                </p>
              </div>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <MessageCircle className="size-10 text-emerald-300" />
              <h2 className="mt-5 text-3xl font-bold">
                WhatsApp tetap dipakai, tapi lebih terarah.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Update status, upload hasil desain, revisi, approve, dan
                ringkasan AI bisa dikirim otomatis ke grup koordinasi.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Status otomatis",
                  "Upload notification",
                  "Ringkasan AI",
                  "Webhook bot",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[8px] border border-white/10 bg-white/[0.06] p-3 text-sm font-semibold text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="info">Arsip referensi desain</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                Referensi tahun lalu tidak lagi tercecer.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Simpan link Drive, thumbnail, style notes, supergrafis, color
                palette, dan catatan tambahan agar anggota baru cepat memahami
                gaya visual organisasi.
              </p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Palette className="size-9 text-sky-600 dark:text-sky-300" />
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    PKKMB 2025 - Poster
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Style notes, Drive, dan palette.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                {["#0F172A", "#185FA5", "#22C55E", "#E6F1FB"].map((color) => (
                  <span
                    key={color}
                    className="size-10 rounded-[8px] border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-16 dark:bg-slate-950">
        <Container>
          <div className="rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <Sparkles className="size-9 text-emerald-600 dark:text-emerald-300" />
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Mulai rapikan koordinasi tim kreatifmu.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  JobDex.in membantu organisasi bergerak lebih tenang: pekerjaan
                  jelas, progress terbaca, dan update grup tidak lagi manual
                  semuanya.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/dashboard">Masuk Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <Container className="flex flex-col gap-2 py-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>JobDex.in MVP</p>
          <p>
            Untuk Humas dan Media Kreatif organisasi mahasiswa -{" "}
            {new Date().getFullYear()}
          </p>
        </Container>
      </footer>
    </main>
  );
}
