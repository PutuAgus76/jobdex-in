"use client";

import Link from "next/link";
import { useState } from "react";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTaskDate } from "@/lib/firebase/tasks";
import type { Event, Task, TaskInput, UserProfile } from "@/types";

type EventTasksSectionProps = {
  event: Event;
  tasks: Task[];
  users: UserProfile[];
  canManage: boolean;
  onCreateTask: (input: TaskInput) => Promise<void>;
};

export function EventTasksSection({
  event,
  tasks,
  users,
  canManage,
  onCreateTask,
}: EventTasksSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Job Desk Acara</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Task dengan event_id yang terhubung ke acara ini.
          </p>
        </div>
        {canManage ? (
          <Button type="button" onClick={() => setFormOpen(true)}>
            Tambah Job Desk
          </Button>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Belum ada job desk acara"
          description="Tambahkan job desk acara untuk mulai membagi pekerjaan publikasi, dokumentasi, dan desain."
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Nama task</th>
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-4 font-semibold text-slate-950 dark:text-slate-50">{task.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {usersById.get(task.pic_id)?.name ?? "User tidak ditemukan"}
                    </td>
                    <td className="px-4 py-4"><TaskStatusBadge status={task.status} /></td>
                    <td className="px-4 py-4"><TaskPriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatTaskDate(task.deadline)}</td>
                    <td className="px-4 py-4">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/tasks/${task.id}`}>Detail</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        task={null}
        users={users.filter((user) => user.is_active)}
        events={[event]}
        fallbackCoordinatorId={event.coordinator_id}
        defaultEventId={event.id}
        onClose={() => setFormOpen(false)}
        onSave={async (input) => {
          await onCreateTask(input);
          setFormOpen(false);
        }}
      />
    </div>
  );
}
