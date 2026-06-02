"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { formatTaskDate } from "@/lib/firebase/tasks";
import { getRiskLevelFromTask, getRiskLabel } from "@/lib/task-risk";
import { SuggestedReferencesDialog } from "@/components/references/suggested-references-dialog";
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
  const [refDialogOpen, setRefDialogOpen] = useState(false);

  const riskLevel = getRiskLevelFromTask(task);
  const riskLabel = getRiskLabel(riskLevel);
  const eventName =
    task.type === "acara"
      ? eventsById.get(task.event_id || "")?.name ?? "Acara tidak ditemukan"
      : task.division_id || "Humas & Media Kreatif";

  const riskBadgeClasses = {
    red: "jd-neo-badge-red",
    orange: "jd-neo-badge-orange",
    yellow: "jd-neo-badge-yellow",
    none: "jd-neo-badge-gray",
  }[riskLevel] || "jd-neo-badge-gray";

  return (
    <Card className="flex flex-col justify-between m-1">
      <div>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
          <CardTitle className="mt-3 text-lg font-black text-slate-900 dark:text-white">{task.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-3">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400 font-medium">PIC</dt>
              <dd className="font-bold text-slate-800 dark:text-slate-200">
                {usersById.get(task.pic_id)?.name ?? "User tidak ditemukan"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Deadline</dt>
              <dd className="font-bold text-slate-800 dark:text-slate-200">
                {formatTaskDate(task.deadline)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Acara/Divisi</dt>
              <dd className="text-right font-bold text-slate-800 dark:text-slate-200">
                {eventName}
              </dd>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Risiko</dt>
              <dd className="font-bold">
                <span className={`jd-neo-badge ${riskBadgeClasses} text-[10px] font-bold`}>
                  {riskLabel}
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </div>

      <CardContent className="pt-0">
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary" className="text-xs font-bold py-1 h-auto">
            <Link href={`/dashboard/tasks/${task.id}`}>Detail</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setRefDialogOpen(true)}
            className="text-xs font-bold py-1 h-auto"
          >
            Perlu Referensi
          </Button>
          {canEdit ? (
            <>
              <Button type="button" size="sm" variant="warning" className="text-xs font-bold py-1 h-auto" onClick={() => onEdit(task)}>
                Edit
              </Button>
              <Button type="button" size="sm" variant="destructive" className="text-xs font-bold py-1 h-auto" onClick={() => onArchive(task)}>
                Archive
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>

      <SuggestedReferencesDialog
        open={refDialogOpen}
        task={task}
        eventName={eventName}
        onClose={() => setRefDialogOpen(false)}
      />
    </Card>
  );
}
