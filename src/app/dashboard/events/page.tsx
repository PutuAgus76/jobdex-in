"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { EventFilters, type EventDateFilter } from "@/components/events/event-filters";
import { EventFormDialog } from "@/components/events/event-form-dialog";
import { EventsTable } from "@/components/events/events-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import {
  getEventMembers,
  addEventMember,
  removeEventMember,
} from "@/lib/firebase/event-members";
import {
  createEvent,
  getEventsForProfile,
  updateEvent,
} from "@/lib/firebase/events";
import { getMembers } from "@/lib/firebase/members";
import { canCreateEvent, isAnggota } from "@/lib/permissions";
import type { Event, EventInput, EventStatus, UserProfile, EventMember } from "@/types";
import { showSuccess, showError } from "@/lib/swal";

export default function EventsPage() {
  const { userProfile } = useAuth();

  if (userProfile && isAnggota(userProfile)) {
    return (
      <div className="space-y-6">
        <section>
          <Badge variant="info">Acara</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">Acara</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Event yang melibatkan Anda akan tersedia pada fase berikutnya.
          </p>
        </section>
        <EmptyState
          title="Belum ada tampilan acara untuk anggota"
          description="Anggota akan melihat acara yang melibatkan mereka setelah modul task dan event membership untuk anggota dibuka."
        />
      </div>
    );
  }

  return (
    <PermissionGuard canAccess={canCreateEvent}>
      <EventsManagement />
    </PermissionGuard>
  );
}

function EventsManagement() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [dateFilter, setDateFilter] = useState<EventDateFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventMembers, setSelectedEventMembers] = useState<EventMember[]>([]);

  const loadEvents = useCallback(async () => {
    if (!userProfile) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [eventsData, usersData] = await Promise.all([
        getEventsForProfile(userProfile),
        getMembers(),
      ]);
      const counts = await getMemberCounts(eventsData);

      setEvents(eventsData);
      setUsers(usersData);
      setMemberCounts(counts);
    } catch {
      setError("Gagal mengambil data acara. Periksa Firestore Rules dan koneksi.");
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    void Promise.resolve().then(loadEvents);
  }, [loadEvents]);

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const coordinators = useMemo(() => {
    if (!userProfile) {
      return [];
    }

    if (userProfile.role === "koordinator_acara") {
      return [userProfile];
    }

    const coordinatorUsers = users.filter((user) =>
      ["super_admin", "koordinator_divisi", "koordinator_acara"].includes(user.role),
    );

    return coordinatorUsers.length ? coordinatorUsers : [userProfile];
  }, [userProfile, users]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const matchesSearch = !query || event.name.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const eventDate = getEventDate(event.event_date);
      const matchesDate =
        dateFilter === "all" ||
        !eventDate ||
        (dateFilter === "upcoming" && eventDate >= today) ||
        (dateFilter === "past" && eventDate < today);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, events, search, statusFilter]);

  async function handleSaveEvent(input: EventInput, eventId?: string) {
    if (!userProfile) {
      return;
    }

    try {
      let activeId = eventId;
      if (eventId) {
        await updateEvent(eventId, input, userProfile.id);
        void showSuccess("Acara berhasil diperbarui!");
      } else {
        activeId = await createEvent(input, userProfile.id);
        void showSuccess("Acara baru berhasil ditambahkan!");
      }

      if (activeId) {
        // Sync members: coordinator, secretary, initial_member_ids
        const existingMembers = eventId ? await getEventMembers(eventId) : [];
        const existingMembersMap = new Map(existingMembers.map((m) => [m.user_id, m]));

        // 1. Process Coordinator (koordinator_acara)
        await addEventMember({
          eventId: activeId,
          userId: input.coordinator_id,
          roleInEvent: "koordinator_acara",
          addedBy: userProfile.id,
        });

        // 2. Process Secretary (sekretaris_acara)
        const oldSec = existingMembers.find((m) => {
          const r = m.role_in_event?.toLowerCase() || "";
          return r === "sekretaris_acara" || r === "sekretaris acara" || r === "sekretaris";
        });

        if (input.secretary_id) {
          await addEventMember({
            eventId: activeId,
            userId: input.secretary_id,
            roleInEvent: "sekretaris_acara",
            addedBy: userProfile.id,
          });
          // If secretary changed, change old secretary back to "anggota_acara"
          if (oldSec && oldSec.user_id !== input.secretary_id && oldSec.user_id !== input.coordinator_id) {
            await addEventMember({
              eventId: activeId,
              userId: oldSec.user_id,
              roleInEvent: "anggota_acara",
              addedBy: userProfile.id,
            });
          }
        } else {
          // If secretary cleared, change old secretary back to "anggota_acara"
          if (oldSec && oldSec.user_id !== input.coordinator_id) {
            await addEventMember({
              eventId: activeId,
              userId: oldSec.user_id,
              roleInEvent: "anggota_acara",
              addedBy: userProfile.id,
            });
          }
        }

        // 3. Process Initial Members
        const currentCoordId = input.coordinator_id;
        const currentSecId = input.secretary_id || "";
        const targetMemberIds = input.initial_member_ids || [];

        // Add/Update new members
        for (const mId of targetMemberIds) {
          if (mId === currentCoordId || mId === currentSecId) continue;
          const exist = existingMembersMap.get(mId);
          if (!exist || exist.role_in_event !== "anggota_acara") {
            await addEventMember({
              eventId: activeId,
              userId: mId,
              roleInEvent: "anggota_acara",
              addedBy: userProfile.id,
            });
          }
        }

        // Remove unselected members (only if editing)
        if (eventId) {
          for (const ext of existingMembers) {
            if (ext.user_id === currentCoordId || ext.user_id === currentSecId) continue;
            if (!targetMemberIds.includes(ext.user_id)) {
              await removeEventMember(activeId, ext.user_id);
            }
          }
        }
      }

      await loadEvents();
    } catch (err) {
      void showError("Gagal menyimpan acara.");
      throw err;
    }
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge variant="info">Manajemen Acara</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
            Manajemen Acara
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Buat, edit, ubah status, dan kelola anggota yang terlibat dalam
            acara organisasi.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setSelectedEvent(null);
            setSelectedEventMembers([]);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Tambah Acara
        </Button>
      </section>

      <EventFilters
        search={search}
        status={statusFilter}
        dateFilter={dateFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onDateFilterChange={setDateFilter}
      />

      {error ? (
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <LoadingState title="Memuat daftar acara..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="Belum ada acara"
          description="Buat acara pertama untuk mulai mengelola koordinasi publikasi, dokumentasi, dan media kreatif."
          action={
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSelectedEvent(null);
                setSelectedEventMembers([]);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Acara
            </Button>
          }
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="Tidak ada acara yang cocok"
          description="Coba ubah kata kunci pencarian, status, atau filter tanggal."
        />
      ) : (
        <EventsTable
          events={filteredEvents}
          usersById={usersById}
          memberCounts={memberCounts}
          onEdit={async (event) => {
            setSelectedEvent(event);
            try {
              const members = await getEventMembers(event.id);
              setSelectedEventMembers(members);
            } catch {
              setSelectedEventMembers([]);
            }
            setFormOpen(true);
          }}
        />
      )}

      <EventFormDialog
        open={formOpen}
        event={selectedEvent}
        coordinators={coordinators}
        fallbackCoordinatorId={userProfile.id}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveEvent}
        users={users}
        eventMembers={selectedEventMembers}
      />
    </div>
  );
}

async function getMemberCounts(events: Event[]) {
  const entries = await Promise.all(
    events.map(async (event) => {
      try {
        const members = await getEventMembers(event.id);
        return [event.id, members.length] as const;
      } catch {
        return [event.id, 0] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

function getEventDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return null;
  }

  const date = (value as { toDate: () => Date }).toDate();
  date.setHours(0, 0, 0, 0);
  return date;
}
