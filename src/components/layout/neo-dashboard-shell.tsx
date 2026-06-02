"use client";

import type { ReactNode } from "react";
import { NeoSidebar } from "./neo-sidebar";
import { NeoTopbar } from "./neo-topbar";
import { NeoMobileNav } from "./neo-mobile-nav";

export function NeoDashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="jd-neo-shell min-h-screen w-full flex">
      {/* Sidebar */}
      <NeoSidebar />

      {/* Content wrapper */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <NeoTopbar />

        {/* Main page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 jd-mobile-bottom-safe">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <NeoMobileNav />
    </div>
  );
}
