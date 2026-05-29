import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="warning">Placeholder</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Acara</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Kelola daftar acara, status persiapan, dan progress job desk acara.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Daftar acara</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Data acara belum dihubungkan ke database pada Fase 1.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
