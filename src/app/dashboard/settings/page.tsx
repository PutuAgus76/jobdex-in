"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Layout,
  Columns,
  Info,
  Save,
  Loader2,
  Plus,
  X,
  Pencil,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMembers } from "@/lib/firebase/members";
import {
  getDivisions,
  updateDivisionDesignKit,
  canEditDivisionDesignKit,
  createDivision,
  updateDivision,
} from "@/lib/firebase/divisions";
import {
  parseLinksFromTextarea,
  formatLinksToTextarea,
} from "@/lib/link-utils";
import { showSuccess, showError } from "@/lib/swal";
import type { Division, UserProfile } from "@/types";

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400";

const textareaClassName =
  "min-h-20 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { userProfile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<"preferences" | "design-kit" | "divisions">("preferences");

  // Division Design Kit & CRUD states
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
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

  // Division CRUD Form Modal state
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudEditingDiv, setCrudEditingDiv] = useState<Division | null>(null);
  const [crudName, setCrudName] = useState("");
  const [crudSlug, setCrudSlug] = useState("");
  const [crudDescription, setCrudDescription] = useState("");
  const [crudCoordinatorId, setCrudCoordinatorId] = useState("");
  const [crudIsActive, setCrudIsActive] = useState(true);
  const [crudError, setCrudError] = useState("");
  const [crudSubmitting, setCrudSubmitting] = useState(false);

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

  const canManageDivisionKit = useMemo(() => {
    return userProfile?.role === "super_admin" || userProfile?.role === "koordinator_divisi";
  }, [userProfile]);

  const isSuperAdmin = useMemo(() => {
    return userProfile?.role === "super_admin";
  }, [userProfile]);

  // Load divisi dan anggota
  const loadData = useCallback(async () => {
    setDkLoading(true);
    try {
      const [divs, allMembers] = await Promise.all([
        getDivisions(),
        getMembers().catch(() => []),
      ]);
      setDivisions(divs);
      setMembers(allMembers);

      // Default selection for Design Kit edit
      if (userProfile?.role === "koordinator_divisi" && userProfile.division_id) {
        const myDiv = divs.find((d) => d.id === userProfile.division_id) || divs[0] || null;
        if (myDiv) selectDivisionForEdit(myDiv);
      } else if (divs.length > 0) {
        selectDivisionForEdit(divs[0]);
      }
    } catch (err) {
      console.error("Gagal memuat data pengaturan:", err);
    } finally {
      setDkLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        void loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mounted, loadData]);

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

  // Simpan Design Kit
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
      void loadData();
    } catch (err) {
      console.error("Gagal menyimpan Design Kit divisi:", err);
      await showError("Gagal menyimpan Design Kit divisi. Periksa koneksi dan Firestore Rules.", "Error");
    } finally {
      setDkSaving(false);
    }
  }

  // CRUD Divisi Functions
  function openAddDivisionModal() {
    setCrudEditingDiv(null);
    setCrudName("");
    setCrudSlug("");
    setCrudDescription("");
    setCrudCoordinatorId("");
    setCrudIsActive(true);
    setCrudError("");
    setCrudModalOpen(true);
  }

  function openEditDivisionModal(div: Division) {
    setCrudEditingDiv(div);
    setCrudName(div.name);
    setCrudSlug(div.slug || div.id);
    setCrudDescription(div.description || "");
    setCrudCoordinatorId(div.coordinator_id || "");
    setCrudIsActive(div.is_active !== false);
    setCrudError("");
    setCrudModalOpen(true);
  }

  async function handleSaveDivision(e: React.FormEvent) {
    e.preventDefault();
    setCrudError("");

    const nameTrimmed = crudName.trim();
    const slugTrimmed = crudSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const descriptionTrimmed = crudDescription.trim();

    if (!nameTrimmed) {
      setCrudError("Nama divisi wajib diisi.");
      return;
    }

    if (!slugTrimmed) {
      setCrudError("ID / Slug divisi wajib diisi dan hanya boleh huruf, angka, strip, atau underscore.");
      return;
    }

    setCrudSubmitting(true);

    try {
      const payload = {
        name: nameTrimmed,
        slug: slugTrimmed,
        description: descriptionTrimmed,
        coordinator_id: crudCoordinatorId,
        is_active: crudIsActive,
      };

      if (crudEditingDiv) {
        // Edit mode
        await updateDivision(crudEditingDiv.id, payload);
        await showSuccess("Divisi berhasil diperbarui!");
      } else {
        // Add mode
        // Check if division ID already exists
        const exists = divisions.some((d) => d.id === slugTrimmed);
        if (exists) {
          setCrudError(`Divisi dengan ID "${slugTrimmed}" sudah terdaftar.`);
          setCrudSubmitting(false);
          return;
        }

        await createDivision(slugTrimmed, payload);
        await showSuccess("Divisi baru berhasil ditambahkan!");
      }

      setCrudModalOpen(false);
      void loadData();
    } catch (err) {
      console.error("Gagal menyimpan divisi:", err);
      setCrudError("Gagal menyimpan divisi. Periksa koneksi dan rules.");
    } finally {
      setCrudSubmitting(false);
    }
  }

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("jobdex-sidebar-collapsed", String(collapsed));
    window.dispatchEvent(new Event("jobdex-sidebar-toggle"));
  };

  const membersMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

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
          <Badge variant="default">Konfigurasi Workspace</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-slate-50">Pengaturan</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Atur tampilan UX, Design Kit, dan manajemen divisi JobDex.in dalam satu tempat.
        </p>
      </section>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "preferences"
              ? "border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
          }`}
        >
          Preferensi UX
        </button>

        {canManageDivisionKit && (
          <button
            onClick={() => setActiveTab("design-kit")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "design-kit"
                ? "border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
            }`}
          >
            Design Kit Divisi
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("divisions")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "divisions"
                ? "border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
            }`}
          >
            Manajemen Divisi
          </button>
        )}
      </div>

      {/* Tab 1: Preferensi UX */}
      {activeTab === "preferences" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tampilan Tema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                {theme === "dark" ? (
                  <Moon className="size-5 text-sky-600 dark:text-sky-400" />
                ) : (
                  <Sun className="size-5 text-sky-600 dark:text-sky-400" />
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
      )}

      {/* Tab 2: Design Kit Divisi */}
      {activeTab === "design-kit" && canManageDivisionKit && (
        <section className="space-y-4">
          <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            {dkLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-6 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                Memuat data divisi...
              </div>
            ) : divisions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
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
                      className={selectClassName}
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
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg px-3 py-2">
                      <Info className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      Mengedit Design Kit untuk:{" "}
                      <strong className="text-slate-700 dark:text-slate-350">
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

                    <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveDivisionKit}
                        disabled={dkSaving}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
                      >
                        {dkSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        ) : (
                          <Save className="h-4 w-4 mr-1.5" />
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

      {/* Tab 3: Manajemen Divisi (Super Admin Only) */}
      {activeTab === "divisions" && isSuperAdmin && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Settings className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              Daftar Divisi Aktif
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={openAddDivisionModal}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Tambah Divisi
            </Button>
          </div>

          <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            {dkLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-10 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                Memuat data divisi...
              </div>
            ) : divisions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
                Belum ada divisi yang dibuat.
              </p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">ID/Slug</th>
                    <th className="p-4">Nama Divisi</th>
                    <th className="p-4">Koordinator</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250 dark:divide-slate-800/60 text-sm">
                  {divisions.map((div) => {
                    const coord = div.coordinator_id ? membersMap.get(div.coordinator_id) : null;
                    return (
                      <tr key={div.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-4 font-mono text-xs">{div.id}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-200">{div.name}</td>
                        <td className="p-4">
                          {coord ? (
                            <span className="font-medium text-slate-800 dark:text-slate-300">
                              {coord.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Belum ditentukan</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={div.is_active !== false ? "success" : "neutral"}>
                            {div.is_active !== false ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDivisionModal(div)}
                              className="text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/30 p-1"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* Crud Modal Form */}
      {crudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-[8px] bg-white dark:bg-slate-900 shadow-xl border border-slate-250 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">
                  {crudEditingDiv ? "Edit Divisi" : "Tambah Divisi"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur slug, nama, dan koordinator divisi pada form ini.
                </p>
              </div>
              <button
                onClick={() => setCrudModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDivision} className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                  Nama Divisi
                </label>
                <Input
                  value={crudName}
                  onChange={(e) => {
                    setCrudName(e.target.value);
                    if (!crudEditingDiv) {
                      // Auto slugify on write
                      const slugified = e.target.value
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_-]/g, "");
                      setCrudSlug(slugified);
                    }
                  }}
                  placeholder="Contoh: Media Kreatif & Desain"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                  ID / Slug Divisi
                </label>
                <Input
                  value={crudSlug}
                  onChange={(e) => setCrudSlug(e.target.value)}
                  placeholder="Contoh: media_kreatif"
                  disabled={!!crudEditingDiv}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan sebagai database key. Tidak dapat diubah setelah dibuat.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                  Deskripsi
                </label>
                <textarea
                  value={crudDescription}
                  onChange={(e) => setCrudDescription(e.target.value)}
                  placeholder="Penjelasan tugas/tanggung jawab divisi..."
                  className={textareaClassName}
                  style={{ minHeight: "70px" }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                  Koordinator Divisi
                </label>
                <select
                  className={selectClassName}
                  value={crudCoordinatorId}
                  onChange={(e) => setCrudCoordinatorId(e.target.value)}
                >
                  <option value="">-- Tanpa Koordinator --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Saat di-set, user terpilih akan otomatis memiliki role koordinator_divisi.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 dark:border-slate-800 p-3 text-sm font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                <input
                  type="checkbox"
                  checked={crudIsActive}
                  onChange={(e) => setCrudIsActive(e.target.checked)}
                />
                Divisi Aktif
              </label>

              {crudError && (
                <div className="bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-200 text-xs p-3 rounded-lg">
                  {crudError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCrudModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={crudSubmitting}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  {crudSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  {crudSubmitting ? "Menyimpan..." : "Simpan Divisi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Lanjutan */}
      <Alert variant="default">
        <div className="flex flex-col gap-1.5">
          <AlertTitle className="flex items-center gap-2">
            <Info className="size-4 text-sky-600 dark:text-sky-400" />
            Konfigurasi Workspace
          </AlertTitle>
          <AlertDescription>
            Pengaturan detail webhook WhatsApp, sinkronisasi Google Calendar, dan detail security rules lanjut akan hadir pada fase rilis berikutnya. Saat ini preferensi Anda disimpan di server Firestore secara real-time.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
