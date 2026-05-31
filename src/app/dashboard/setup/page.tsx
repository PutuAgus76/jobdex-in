"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { InitialDataSetup } from "@/components/setup/initial-data-setup";
import { Badge } from "@/components/ui/badge";
import { isSuperAdmin } from "@/lib/permissions";

export default function SetupPage() {
  return (
    <PermissionGuard canAccess={isSuperAdmin}>
      <div className="space-y-6">
        <section>
          <Badge variant="success">Super Admin</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
            Initial Data Bootstrap
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Buat data awal organization dan division default dengan aksi manual
            yang aman dan idempotent.
          </p>
        </section>
        <InitialDataSetup />
      </div>
    </PermissionGuard>
  );
}
