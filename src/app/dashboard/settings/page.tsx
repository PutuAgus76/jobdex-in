"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Layout, Columns } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jobdex-sidebar-collapsed");

    const handleToggleEvent = () => {
      const currentSaved = localStorage.getItem("jobdex-sidebar-collapsed");
      setIsCollapsed(currentSaved === "true");
    };

    window.addEventListener("jobdex-sidebar-toggle", handleToggleEvent);

    const timer = setTimeout(() => {
      setIsCollapsed(saved === "true");
      setMounted(true);
    }, 0);

    return () => {
      window.removeEventListener("jobdex-sidebar-toggle", handleToggleEvent);
      clearTimeout(timer);
    };
  }, []);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("jobdex-sidebar-collapsed", String(collapsed));
    window.dispatchEvent(new Event("jobdex-sidebar-toggle"));
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">Pengaturan</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Memuat preferensi Anda...
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <section>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="border-neutral-950 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold px-2.5 py-0.5 text-neutral-900 dark:text-white">
            Preferensi UX
          </Badge>
        </div>
        <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-slate-50">Pengaturan</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Atur tampilan workspace personal Anda di JobDex.in agar lebih nyaman digunakan.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tampilan Tema */}
        <Card className="jd-neo-card bg-[var(--jd-neo-surface)] border-2 border-neutral-950 dark:border-neutral-700 shadow-[4px_4px_0px_var(--jd-neo-shadow)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white animate-fade-in">
              {theme === "dark" ? <Moon className="size-5 text-yellow-400" /> : <Sun className="size-5 text-amber-500" />}
              Tampilan Tema
            </CardTitle>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Pilih mode tampilan gelap atau terang untuk antarmuka dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-[var(--jd-neo-yellow)] text-neutral-950 border-neutral-950 shadow-[3px_3px_0px_var(--jd-neo-shadow)] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-white text-neutral-600 border-neutral-200 dark:bg-neutral-850 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                <Sun className="size-4" />
                Mode Terang
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-[var(--jd-neo-yellow)] text-neutral-950 border-neutral-950 dark:border-neutral-50 shadow-[3px_3px_0px_var(--jd-neo-shadow)] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-white text-neutral-600 border-neutral-200 dark:bg-neutral-850 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                <Moon className="size-4" />
                Mode Gelap
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tampilan Sidebar */}
        <Card className="jd-neo-card bg-[var(--jd-neo-surface)] border-2 border-neutral-950 dark:border-neutral-700 shadow-[4px_4px_0px_var(--jd-neo-shadow)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              {isCollapsed ? <Columns className="size-5 text-[#8fa882]" /> : <Layout className="size-5 text-[#8fa882]" />}
              Menu Sidebar
            </CardTitle>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Pilih gaya menu sidebar: lebar penuh (full) atau ikon saja (compact).
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleSidebarToggle(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  !isCollapsed
                    ? "bg-[var(--jd-neo-yellow)] text-neutral-950 border-neutral-950 shadow-[3px_3px_0px_var(--jd-neo-shadow)] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-white text-neutral-600 border-neutral-200 dark:bg-neutral-850 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                <Layout className="size-4" />
                Lebar Penuh
              </button>
              <button
                type="button"
                onClick={() => handleSidebarToggle(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  isCollapsed
                    ? "bg-[var(--jd-neo-yellow)] text-neutral-950 border-neutral-950 dark:border-neutral-50 shadow-[3px_3px_0px_var(--jd-neo-shadow)] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-white text-neutral-600 border-neutral-200 dark:bg-neutral-850 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                <Columns className="size-4" />
                Ikon Saja
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Lanjutan */}
      <Card className="jd-neo-card-soft border-2 border-dashed border-neutral-950 dark:border-neutral-700 bg-[var(--jd-neo-surface)] p-6 shadow-[3px_3px_0px_var(--jd-neo-shadow)]">
        <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">ℹ️ Pengaturan Lanjutan</h3>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Konfigurasi organisasi workspace, webhook WhatsApp, integrasi Google Calendar, dan detail hak akses tim akan hadir pada fase rilis berikutnya. Saat ini preferensi Anda disimpan secara lokal pada perangkat Anda.
        </p>
      </Card>
    </div>
  );
}
