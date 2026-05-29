import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="space-y-6">
      <section>
        <Badge variant="warning">Akses dibatasi</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Unauthorized
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Akunmu belum memiliki izin untuk membuka halaman atau aksi tersebut,
          atau status akunmu sedang nonaktif.
        </p>
      </section>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Akses tidak tersedia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-500">
            Role dan permission dasar sudah tersedia. Pembatasan fitur yang
            lebih spesifik akan diterapkan saat modul anggota, acara, dan tugas
            dibangun.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link href="/dashboard">Kembali ke dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
