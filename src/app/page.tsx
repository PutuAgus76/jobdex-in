/*
Recommended Image Dimensions for Photoshop production:
- hero-dashboard-preview.png          1200x900 atau 1400x1000
- feature-whatsapp-bot.png            800x600
- feature-dashboard-jobdesk.png        800x600
- feature-ai-assistant.png             800x600
- feature-reference-archive.png        800x600
- onboarding-workspace-preview.png     900x700
- admin-jobdesk-form-preview.png       1000x800
- member-task-preview.png              1000x800
- cta-reminder-preview.png             700x500
*/
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileArchive,
  LayoutDashboard,
  Link2,
  Lock,
  MessageCircle,
  PenLine,
  Rocket,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LandingImageSlot } from "@/components/landing/landing-image-slot";
import { HeroTypewriterText } from "@/components/landing/hero-typewriter-text";

const navigation = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-daftar" },
  { label: "Panduan", href: "#admin" },
  { label: "Command WA", href: "#command-wa" },
];

const valueItems = [
  {
    icon: SearchCheck,
    title: "100% Terpantau",
    description: "Transparansi penuh untuk seluruh anggota divisi.",
  },
  {
    icon: BellRing,
    title: "Real-Time Reminder",
    description: "Otomatisasi pengingat via WhatsApp grup.",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Bantuan pintar untuk rangkuman dan referensi.",
  },
];

const features = [
  {
    icon: MessageCircle,
    title: "WhatsApp Bot Reminder",
    description:
      "Pengingat deadline dan briefing tugas dapat dikirim langsung ke grup WhatsApp yang terhubung.",
    visual: "whatsapp",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Job Desk",
    description:
      "Pantau PIC, deadline, prioritas, dan status pekerjaan dalam tampilan dashboard yang mudah dipindai.",
    visual: "dashboard",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Minta rangkuman, cek hambatan, dan susun briefing koordinasi tanpa harus membaca semua detail satu per satu.",
    visual: "ai",
  },
  {
    icon: FileArchive,
    title: "Arsip Referensi & Aset",
    description:
      "Simpan tautan desain, file referensi, template, dan aset publikasi agar mudah ditemukan kembali.",
    visual: "references",
  },
];

const signupSteps = [
  {
    icon: UserCheck,
    title: "Daftar akun",
    description: "Admin atau koordinator membuat akun dan masuk ke dashboard.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Buat workspace/divisi",
    description: "Tentukan ruang kerja organisasi atau divisi.",
  },
  {
    icon: Users,
    title: "Tambahkan anggota",
    description: "Masukkan anggota yang terlibat dalam job desk.",
  },
  {
    icon: Workflow,
    title: "Mulai koordinasi",
    description: "Tambahkan tugas pertama dan pantau progresnya.",
  },
];

const adminSteps = [
  "Klik Tambah Job Desk",
  "Isi nama dan deskripsi tugas",
  "Pilih PIC",
  "Atur deadline, prioritas, dan status awal",
  "Simpan dan pantau progres",
];

const adminCapabilities = [
  "Edit job desk",
  "Archive job desk",
  "Approve atau minta revisi",
  "Lihat siapa yang stuck",
  "Lihat siapa yang belum update",
  "Kirim pengingat via WhatsApp",
];

const memberSteps = [
  "Login ke sistem",
  "Lihat tugas yang menjadi tanggung jawabnya",
  "Baca deadline, deskripsi, dan referensi",
  "Update progress atau status pekerjaan",
  "Terima reminder jika deadline semakin dekat",
];

const memberBenefits = [
  "Tidak perlu scroll chat panjang",
  "Tahu tugas mana yang prioritas",
  "Mudah menemukan referensi",
  "Progress lebih mudah dilaporkan",
  "Koordinasi lebih jelas dengan koordinator",
];

const commands = [
  {
    icon: ClipboardList,
    command: "!jobdex briefing",
    title: "Briefing harian",
    description: "Melihat ringkasan tugas penting hari ini.",
  },
  {
    icon: Clock3,
    command: "!jobdex siapa belum update",
    title: "Cek update PIC",
    description: "Mengecek PIC yang belum memperbarui progres.",
  },
  {
    icon: ShieldCheck,
    command: "!jobdex cek role saya",
    title: "Cek role akun",
    description: "Melihat role akun yang terdeteksi oleh sistem.",
  },
  {
    icon: PenLine,
    command: "!jobdex update status [nama task] menjadi [status]",
    title: "Update status",
    description: "Memperbarui status tugas melalui WhatsApp.",
  },
  {
    icon: BadgeCheck,
    command: "!jobdex approve task [nama task]",
    title: "Approve task",
    description: "Menyetujui tugas yang sudah selesai.",
  },
  {
    icon: Link2,
    command: "!jobdex hubungkan grup acara [nama acara]",
    title: "Hubungkan grup acara",
    description: "Menghubungkan grup WhatsApp dengan acara tertentu.",
  },
  {
    icon: MessageCircle,
    command: "!jobdex cek grup",
    title: "Cek koneksi grup",
    description: "Mengecek apakah grup sudah terhubung ke sistem.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <ScrollReveal
      className={`space-y-4 ${
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"
      }`}
    >
      {eyebrow ? (
        <span className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-slate-600">{description}</p>
    </ScrollReveal>
  );
}

function ProductMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
          Live dashboard
        </span>
      </div>

      <div className="overflow-hidden rounded-b-xl mt-2">
        <LandingImageSlot
          src="/landing/hero-dashboard-preview.png"
          alt="Hero Dashboard Preview"
          aspectRatio="aspect-[4/3]"
          className="w-full"
        />
      </div>
    </div>
  );
}

function FeatureVisual({ type }: { type: string }) {
  let src = "";
  let alt = "";

  if (type === "whatsapp") {
    src = "/landing/feature-whatsapp-bot.png";
    alt = "WhatsApp Bot Reminder";
  } else if (type === "dashboard") {
    src = "/landing/feature-dashboard-jobdesk.png";
    alt = "Dashboard Job Desk";
  } else if (type === "ai") {
    src = "/landing/feature-ai-assistant.png";
    alt = "AI Assistant";
  } else {
    src = "/landing/feature-reference-archive.png";
    alt = "Arsip Referensi & Aset";
  }

  return (
    <div className="mt-6 w-full rounded-xl overflow-hidden bg-slate-50/50 border border-slate-100">
      <LandingImageSlot
        src={src}
        alt={alt}
        aspectRatio="aspect-video"
        className="w-full"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <Container>
          <nav className="flex min-h-16 items-center justify-between gap-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-sm font-semibold text-[#ffffff]">
                JD
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-normal text-slate-950">
                  JobDex<span className="text-sky-600">.in</span>
                </span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
                  Humas & Media Kreatif
                </span>
              </span>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 transition hover:text-sky-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-sky-700 sm:inline-flex"
              >
                Login
              </Link>
              <Button asChild variant="primary" size="md">
                <Link href="/dashboard" className="!text-[#ffffff] [&_svg]:!text-[#ffffff]">
                  <LayoutDashboard size={16} />
                  <span>Masuk Dashboard</span>
                </Link>
              </Button>
            </div>
          </nav>
        </Container>
      </header>

      <section className="relative border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0f2fe_1px,transparent_1px),linear-gradient(to_bottom,#e0f2fe_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1fr)] lg:items-center lg:py-24">
          <ScrollReveal className="max-w-3xl space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
              <Sparkles size={14} />
              SaaS Koordinasi Job Desk Tim Humas & Publikasi
            </span>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                Semua job desk tim kreatifmu,{" "}
                <br className="sm:hidden" />
                <HeroTypewriterText />
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Sentralisasikan checklist tugas, bagikan referensi desain,
                pantau deadline, dan kirim reminder WhatsApp secara real-time
                dengan bantuan AI Assistant.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="primary" size="lg" className="h-12 px-6">
                <Link href="/dashboard" className="!text-[#ffffff] [&_svg]:!text-[#ffffff]">
                  <span>Mulai Sekarang</span>
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6">
                <Link href="/login">
                  <Lock size={18} />
                  <span>Login Anggota</span>
                </Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <ProductMockup />
          </ScrollReveal>
        </Container>
      </section>

      <section className="bg-[#f8fbff] py-8">
        <Container>
          <div className="grid gap-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 p-4 text-white shadow-[0_18px_40px_rgba(2,132,199,0.24)] md:grid-cols-3 md:p-5">
            {valueItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <ScrollReveal
                  key={item.title}
                  delay={index * 90}
                  className="flex items-start gap-4 rounded-xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm shadow-sm hover:bg-white/12 transition-all duration-300"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 border border-white/10 text-white">
                    <Icon size={21} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/90">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="fitur" className="bg-[#f8fbff] py-16 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="Fitur utama"
            title="Fitur utama untuk koordinasi tim yang lebih rapi"
            description="Dirancang khusus untuk alur kerja divisi Humas, Publikasi, dan Media Kreatif yang dinamis."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={feature.title} delay={index * 90} className="h-full">
                  <article
                  key={feature.title}
                  className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <Icon size={21} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                    <div className="mt-auto">
                      <FeatureVisual type={feature.visual} />
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="cara-daftar" className="border-y border-slate-200 bg-white py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_420px] lg:items-center">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Cara daftar"
                title="Cara daftar dan mulai menggunakan JobDex.in"
                description="Hanya beberapa langkah untuk mulai mengelola koordinasi divisi dengan lebih rapi."
              />

              <div className="mt-10 grid gap-4 md:grid-cols-4">
                {signupSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <ScrollReveal
                      key={step.title}
                      delay={index * 80}
                      className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      {index < signupSteps.length - 1 ? (
                        <div className="absolute left-[calc(100%-4px)] top-9 hidden h-px w-8 bg-sky-200 md:block" />
                      ) : null}
                      <div className="mb-4 flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-[#ffffff]">
                          {index + 1}
                        </span>
                        <Icon className="text-sky-600" size={20} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-950">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>

            <ScrollReveal
              delay={160}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <LandingImageSlot
                src="/landing/onboarding-workspace-preview.png"
                alt="Buat Workspace Baru Preview"
                aspectRatio="aspect-[4/3]"
                className="w-full"
              />
            </ScrollReveal>
          </div>
        </Container>
      </section>

      <section id="admin" className="bg-[#f8fbff] py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1fr)] lg:items-center">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Admin & koordinator"
                title="Untuk admin dan koordinator: tambah job desk tanpa ribet"
                description="Buat tugas, tentukan PIC, atur deadline, dan pantau status tanpa harus menulis ulang instruksi panjang di grup chat."
              />

              <div className="mt-8 space-y-3">
                {adminSteps.map((step, index) => (
                  <ScrollReveal
                    key={step}
                    delay={index * 70}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-700">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium leading-7 text-slate-700">{step}</p>
                  </ScrollReveal>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {adminCapabilities.map((capability, index) => (
                  <ScrollReveal
                    key={capability}
                    delay={index * 50}
                    distance={14}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <CheckCircle2 className="text-sky-600" size={17} />
                    {capability}
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <ScrollReveal
              delay={160}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <LandingImageSlot
                src="/landing/admin-jobdesk-form-preview.png"
                alt="Tambah Job Desk Form Preview"
                aspectRatio="aspect-[4/3]"
                className="w-full"
              />
            </ScrollReveal>
          </div>
        </Container>
      </section>

      <section id="anggota" className="border-y border-slate-200 bg-white py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(460px,1fr)_minmax(0,0.9fr)] lg:items-center">
            <ScrollReveal className="order-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:order-1">
              <LandingImageSlot
                src="/landing/member-task-preview.png"
                alt="Member Task Preview"
                aspectRatio="aspect-[4/3]"
                className="w-full"
              />
            </ScrollReveal>

            <div className="order-1 lg:order-2">
              <SectionHeading
                align="left"
                eyebrow="Anggota"
                title="Untuk anggota: cukup fokus pada tugas yang menjadi tanggung jawab Anda"
                description="Anggota bisa melihat instruksi, deadline, referensi, dan update status tanpa perlu mencari ulang di chat panjang."
              />

              <div className="mt-8 space-y-3">
                {memberSteps.map((step, index) => (
                  <ScrollReveal
                    key={step}
                    delay={index * 70}
                    distance={14}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium leading-7 text-slate-700">{step}</p>
                  </ScrollReveal>
                ))}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {memberBenefits.map((benefit, index) => (
                  <ScrollReveal
                    key={benefit}
                    delay={index * 60}
                    distance={14}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                  >
                    {benefit}
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="command-wa" className="bg-[#f8fbff] py-16 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="Command WhatsApp"
            title="Command WhatsApp yang tersedia"
            description="Gunakan command cepat untuk mengecek progres, meminta briefing, dan menghubungkan grup acara langsung dari WhatsApp."
          />

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {commands.map((item, index) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.command} delay={index * 70} className="h-full">
                  <article
                  key={item.command}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <Icon size={21} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex max-w-full rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-mono text-xs font-semibold text-sky-800">
                          <span className="truncate">{item.command}</span>
                        </span>
                        <h3 className="mt-3 text-base font-semibold text-slate-950">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <Container>
          <ScrollReveal className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-blue-800 px-6 py-12 text-[#ffffff] shadow-[0_24px_60px_rgba(2,132,199,0.28)] sm:px-10 lg:px-14">
            <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
              <div className="max-w-3xl">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-[#ffffff]">
                  <Rocket size={24} />
                </div>
                <h2 className="text-3xl font-semibold tracking-normal text-[#ffffff] sm:text-4xl">
                  Mulai kelola koordinasi tim kreatif Anda sekarang
                </h2>
                <p className="mt-4 text-base leading-8 text-sky-50">
                  Bebaskan panitia dari kebingungan instruksi di chat. Masuk ke
                  dashboard yang teratur, terpantau, dan diperkuat oleh WhatsApp
                  Bot & AI Assistant.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg bg-white px-6 text-sm font-medium text-sky-700 shadow-sm transition-colors hover:bg-sky-50 [&_svg]:text-sky-700 [&_svg]:shrink-0"
                  >
                    <LayoutDashboard size={18} />
                    <span>Masuk Dashboard</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg border border-white/70 bg-transparent px-6 text-sm font-medium text-[#ffffff] transition-colors hover:border-white hover:bg-white/10 [&_svg]:text-[#ffffff] [&_svg]:shrink-0"
                  >
                    <Lock size={18} />
                    <span>Login Anggota</span>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <LandingImageSlot
                    src="/landing/cta-reminder-preview.png"
                    alt="CTA Reminder Preview"
                    aspectRatio="aspect-[4/3]"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr_0.8fr]">
            <div>
              <p className="text-lg font-semibold text-slate-950">
                JobDex<span className="text-sky-600">.in</span>
              </p>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                Platform manajemen job desk khusus untuk divisi Humas,
                Publikasi, dan Media Kreatif organisasi mahasiswa.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Navigasi</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <Link href="/dashboard" className="block hover:text-sky-700">
                  Dashboard
                </Link>
                <Link href="/login" className="block hover:text-sky-700">
                  Login
                </Link>
                <Link href="#command-wa" className="block hover:text-sky-700">
                  Kontak
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Ikuti Kami</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <a
                  href="https://instagram.com/Agus_Sumesta"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-sky-700"
                >
                  Instagram Agus Semesta
                </a>
                <a href="mailto:hello@jobdex.in" className="block hover:text-sky-700">
                  hello@jobdex.in
                </a>
              </div>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
