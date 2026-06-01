"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ReferenceDetailDialog } from "@/components/references/reference-detail-dialog";
import { ReferenceFilters } from "@/components/references/reference-filters";
import { ReferenceFormDialog } from "@/components/references/reference-form-dialog";
import { ReferencesGrid } from "@/components/references/references-grid";
import { useAuth } from "@/hooks/use-auth";
import {
  archiveDesignReference,
  canCreateDesignReference,
  canEditDesignReference,
  createDesignReference,
  getDesignReferencesForProfile,
  updateDesignReference,
} from "@/lib/firebase/design-references";
import { getEventsForProfile } from "@/lib/firebase/events";
import { getMembers } from "@/lib/firebase/members";
import { isKoordinator } from "@/lib/permissions";
import { showConfirm, showSuccess, showError } from "@/lib/swal";
import type {
  DesignReference,
  DesignReferenceInput,
  DesignType,
  UserProfile,
  Event,
} from "@/types";

export default function ReferencesPage() {
  const { userProfile } = useAuth();
  const [references, setReferences] = useState<DesignReference[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedReference, setSelectedReference] = useState<DesignReference | null>(null);
  const [editingReference, setEditingReference] = useState<DesignReference | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [designType, setDesignType] = useState<"all" | DesignType>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "divisi" | "acara">("all");
  const [year, setYear] = useState("");
  const [eventName, setEventName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReferences = useCallback(async () => {
    if (!userProfile) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [referencesData, usersData, eventsData] = await Promise.all([
        getDesignReferencesForProfile(userProfile),
        getMembers().catch(() => [userProfile]),
        getEventsForProfile(userProfile).catch(() => []),
      ]);

      setReferences(referencesData);
      setUsers(usersData.length ? usersData : [userProfile]);
      setEvents(eventsData);
    } catch {
      setError("Gagal memuat arsip referensi. Periksa koneksi dan Firestore Rules.");
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    void Promise.resolve().then(loadReferences);
  }, [loadReferences]);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const canCreate = canCreateDesignReference(userProfile);
  const canShowArchived = isKoordinator(userProfile);

  const eventNames = useMemo(() => {
    const list = references.map((item) => item.event_name).filter(Boolean);
    // Add names from loaded events if they have references or if we want them as options
    events.forEach(e => {
      if (e.name) list.push(e.name);
    });
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  }, [references, events]);

  const years = useMemo(
    () =>
      [...new Set(references.map((item) => item.year).filter(Boolean))]
        .sort((a, b) => b - a),
    [references],
  );

  const filteredReferences = useMemo(() => {
    const query = search.trim().toLowerCase();

    return references.filter((reference) => {
      const haystack = [
        reference.title,
        reference.event_name,
        reference.notes,
        reference.style_notes,
        reference.file_inventory_notes,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesDesignType =
        designType === "all" || reference.design_type === designType;
      const matchesYear = !year || String(reference.year) === year;
      const matchesEvent = !eventName || reference.event_name === eventName;
      const matchesArchive = showArchived ? true : !reference.is_archived;
      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "divisi" && (!reference.scope || reference.scope === "divisi")) ||
        (scopeFilter === "acara" && reference.scope === "acara");

      return (
        matchesSearch &&
        matchesDesignType &&
        matchesYear &&
        matchesEvent &&
        matchesArchive &&
        matchesScope
      );
    });
  }, [designType, eventName, references, search, showArchived, year, scopeFilter]);

  async function handleSave(input: DesignReferenceInput, referenceId?: string) {
    if (!userProfile) {
      return;
    }

    try {
      if (referenceId) {
        await updateDesignReference(referenceId, input);
        await showSuccess("Referensi berhasil diperbarui.", "Sukses");
      } else {
        await createDesignReference(input, userProfile.id);
        await showSuccess("Referensi baru berhasil ditambahkan.", "Sukses");
      }
      await loadReferences();
    } catch {
      await showError("Gagal menyimpan referensi ke database.", "Error");
    }
  }

  async function handleArchive(reference: DesignReference) {
    const confirmed = await showConfirm({
      title: "Archive Referensi?",
      text: `Apakah Anda yakin ingin mengarsipkan referensi "${reference.title}"?`,
      confirmButtonText: "Ya, Arsipkan",
      cancelButtonText: "Batal",
      icon: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      await archiveDesignReference(reference.id);
      await showSuccess(`Referensi "${reference.title}" berhasil diarsipkan.`, "Sukses");
      await loadReferences();
    } catch {
      await showError("Gagal mengarsipkan referensi.", "Error");
    }
  }

  function openCreateForm() {
    setEditingReference(null);
    setFormOpen(true);
  }

  function openEditForm(reference: DesignReference) {
    setEditingReference(reference);
    setFormOpen(true);
  }

  if (loading) {
    return <LoadingState title="Memuat arsip referensi desain..." />;
  }

  if (error) {
    return <EmptyState title="Arsip referensi gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">
            Arsip Referensi Desain
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Catat desain lama, link Drive/Canva ganda, style visual, supergrafis, dan color
            palette agar anggota baru punya sumber inspirasi yang rapi.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {filteredReferences.length} dari {references.length} referensi tampil
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreateForm}>
            Tambah Referensi
          </Button>
        ) : null}
      </section>

      <ReferenceFilters
        search={search}
        designType={designType}
        scopeFilter={scopeFilter}
        year={year}
        eventName={eventName}
        eventNames={eventNames}
        years={years}
        showArchived={showArchived}
        canShowArchived={canShowArchived}
        onSearchChange={setSearch}
        onDesignTypeChange={setDesignType}
        onScopeFilterChange={setScopeFilter}
        onYearChange={setYear}
        onEventNameChange={setEventName}
        onShowArchivedChange={setShowArchived}
      />

      {filteredReferences.length ? (
        <ReferencesGrid
          references={filteredReferences}
          canEditReference={(reference) => canEditDesignReference(userProfile, reference)}
          onView={setSelectedReference}
          onEdit={openEditForm}
          onArchive={handleArchive}
        />
      ) : (
        <EmptyState
          title="Belum ada referensi yang cocok"
          description="Coba ubah filter pencarian, atau tambahkan referensi baru jika Anda memiliki akses."
          action={
            canCreate ? (
              <Button type="button" onClick={openCreateForm}>
                Tambah Referensi
              </Button>
            ) : null
          }
        />
      )}

      <ReferenceFormDialog
        open={formOpen}
        reference={editingReference}
        events={events}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <ReferenceDetailDialog
        reference={selectedReference}
        usersById={usersById}
        onClose={() => setSelectedReference(null)}
      />
    </div>
  );
}
