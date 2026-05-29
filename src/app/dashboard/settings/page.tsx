import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="warning">Placeholder</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Pengaturan</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Pengaturan organisasi, profil, dan konfigurasi integrasi akan masuk
          fase berikutnya.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Belum ada pengaturan aktif pada Fase 1.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
