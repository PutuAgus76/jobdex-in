import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const features = [
  {
    title: "Job desk divisi",
    description:
      "Susun tugas rutin Humas dan Media Kreatif dengan status yang mudah dipantau.",
  },
  {
    title: "Koordinasi acara",
    description:
      "Pisahkan kebutuhan publikasi, dokumentasi, dan desain untuk setiap acara.",
  },
  {
    title: "Pantau progres anggota",
    description:
      "Lihat tugas aktif, deadline dekat, kendala, dan pekerjaan yang butuh review.",
  },
  {
    title: "Arsip referensi desain",
    description:
      "Simpan inspirasi visual, link Drive, dan catatan style untuk generasi berikutnya.",
  },
];

const workflowItems = [
  "Job desk tertata",
  "Status tugas jelas",
  "Update WhatsApp siap dikirim",
  "Referensi desain mudah dicari",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <Container className="py-6">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold text-slate-950">
              JobDex.in
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </nav>
        </Container>
      </section>

      <section className="overflow-hidden bg-white">
        <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
          <div className="max-w-2xl">
            <Badge variant="info">Untuk organisasi mahasiswa</Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Satu ruang kerja untuk job desk Humas dan Media Kreatif.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              JobDex.in membantu koordinator mengelola job desk divisi,
              mengatur kebutuhan acara, memantau status tugas anggota,
              mengarsipkan referensi desain, dan menyiapkan update untuk grup
              WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Mulai daftar</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Masuk ke dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="rounded-[8px] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Ringkasan Minggu Ini
                  </p>
                  <p className="text-xs text-slate-500">
                    Divisi Humas dan Media Kreatif
                  </p>
                </div>
                <Badge>Fase awal</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["24", "Tugas aktif"],
                  ["8", "Deadline dekat"],
                  ["5", "Butuh review"],
                  ["31", "Referensi"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[8px] border border-slate-200 p-4"
                  >
                    <p className="text-2xl font-bold text-slate-950">
                      {value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {workflowItems.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[8px] border border-slate-200 px-3 py-3"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fafc]">
        <Container className="py-16">
          <div className="max-w-2xl">
            <Badge variant="success">Fondasi koordinasi</Badge>
            <h2 className="mt-4 text-3xl font-bold text-slate-950">
              Dibuat untuk ritme kerja organisasi kampus.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Dari konten rutin sampai publikasi acara besar, JobDex.in
              menaruh pekerjaan, PIC, status, dan referensi di tempat yang sama
              agar koordinasi tidak tenggelam di chat.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-12">
          <div className="flex flex-col justify-between gap-6 rounded-[8px] border border-slate-200 bg-slate-950 p-6 text-white md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Siapkan dashboard koordinasi timmu.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Fase pertama menyediakan landing page, autentikasi placeholder,
                dashboard layout, dan komponen dasar untuk pengembangan fitur
                berikutnya.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="secondary">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="light">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <Container className="flex flex-col gap-2 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>JobDex.in MVP Foundation</p>
          <p>Untuk Humas dan Media Kreatif organisasi mahasiswa.</p>
        </Container>
      </footer>
    </main>
  );
}
