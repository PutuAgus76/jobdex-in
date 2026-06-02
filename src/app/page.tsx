import {
  ClipboardList,
  Bot,
  CalendarDays,
  Send,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Lock,
  Sparkle,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

const problems = [
  {
    title: "Tenggelam di Chat",
    desc: "Job desk penting tertimbun obrolan harian grup dan sulit dicari kembali saat dibutuhkan.",
    color: "jd-neo-badge-red",
  },
  {
    title: "Stuck Tanpa Solusi",
    desc: "Spreadsheet statis jarang diupdate dan tidak menunjukkan siapa anggota yang butuh bantuan segera.",
    color: "jd-neo-badge-yellow",
  },
  {
    title: "Aset Desain Tersebar",
    desc: "Tautan folder Drive pengerjaan, hasil desain, dan feedback revisi berceceran di berbagai platform chat.",
    color: "jd-neo-badge-orange",
  },
  {
    title: "Amnesia Organisasi",
    desc: "Referensi visual, palette, dan aset tahun sebelumnya hilang, memaksa anggota baru mulai dari nol.",
    color: "jd-neo-badge-purple",
  },
];

const features = [
  {
    icon: ClipboardList,
    title: "Job Desk & Status Workflow",
    desc: "Mulai dari belum dikerjakan, stuck, perlu revisi, hingga disetujui. Semua alur terdokumentasi rapi dengan PIC dan tenggat waktu yang jelas.",
    badge: "100% Transparan",
    badgeColor: "jd-neo-badge-blue",
    iconBg: "bg-[var(--jd-neo-blue)]",
  },
  {
    icon: Bot,
    title: "WhatsApp AI Bot Command",
    desc: "Kelola checklist, setujui tugas, dan cek deadline via WhatsApp chat dengan trigger !jobdex. Aman terenkripsi menggunakan otentikasi PIN.",
    badge: "Otomatis & Aman",
    badgeColor: "jd-neo-badge-green",
    iconBg: "bg-[var(--jd-neo-green)]",
  },
  {
    icon: FolderOpen,
    title: "Arsip Referensi Desain",
    desc: "Simpan tautan Drive utama, link Canva, color palette, style notes, dan supergrafis agar gaya visual organisasi tetap konsisten dari tahun ke tahun.",
    badge: "File Inventory",
    badgeColor: "jd-neo-badge-purple",
    iconBg: "bg-[var(--jd-neo-purple)]",
  },
  {
    icon: CalendarDays,
    title: "Analisis Risiko & Kalender",
    desc: "Lacak tugas-tugas kritis yang mendekati deadline secara visual dengan sistem highlight risiko (Aman, Peringatan, Overdue) pada kalender interaktif.",
    badge: "Smart Tracking",
    badgeColor: "jd-neo-badge-orange",
    iconBg: "bg-[var(--jd-neo-orange)]",
  },
];

const workflowSteps = [
  "Buat Event atau Job Desk Divisi",
  "Tugaskan PIC & Koordinator",
  "Anggota Update Progres & Checklist",
  "Unggah Hasil Desain (Cloudinary)",
  "Persetujuan (Approval) / Catatan Revisi",
  "Notifikasi Otomatis WhatsApp Bot & AI",
];

const stats = [
  { value: "24+", label: "Job Desk Aktif" },
  { value: "7", label: "Menunggu Approval" },
  { value: "3", label: "PIC Butuh Bantuan" },
  { value: "40+", label: "Arsip Referensi" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--jd-neo-bg)] text-[var(--jd-neo-text)] transition-colors duration-200">
      {/* 1. Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-surface)]/90 backdrop-blur-md">
        <Container className="py-4">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex size-10 items-center justify-center rounded-lg border-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-yellow)] text-sm font-black text-neutral-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-105">
                JD
              </span>
              <div>
                <p className="text-lg font-black tracking-wider text-[var(--jd-neo-text)]">
                  JobDex<span className="text-[#8fa882]">.in</span>
                </p>
                <p className="hidden text-[10px] uppercase tracking-wider font-bold text-[var(--jd-neo-muted)] sm:block">
                  Humas & Media Kreatif
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center font-bold text-sm text-[var(--jd-neo-text)] hover:underline px-3 py-2"
              >
                Login
              </Link>
              <Button asChild variant="primary" size="sm">
                <Link href="/dashboard" className="flex items-center gap-1">
                  <span>Dashboard</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              </Button>
            </div>
          </nav>
        </Container>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

        <Container className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="flex flex-col items-start text-left">
            <div className="jd-neo-badge jd-neo-badge-yellow mb-5 flex items-center gap-1.5 animate-pulse">
              <Sparkle className="size-3.5 fill-current" />
              <span>Koordinasi Kreatif Bebas Ruwet</span>
            </div>

            <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-6xl text-[var(--jd-neo-text)]">
              Koordinasi job desk organisasi{" "}
              <span className="underline decoration-[var(--jd-neo-yellow)] decoration-wavy decoration-2">
                tanpa tenggelam
              </span>{" "}
              di chat.
            </h1>

            <p className="mt-6 text-sm sm:text-base leading-relaxed text-[var(--jd-neo-muted)] font-normal max-w-xl">
              Kelola daftar tugas humas & publikasi, pantau deadline kritis,
              bagikan referensi desain visual tahun lalu, serta perbarui progres
              koordinasi secara instan melalui integrasi{" "}
              <b>WhatsApp Bot & AI Assistant</b>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="w-full sm:w-auto justify-center font-black"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <span>Masuk Dashboard</span>
                  <Send className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto justify-center font-black bg-[var(--jd-neo-surface)] hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <Link href="/login" className="flex items-center gap-2">
                  <span>Login Anggota</span>
                  <Lock className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Simulated 3D Neubrutalist Dashboard Card */}
          <div className="relative">
            {/* Background offset shape to emphasize 3D */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-[var(--jd-neo-border)] opacity-20 dark:opacity-40" />

            <div className="relative jd-neo-card p-6 bg-[var(--jd-neo-surface)] border-2 border-[var(--jd-neo-border)] shadow-[6px_6px_0px_var(--jd-neo-shadow)]">
              {/* Fake Dashboard Header */}
              <div className="flex items-center justify-between border-b-2 border-[var(--jd-neo-border)] pb-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-extrabold text-[var(--jd-neo-muted)]">
                    Live Progress
                  </p>
                  <p className="text-base font-black text-[var(--jd-neo-text)]">
                    Publikasi Acara Humas
                  </p>
                </div>
                <span className="jd-neo-badge jd-neo-badge-green font-extrabold">
                  Active MVP
                </span>
              </div>

              {/* Stats Row inside card */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {stats.slice(0, 2).map((stat) => (
                  <div
                    key={stat.label}
                    className="jd-neo-card-soft p-3 bg-[var(--jd-neo-bg)]"
                  >
                    <p className="text-2xl font-black text-[var(--jd-neo-text)]">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold text-[var(--jd-neo-muted)] uppercase tracking-wider mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Fake Task Card List */}
              <div className="space-y-3">
                {/* Task 1: Stuck */}
                <div className="jd-neo-card-soft p-3.5 bg-[var(--jd-neo-surface)] border-2 border-[var(--jd-neo-border)] shadow-[3px_3px_0px_var(--jd-neo-shadow)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[var(--jd-neo-text)]">
                        Desain Poster Utama PKKMB
                      </p>
                      <p className="text-[10px] text-[var(--jd-neo-muted)] mt-0.5">
                        PIC: Sumesta C &bull; Humas & Media
                      </p>
                    </div>
                    <span className="jd-neo-badge jd-neo-badge-red text-[9px] shrink-0 font-extrabold">
                      STUCK
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">
                      ⚠️ Deadline Besok
                    </span>
                    <span className="text-[9px] font-semibold text-[var(--jd-neo-muted)] bg-[var(--jd-neo-bg)] px-1.5 py-0.5 rounded border border-[var(--jd-neo-border)]">
                      Butuh Copywriting
                    </span>
                  </div>
                </div>

                {/* Task 2: Dikerjakan */}
                <div className="jd-neo-card-soft p-3.5 bg-[var(--jd-neo-surface)] border-2 border-[var(--jd-neo-border)] shadow-[3px_3px_0px_var(--jd-neo-shadow)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[var(--jd-neo-text)]">
                        Feed Instagram Open Recruitment
                      </p>
                      <p className="text-[10px] text-[var(--jd-neo-muted)] mt-0.5">
                        PIC: Putu Agus &bull; Media Kreatif
                      </p>
                    </div>
                    <span className="jd-neo-badge jd-neo-badge-blue text-[9px] shrink-0 font-extrabold">
                      DIKERJAKAN
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">
                      ✅ Aman (H-5)
                    </span>
                    <span className="text-[9px] font-semibold text-[var(--jd-neo-muted)] bg-[var(--jd-neo-bg)] px-1.5 py-0.5 rounded border border-[var(--jd-neo-border)]">
                      Desain Draf
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Problems / Pain Points Section */}
      <section className="py-16 border-t-2 border-b-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-surface)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="flex flex-col items-start">
              <div className="jd-neo-badge jd-neo-badge-red mb-4">
                Pain Points
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[var(--jd-neo-text)]">
                Kerja kreatif kampus bergerak cepat. Tapi kordinasinya
                berantakan?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--jd-neo-muted)] font-normal">
                Di divisi Humas dan Media Kreatif, tumpukan file, brief lisan,
                dan instruksi WA sering menjadi bumerang yang menghambat rilis
                publikasi.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {problems.map((prob) => (
                <div
                  key={prob.title}
                  className="jd-neo-card-soft p-5 bg-[var(--jd-neo-bg)] border-2 border-[var(--jd-neo-border)] shadow-[3px_3px_0px_var(--jd-neo-shadow)]"
                >
                  <span
                    className={`jd-neo-badge ${prob.color} text-[10px] font-extrabold uppercase`}
                  >
                    {prob.title}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--jd-neo-text)] font-normal">
                    {prob.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Feature Grid Section */}
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
            <div className="jd-neo-badge jd-neo-badge-blue mb-4">
              Fitur Andalan
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--jd-neo-text)] sm:text-4xl">
              Alur kerja teratur, tim bergerak sinkron.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--jd-neo-muted)] max-w-xl font-normal">
              Dari pengajuan tugas pertama sampai persetujuan akhir koordinator,
              JobDex.in merangkum semua koordinasi visual Anda di satu tempat
              terpusat.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat) => {
              const Icon = feat.icon;

              return (
                <div
                  key={feat.title}
                  className="jd-neo-card p-6 bg-[var(--jd-neo-surface)] border-2 border-[var(--jd-neo-border)] shadow-[4px_4px_0px_var(--jd-neo-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--jd-neo-shadow)] duration-150 transition-all flex flex-col items-start justify-between"
                >
                  <div className="w-full">
                    <div
                      className={`flex size-11 items-center justify-center rounded-lg border-2 border-[var(--jd-neo-border)] ${feat.iconBg} text-neutral-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]`}
                    >
                      <Icon className="size-5 shrink-0" />
                    </div>

                    <h3 className="mt-4 font-black text-sm text-[var(--jd-neo-text)]">
                      {feat.title}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-[var(--jd-neo-muted)] font-normal">
                      {feat.desc}
                    </p>
                  </div>

                  <span
                    className={`jd-neo-badge ${feat.badgeColor} mt-4 text-[9px] font-extrabold shrink-0`}
                  >
                    {feat.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 5. Workflow Path Section */}
      <section className="py-16 border-t-2 border-b-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-surface)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="flex flex-col items-start">
              <div className="jd-neo-badge jd-neo-badge-green mb-4">
                Siklus Kerja
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[var(--jd-neo-text)]">
                Bagaimana Humas bekerja di JobDex.in?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--jd-neo-muted)] font-normal">
                Sistem kami dirancang mengikuti dinamika pengerjaan tim media
                kreatif di lingkungan kampus secara terstruktur.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {workflowSteps.map((step, index) => (
                <div
                  key={step}
                  className="jd-neo-card-soft p-4 bg-[var(--jd-neo-bg)] border-2 border-[var(--jd-neo-border)] shadow-[3px_3px_0px_var(--jd-neo-shadow)] flex gap-3.5 items-center"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-yellow)] text-xs font-black text-neutral-900 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    {index + 1}
                  </span>
                  <p className="text-xs font-bold text-[var(--jd-neo-text)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 6. CTA / Final Action Card */}
      <section className="py-16 bg-[var(--jd-neo-bg)]">
        <Container>
          <div className="jd-neo-card max-w-4xl mx-auto p-8 sm:p-12 bg-[var(--jd-neo-surface)] border-2 border-[var(--jd-neo-border)] shadow-[8px_8px_0px_var(--jd-neo-shadow)] text-center flex flex-col items-center relative overflow-hidden">
            {/* Doodle background accent circles */}
            <div className="absolute -top-12 -left-12 size-36 rounded-full border-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-purple)] opacity-10 dark:opacity-20" />
            <div className="absolute -bottom-12 -right-12 size-36 rounded-full border-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-cyan)] opacity-10 dark:opacity-20" />

            <div className="relative z-10 flex flex-col items-center">
              <Sparkles className="size-10 text-[var(--jd-neo-yellow)] fill-current shrink-0 animate-bounce" />

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--jd-neo-text)] sm:text-4xl">
                Mulai Rapikan Koordinasi Tim Kreatifmu
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--jd-neo-muted)] font-normal">
                Bawa tim Anda keluar dari tumpukan chat koordinasi harian yang
                melelahkan. Masuk ke dashboard yang teratur, terpantau, dan
                dibantu asisten AI responsif.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Button
                  asChild
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto font-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 justify-center"
                  >
                    <span>Masuk Dashboard</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-black bg-[var(--jd-neo-surface)] hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <Link href="/login" className="justify-center">
                    Login Anggota
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. Footer */}
      <footer className="border-t-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-surface)] transition-colors">
        <Container className="flex flex-col gap-4 py-8 text-xs font-bold text-[var(--jd-neo-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p className="uppercase tracking-wider">
            JobDex<span className="text-[#8fa882]">.in</span> MVP &bull; Humas &
            Media
          </p>
          <p className="font-normal text-[var(--jd-neo-muted)]">
            Dibuat untuk divisi Humas dan Media Kreatif organisasi mahasiswa
            &copy; {new Date().getFullYear()}
          </p>
        </Container>
      </footer>
    </main>
  );
}
