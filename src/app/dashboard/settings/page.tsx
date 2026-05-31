"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSuperAdmin } from "@/lib/permissions";

export default function SettingsPage() {
  return (
    <PermissionGuard canAccess={isSuperAdmin}>
      <div className="space-y-6">
        <section>
          <Badge variant="warning">Placeholder</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">Pengaturan</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Pengaturan organisasi, profil, dan konfigurasi integrasi akan masuk
            fase berikutnya.
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi aplikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-[8px] border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada pengaturan aktif pada Fase 4.
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
