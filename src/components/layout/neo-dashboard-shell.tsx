"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { NeoSidebar } from "./neo-sidebar";
import { NeoTopbar } from "./neo-topbar";
import { NeoMobileNav } from "./neo-mobile-nav";

export function NeoDashboardShell({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("jobdex-sidebar-collapsed");
      setIsCollapsed(saved === "true");
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("jobdex-sidebar-toggle", handleStorage);
    
    const timer = setTimeout(() => {
      handleStorage();
      setMounted(true);
    }, 0);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("jobdex-sidebar-toggle", handleStorage);
      clearTimeout(timer);
    };
  }, []);

  const handleToggle = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("jobdex-sidebar-collapsed", String(newValue));
    window.dispatchEvent(new Event("jobdex-sidebar-toggle"));
  };

  return (
    <div className="jd-neo-shell min-h-screen w-full flex">
      {/* Sidebar */}
      <NeoSidebar isCollapsed={mounted ? isCollapsed : false} onToggle={handleToggle} />

      {/* Content wrapper */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <NeoTopbar isCollapsed={mounted ? isCollapsed : false} onToggleSidebar={handleToggle} />

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
