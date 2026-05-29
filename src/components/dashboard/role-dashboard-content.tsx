"use client";

import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { useAuth } from "@/hooks/use-auth";

export function RoleDashboardContent() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Dashboard</Badge>
          <RoleBadge role={userProfile.role} />
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Ringkasan koordinasi
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Konten dashboard disesuaikan dengan role akun yang sedang login.
        </p>
      </section>

      <DashboardSummary profile={userProfile} />
    </div>
  );
}
