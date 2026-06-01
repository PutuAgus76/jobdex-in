"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { formatTaskDate } from "@/lib/firebase/tasks";
import { getRiskLevelFromTask, getRiskColor, getRiskLabel } from "@/lib/task-risk";
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
  const riskColor = getRiskColor(riskLevel);
  const riskLabel = getRiskLabel(riskLevel);
  const eventName =
    task.type === "acara"
      ? eventsById.get(task.event_id || "")?.name ?? "Acara tidak ditemukan"
      : task.division_id || "Humas & Media Kreatif";

  return (
    <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition duration-150 flex flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
          <CardTitle className="mt-3 text-lg font-bold">{task.name}</CardTitle>
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
              <dd className="font-semibold text-slate-950 dark:text-slate-50">
                {formatTaskDate(task.deadline)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Acara/Divisi</dt>
              <dd className="text-right font-semibold text-slate-950 dark:text-slate-50">
                {eventName}
              </dd>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <dt className="text-slate-500 dark:text-slate-400">Risiko</dt>
              <dd className="font-semibold">
                <Badge
                  className="text-[9px] font-bold"
                  style={{
                    backgroundColor: `${riskColor}15`,
                    color: riskColor,
                    borderColor: `${riskColor}30`,
                    borderWidth: 1,
                  }}
                >
                  {riskLabel}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </div>

      <CardContent className="pt-0">
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/dashboard/tasks/${task.id}`}>Detail</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setRefDialogOpen(true)}
            className="text-xs font-semibold py-1 h-auto"
          >
            Perlu Referensi
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

      <SuggestedReferencesDialog
        open={refDialogOpen}
        task={task}
        eventName={eventName}
        onClose={() => setRefDialogOpen(false)}
      />
    </Card>
  );
}
