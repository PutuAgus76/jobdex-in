"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { formatTaskDate } from "@/lib/firebase/tasks";
import type { Event, Task, UserProfile } from "@/types";

type TaskCardProps = {
  task: Task;
  usersById: Map<string, UserProfile>;
  eventsById: Map<string, Event>;
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
};

export function TaskCard({
  task,
  usersById,
  eventsById,
  canEdit,
  onEdit,
  onArchive,
}: TaskCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
        <CardTitle className="mt-3">{task.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">PIC</dt>
            <dd className="font-semibold text-slate-950 dark:text-slate-50">
              {usersById.get(task.pic_id)?.name ?? "User tidak ditemukan"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Deadline</dt>
            <dd className="font-semibold text-slate-950 dark:text-slate-50">{formatTaskDate(task.deadline)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Tipe</dt>
            <dd className="font-semibold capitalize text-slate-950 dark:text-slate-50">{task.type}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Acara/Divisi</dt>
            <dd className="text-right font-semibold text-slate-950 dark:text-slate-50">
              {task.type === "acara"
                ? eventsById.get(task.event_id || "")?.name ?? "Acara tidak ditemukan"
                : task.division_id || "humas_media_kreatif"}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/dashboard/tasks/${task.id}`}>Detail</Link>
          </Button>
          {canEdit ? (
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
      </CardContent>
    </Card>
  );
}
