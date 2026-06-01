"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EventDetail } from "@/components/events/event-detail";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import {
  addEventMember,
  getEventMembers,
  removeEventMember,
} from "@/lib/firebase/event-members";
import { getEventById } from "@/lib/firebase/events";
import { getMembers } from "@/lib/firebase/members";
import { createTask, getTasksByEvent } from "@/lib/firebase/tasks";
import { canManageEvent, isAnggota } from "@/lib/permissions";
import type { Event, EventMember, Task, TaskInput, UserProfile } from "@/types";

import { showConfirm, showSuccess, showError } from "@/lib/swal";

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [eventMembers, setEventMembers] = useState<EventMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const eventId = params.eventId;

  const loadDetail = useCallback(async () => {
    if (!userProfile || !eventId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const eventData = await getEventById(eventId);

      if (!eventData) {
        setEvent(null);
        return;
      }

      if (isAnggota(userProfile) || !canManageEvent(userProfile, eventData)) {
        router.replace("/dashboard/unauthorized");
        return;
      }

      const [usersData, membersData, taskData] = await Promise.all([
        getMembers(),
        getEventMembers(eventId),
        getTasksByEvent(eventId),
      ]);

      setEvent(eventData);
      setUsers(usersData);
      setEventMembers(membersData);
      setTasks(taskData);
    } catch {
      setError("Gagal memuat detail acara. Periksa izin akses dan Firestore Rules.");
    } finally {
      setLoading(false);
    }
  }, [eventId, router, userProfile]);

  useEffect(() => {
    void Promise.resolve().then(loadDetail);
  }, [loadDetail]);

  async function handleAddMember(userId: string, roleInEvent: string) {
    if (!userProfile || !event) {
      return;
    }

    try {
      await addEventMember({
        eventId: event.id,
        userId,
        roleInEvent,
        addedBy: userProfile.id,
      });
      void showSuccess("Anggota berhasil ditambahkan ke acara!");
      await loadDetail();
    } catch {
      void showError("Gagal menambahkan anggota ke acara.");
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!event) {
      return;
    }

    const confirmed = await showConfirm({
      title: "Hapus Anggota Acara",
      text: "Apakah Anda yakin ingin mengeluarkan anggota ini dari acara?",
      confirmButtonText: "Ya, Keluarkan",
      cancelButtonText: "Batal",
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeEventMember(event.id, userId);
      void showSuccess("Anggota berhasil dikeluarkan dari acara!");
      await loadDetail();
    } catch {
      void showError("Gagal mengeluarkan anggota dari acara.");
    }
  }

  async function handleCreateTask(input: TaskInput) {
    if (!userProfile) {
      return;
    }

    try {
      await createTask(input, userProfile.id);
      void showSuccess("Job desk berhasil ditambahkan ke acara!");
      await loadDetail();
    } catch {
      void showError("Gagal menambahkan job desk.");
    }
  }

  if (loading) {
    return <LoadingState title="Memuat detail acara..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Detail acara gagal dimuat"
        description={error}
      />
    );
  }

  if (!event) {
    return (
      <EmptyState
        title="Acara tidak ditemukan"
        description="Dokumen acara tidak tersedia atau sudah tidak dapat diakses."
      />
    );
  }

  return (
    <EventDetail
      event={event}
      users={users}
      eventMembers={eventMembers}
      tasks={tasks}
      canManage={Boolean(userProfile && canManageEvent(userProfile, event))}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
      onCreateTask={handleCreateTask}
    />
  );
}
