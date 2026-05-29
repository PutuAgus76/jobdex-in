import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="warning">Placeholder</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Job Desk</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Daftar job desk divisi dan acara akan ditampilkan di sini.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Daftar job desk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Tabel dan card tugas akan dibuat pada fase fitur CRUD.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
