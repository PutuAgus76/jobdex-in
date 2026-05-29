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
import { canManageEvent, isAnggota } from "@/lib/permissions";
import type { Event, EventMember, UserProfile } from "@/types";

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [eventMembers, setEventMembers] = useState<EventMember[]>([]);
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

      const [usersData, membersData] = await Promise.all([
        getMembers(),
        getEventMembers(eventId),
      ]);

      setEvent(eventData);
      setUsers(usersData);
      setEventMembers(membersData);
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

    await addEventMember({
      eventId: event.id,
      userId,
      roleInEvent,
      addedBy: userProfile.id,
    });
    await loadDetail();
  }

  async function handleRemoveMember(userId: string) {
    if (!event) {
      return;
    }

    await removeEventMember(event.id, userId);
    await loadDetail();
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
      canManage={Boolean(userProfile && canManageEvent(userProfile, event))}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
    />
  );
}
