"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sun, Moon, Layout, Columns, Info } from "lucide-react";

const colorThemes = [
  { id: "default", name: "Default", color: "#5294FF" },
  { id: "red", name: "Red", color: "#FF4D50" },
  { id: "orange", name: "Orange", color: "#FF7A05" },
  { id: "amber", name: "Amber", color: "#FFBF00" },
  { id: "yellow", name: "Yellow", color: "#FACC00" },
  { id: "lime", name: "Lime", color: "#8AE500" },
  { id: "green", name: "Green", color: "#05E17A" },
  { id: "emerald", name: "Emerald", color: "#00D696" },
  { id: "teal", name: "Teal", color: "#00D6BD" },
  { id: "cyan", name: "Cyan", color: "#00C8F0" },
  { id: "sky", name: "Sky", color: "#0099FF" },
  { id: "blue", name: "Blue", color: "#5294FF" },
  { id: "indigo", name: "Indigo", color: "#7A83FF" },
  { id: "violet", name: "Violet", color: "#A985FF" },
  { id: "purple", name: "Purple", color: "#CA7AFF" },
  { id: "fuchsia", name: "Fuchsia", color: "#E96BFF" },
  { id: "pink", name: "Pink", color: "#FC64AB" },
  { id: "rose", name: "Rose", color: "#FF6678" },
];

export default function SettingsPage() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--border-radius)] border-2 border-[var(--border)] font-bold text-sm transition-all duration-100 cursor-pointer ${
                  theme === "light"
                    ? "bg-[var(--main)] text-neutral-950 translate-x-[3px] translate-y-[3px] shadow-none"
                    : "bg-[var(--secondary-background)] text-[var(--foreground)] shadow-[3px_3px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--border)]"
                }`}
              >
                <Sun className="size-4" />
                Mode Terang
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--border-radius)] border-2 border-[var(--border)] font-bold text-sm transition-all duration-100 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[var(--main)] text-neutral-950 translate-x-[3px] translate-y-[3px] shadow-none"
                    : "bg-[var(--secondary-background)] text-[var(--foreground)] shadow-[3px_3px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--border)]"
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
              {isCollapsed ? <Columns className="size-5 text-[var(--main)]" /> : <Layout className="size-5 text-[var(--main)]" />}
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--border-radius)] border-2 border-[var(--border)] font-bold text-sm transition-all duration-100 cursor-pointer ${
                  !isCollapsed
                    ? "bg-[var(--main)] text-neutral-950 translate-x-[3px] translate-y-[3px] shadow-none"
                    : "bg-[var(--secondary-background)] text-[var(--foreground)] shadow-[3px_3px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--border)]"
                }`}
              >
                <Layout className="size-4" />
                Lebar Penuh
              </button>
              <button
                type="button"
                onClick={() => handleSidebarToggle(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--border-radius)] border-2 border-[var(--border)] font-bold text-sm transition-all duration-100 cursor-pointer ${
                  isCollapsed
                    ? "bg-[var(--main)] text-neutral-950 translate-x-[3px] translate-y-[3px] shadow-none"
                    : "bg-[var(--secondary-background)] text-[var(--foreground)] shadow-[3px_3px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--border)]"
                }`}
              >
                <Columns className="size-4" />
                Ikon Saja
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tema Warna NeoBrutalism */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <div className="size-5 rounded-full border-2 border-black bg-[var(--main)] shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0" />
            Tema Warna NeoBrutalism
          </CardTitle>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Pilih warna utama workspace Anda. Warna latar belakang (surface) akan menyesuaikan versi soft/pucat secara otomatis.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {colorThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setColorTheme(t.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-[var(--border-radius)] border-2 border-[var(--border)] font-bold text-xs transition-all duration-100 cursor-pointer ${
                  colorTheme === t.id
                    ? "bg-[var(--main)] text-neutral-955 translate-x-[2px] translate-y-[2px] shadow-none"
                    : "bg-[var(--secondary-background)] text-[var(--foreground)] shadow-[2px_2px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_var(--border)]"
                }`}
              >
                <span
                  className="size-4 rounded-full border border-black shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
