"use client";

import Link from "next/link";
import { EventMembersManager } from "@/components/events/event-members-manager";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { EventTasksSection } from "@/components/tasks/event-tasks-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDate } from "@/lib/firebase/events";
import { getTaskProgressWeight } from "@/lib/firebase/tasks";
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

  // Recalculate event progress dynamically client-side for absolute real-time accuracy!
  const activeTasks = tasks.filter((t) => t.event_id === event.id && !t.is_archived);
  const computedProgress = activeTasks.length > 0
    ? Math.round(activeTasks.reduce((sum, t) => sum + getTaskProgressWeight(t.status), 0) / activeTasks.length)
    : 0;

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

      <section className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              {computedProgress}%
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

      <section>
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Group Acara</CardTitle>
          </CardHeader>
          <CardContent>
            {event.whatsapp_group_id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 rounded-full ${event.whatsapp_group_verified ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className={`text-sm font-medium ${event.whatsapp_group_verified ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {event.whatsapp_group_verified ? 'Terverifikasi' : 'Belum diverifikasi'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {event.whatsapp_group_id}
                  </code>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(event.whatsapp_group_id || "");
                    }}
                  >
                    Copy
                  </button>
                </div>
                {event.whatsapp_group_name && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nama grup: {event.whatsapp_group_name}
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Reminder task acara ini akan dikirim ke grup ini.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Belum diatur
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Edit acara untuk menambahkan ID grup WhatsApp, atau kirim command dari dalam grup:
                  <code className="ml-1 rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-800">
                    !jobdex hubungkan grup acara {event.name}
                  </code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <EventMembersManager
        eventId={event.id}
        eventName={event.name}
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
