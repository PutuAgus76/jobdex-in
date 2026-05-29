import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReferencesPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="warning">Placeholder</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Referensi</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Arsip referensi desain, link Drive, style, dan color palette akan
          ditata di halaman ini.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Arsip desain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Upload dan arsip Cloudinary belum diintegrasikan pada Fase 1.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
