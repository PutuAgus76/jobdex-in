import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="warning">Placeholder</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Anggota</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Halaman ini disiapkan untuk manajemen anggota, role, dan status akun.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen anggota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Fitur tambah, edit, dan nonaktifkan anggota belum dibuat pada fase
            ini.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
