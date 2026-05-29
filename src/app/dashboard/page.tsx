import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  ["0", "Tugas aktif"],
  ["0", "Belum dimulai"],
  ["0", "Sedang dikerjakan"],
  ["0", "Butuh review"],
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="info">Dashboard placeholder</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Ringkasan koordinasi
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Area ini akan menampilkan total tugas aktif, deadline dekat, progres
          acara, dan ringkasan anggota setelah integrasi data dibuat.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([value, label]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-950">{value}</p>
              <p className="mt-2 text-sm text-slate-500">
                Data dummy untuk fondasi UI.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Belum ada aktivitas. Fitur data real-time akan masuk fase
            berikutnya.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
