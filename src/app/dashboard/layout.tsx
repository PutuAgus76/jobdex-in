"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
