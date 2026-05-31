"use client";

import Link from "next/link";
import { EventMembersManager } from "@/components/events/event-members-manager";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { EventTasksSection } from "@/components/tasks/event-tasks-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDate } from "@/lib/firebase/events";
import type { Event, EventMember, Task, TaskInput, UserProfile } from "@/types";

type EventDetailProps = {
  event: Event;
  users: UserProfile[];
  eventMembers: EventMember[];
  tasks: Task[];
  canManage: boolean;
  onAddMember: (userId: string, roleInEvent: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onCreateTask: (input: TaskInput) => Promise<void>;
};

export function EventDetail({
  event,
  users,
  eventMembers,
  tasks,
  canManage,
  onAddMember,
  onRemoveMember,
  onCreateTask,
}: EventDetailProps) {
  const usersById = new Map(users.map((user) => [user.id, user]));
  const coordinator = usersById.get(event.coordinator_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <section>
          <EventStatusBadge status={event.status} />
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">
            {event.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {event.description || "Tidak ada deskripsi."}
          </p>
        </section>
        <Button asChild variant="secondary">
          <Link href="/dashboard/events">Kembali</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Tanggal acara</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {formatEventDate(event.event_date)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Koordinator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {coordinator?.name ?? "Koordinator belum ditemukan"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {event.progress_percentage ?? 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {eventMembers.length} orang
            </p>
          </CardContent>
        </Card>
      </section>

      <EventMembersManager
        eventId={event.id}
        users={users}
        eventMembers={eventMembers}
        canManage={canManage}
        onAdd={onAddMember}
        onRemove={onRemoveMember}
      />

      <EventTasksSection
        event={event}
        tasks={tasks}
        users={users}
        canManage={canManage}
        onCreateTask={onCreateTask}
      />
    </div>
  );
}
