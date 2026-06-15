"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sun, Moon, Layout, Columns, Info } from "lucide-react";

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
          <Badge variant="default">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              {theme === "dark" ? <Moon className="size-5 text-[var(--main)]" /> : <Sun className="size-5 text-[var(--main)]" />}
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  theme === "light"
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Sun className="size-4" />
                Mode Terang
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  theme === "dark"
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Moon className="size-4" />
                Mode Gelap
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tampilan Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              {isCollapsed ? <Columns className="size-5 text-sky-600 dark:text-sky-400" /> : <Layout className="size-5 text-sky-600 dark:text-sky-400" />}
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  !isCollapsed
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Layout className="size-4" />
                Lebar Penuh
              </button>
              <button
                type="button"
                onClick={() => handleSidebarToggle(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  isCollapsed
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
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
      <Alert variant="default">
        <div className="flex flex-col gap-1.5">
          <AlertTitle className="flex items-center gap-2">
            <Info className="size-4 text-[var(--main)]" />
            Pengaturan Lanjutan
          </AlertTitle>
          <AlertDescription>
            Konfigurasi organisasi workspace, webhook WhatsApp, integrasi Google Calendar, dan detail hak akses tim akan hadir pada fase rilis berikutnya. Saat ini preferensi Anda disimpan secara lokal pada perangkat Anda.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
