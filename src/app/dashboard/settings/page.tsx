"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Layout, Columns, Info, Palette, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getDivisions,
  updateDivisionDesignKit,
  canEditDivisionDesignKit,
} from "@/lib/firebase/divisions";
import {
  parseLinksFromTextarea,
  formatLinksToTextarea,
} from "@/lib/link-utils";
import { showSuccess, showError } from "@/lib/swal";
import type { Division } from "@/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { userProfile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Division Design Kit state
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [dkLoading, setDkLoading] = useState(false);
  const [dkSaving, setDkSaving] = useState(false);

  // Design Kit form fields
  const [dkColorPalette, setDkColorPalette] = useState("");
  const [dkVisualDirection, setDkVisualDirection] = useState("");
  const [dkSupergraphicNotes, setDkSupergraphicNotes] = useState("");
  const [dkDesignRefLinks, setDkDesignRefLinks] = useState("");
  const [dkDriveRefLinks, setDkDriveRefLinks] = useState("");
  const [dkArchiveDriveLinks, setDkArchiveDriveLinks] = useState("");
  const [dkNotesForMembers, setDkNotesForMembers] = useState("");

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

  const canManageDivisionKit =
    userProfile?.role === "super_admin" || userProfile?.role === "koordinator_divisi";

  // Load divisi jika user punya akses
  const loadDivisions = useCallback(async () => {
    if (!canManageDivisionKit) return;
    setDkLoading(true);
    try {
      const divs = await getDivisions();
      setDivisions(divs);

      // Jika koordinator_divisi, hanya tampilkan divisinya sendiri
      if (userProfile?.role === "koordinator_divisi" && userProfile.division_id) {
        const myDiv = divs.find((d) => d.id === userProfile.division_id) || divs[0] || null;
        if (myDiv) selectDivisionForEdit(myDiv);
      } else if (divs.length > 0) {
        selectDivisionForEdit(divs[0]);
      }
    } catch {
      // silent fail — halaman tetap bisa dibuka
    } finally {
      setDkLoading(false);
    }
  }, [canManageDivisionKit, userProfile?.division_id, userProfile?.role]);

  useEffect(() => {
    if (mounted && canManageDivisionKit) {
      const timer = setTimeout(() => {
        void loadDivisions();
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, canManageDivisionKit]);

  function selectDivisionForEdit(div: Division) {
    setEditingDivision(div);
    setDkColorPalette(div.design_kit_color_palette?.join(", ") ?? "");
    setDkVisualDirection(div.design_kit_visual_direction ?? "");
    setDkSupergraphicNotes(div.design_kit_supergraphic_notes ?? "");
    setDkDesignRefLinks(formatLinksToTextarea(div.design_kit_design_reference_links));
    setDkDriveRefLinks(formatLinksToTextarea(div.design_kit_drive_reference_links));
    setDkArchiveDriveLinks(formatLinksToTextarea(div.design_kit_archive_drive_links));
    setDkNotesForMembers(div.design_kit_notes_for_members ?? "");
  }

  async function handleSaveDivisionKit() {
    if (!editingDivision || !userProfile) return;

    if (!canEditDivisionDesignKit(userProfile, editingDivision.id)) {
      await showError("Anda tidak memiliki akses untuk mengubah Design Kit divisi ini.", "Akses ditolak");
      return;
    }

    setDkSaving(true);
    try {
      const colorPaletteArr = dkColorPalette
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      await updateDivisionDesignKit(editingDivision.id, {
        color_palette: colorPaletteArr,
        visual_direction: dkVisualDirection.trim(),
        supergraphic_notes: dkSupergraphicNotes.trim(),
        design_reference_links: parseLinksFromTextarea(dkDesignRefLinks),
        drive_reference_links: parseLinksFromTextarea(dkDriveRefLinks),
        archive_drive_links: parseLinksFromTextarea(dkArchiveDriveLinks),
        notes_for_members: dkNotesForMembers.trim(),
      });

      await showSuccess(`Design Kit untuk divisi "${editingDivision.name}" berhasil disimpan.`, "Sukses");
      void loadDivisions();
    } catch (err) {
      console.error("Gagal menyimpan Design Kit divisi:", err);
      await showError("Gagal menyimpan Design Kit divisi. Periksa koneksi dan Firestore Rules.", "Error");
    } finally {
      setDkSaving(false);
    }
  }

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("jobdex-sidebar-collapsed", String(collapsed));
    window.dispatchEvent(new Event("jobdex-sidebar-toggle"));
  };

  const textareaClassName =
    "min-h-20 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

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
          <Badge variant="default">Preferensi UX</Badge>
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
              {theme === "dark" ? (
                <Moon className="size-5 text-[var(--main)]" />
              ) : (
                <Sun className="size-5 text-[var(--main)]" />
              )}
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${theme === "light"
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${theme === "dark"
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
              {isCollapsed ? (
                <Columns className="size-5 text-sky-600 dark:text-sky-400" />
              ) : (
                <Layout className="size-5 text-sky-600 dark:text-sky-400" />
              )}
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${!isCollapsed
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border font-semibold text-sm transition-all duration-150 cursor-pointer ${isCollapsed
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

      {/* =====================================================
          Fase 26A: Design Kit Divisi
          ===================================================== */}
      {canManageDivisionKit && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default" className="bg-violet-600 hover:bg-violet-700">
              Design Kit
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50 flex items-center gap-2">
            <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            Design Kit Divisi
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atur default color palette, arahan visual, dan link referensi untuk divisi. Jobdesk tipe divisi akan otomatis mengambil default dari sini.
          </p>

          <div className="mt-4 rounded-[8px] border border-violet-200 dark:border-violet-800/50 bg-white dark:bg-slate-900 p-5">
            {dkLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat data divisi...
              </div>
            ) : divisions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada divisi yang terdaftar.
              </p>
            ) : (
              <div className="space-y-5">
                {/* Pilih divisi (hanya untuk super_admin) */}
                {userProfile?.role === "super_admin" && divisions.length > 1 && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Pilih Divisi
                    </label>
                    <select
                      className="h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
                      value={editingDivision?.id ?? ""}
                      onChange={(e) => {
                        const div = divisions.find((d) => d.id === e.target.value);
                        if (div) selectDivisionForEdit(div);
                      }}
                    >
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editingDivision && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                      <Info className="h-3.5 w-3.5" />
                      Mengedit Design Kit untuk:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {editingDivision.name}
                      </strong>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Color palette default
                      </label>
                      <Input
                        value={dkColorPalette}
                        onChange={(e) => setDkColorPalette(e.target.value)}
                        placeholder="#0f172a, #22c55e, #f59e0b"
                      />
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Pisahkan dengan koma. Hex atau nama warna biasa.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Arahan visual default
                      </label>
                      <textarea
                        value={dkVisualDirection}
                        onChange={(e) => setDkVisualDirection(e.target.value)}
                        placeholder="Contoh: Font Poppins, dominasi warna biru navy, gaya modern minimalis..."
                        className={textareaClassName}
                        style={{ minHeight: "80px" }}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Catatan supergrafis divisi
                      </label>
                      <textarea
                        value={dkSupergraphicNotes}
                        onChange={(e) => setDkSupergraphicNotes(e.target.value)}
                        placeholder="Catatan elemen visual atau supergrafis khas divisi..."
                        className={textareaClassName}
                        style={{ minHeight: "70px" }}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Link referensi desain divisi
                      </label>
                      <textarea
                        value={dkDesignRefLinks}
                        onChange={(e) => setDkDesignRefLinks(e.target.value)}
                        placeholder={"https://www.canva.com/design/...\nhttps://pinterest.com/..."}
                        className={textareaClassName}
                        style={{ minHeight: "70px" }}
                      />
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Satu link per baris. Canva, Pinterest, Figma, atau moodboard divisi.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Folder Drive referensi divisi
                      </label>
                      <textarea
                        value={dkDriveRefLinks}
                        onChange={(e) => setDkDriveRefLinks(e.target.value)}
                        placeholder={"https://drive.google.com/drive/folders/..."}
                        className={textareaClassName}
                        style={{ minHeight: "60px" }}
                      />
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Folder Drive berisi aset, logo, template, dan file desain divisi.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Folder arsip divisi
                      </label>
                      <textarea
                        value={dkArchiveDriveLinks}
                        onChange={(e) => setDkArchiveDriveLinks(e.target.value)}
                        placeholder={"https://drive.google.com/drive/folders/..."}
                        className={textareaClassName}
                        style={{ minHeight: "60px" }}
                      />
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Folder Drive untuk arsip desain yang sudah selesai.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Catatan untuk anggota divisi
                      </label>
                      <textarea
                        value={dkNotesForMembers}
                        onChange={(e) => setDkNotesForMembers(e.target.value)}
                        placeholder="Panduan atau catatan penting untuk anggota divisi yang baru bergabung..."
                        className={textareaClassName}
                        style={{ minHeight: "80px" }}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveDivisionKit}
                        disabled={dkSaving}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        {dkSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {dkSaving ? "Menyimpan..." : "Simpan Design Kit Divisi"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}

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
