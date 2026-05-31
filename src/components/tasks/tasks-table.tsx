"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { formatTaskDate } from "@/lib/firebase/tasks";
import type { Event, Task, UserProfile } from "@/types";

type TasksTableProps = {
  tasks: Task[];
  usersById: Map<string, UserProfile>;
  eventsById: Map<string, Event>;
  canEdit: (task: Task) => boolean;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
};

export function TasksTable({
  tasks,
  usersById,
  eventsById,
  canEdit,
  onEdit,
  onArchive,
}: TasksTableProps) {
  return (
    <div className="overflow-hidden jd-table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Nama task</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Acara/Divisi</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Prioritas</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tasks.map((task) => (
              <tr key={task.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-950">
                <td className="px-4 py-4 font-semibold text-slate-950 dark:text-slate-50">{task.name}</td>
                <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{task.type}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                  {task.type === "acara"
                    ? eventsById.get(task.event_id || "")?.name ?? "Acara tidak ditemukan"
                    : task.division_id || "humas_media_kreatif"}
                </td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                  {usersById.get(task.pic_id)?.name ?? "User tidak ditemukan"}
                </td>
                <td className="px-4 py-4"><TaskStatusBadge status={task.status} /></td>
                <td className="px-4 py-4"><TaskPriorityBadge priority={task.priority} /></td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatTaskDate(task.deadline)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/dashboard/tasks/${task.id}`}>Detail</Link>
                    </Button>
                    {canEdit(task) ? (
                      <>
                        <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(task)}>
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="warning" onClick={() => onArchive(task)}>
                          Archive
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
