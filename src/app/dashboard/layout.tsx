import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NeoDashboardShell } from "@/components/layout/neo-dashboard-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <NeoDashboardShell>{children}</NeoDashboardShell>
    </ProtectedRoute>
  );
}
