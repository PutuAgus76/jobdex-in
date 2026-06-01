"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { formatTaskDate } from "@/lib/firebase/tasks";
import { getRiskLevelFromTask, getRiskColor, getRiskLabel } from "@/lib/task-risk";
import { SuggestedReferencesDialog } from "@/components/references/suggested-references-dialog";
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refDialogOpen, setRefDialogOpen] = useState(false);

  return (
    <div className="overflow-hidden jd-table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Acara/Divisi</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Prioritas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risiko</th>
              <th className="px-4 py-3">Referensi</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tasks.map((task) => {
              const riskLevel = getRiskLevelFromTask(task);
              const riskColor = getRiskColor(riskLevel);
              const riskLabel = getRiskLabel(riskLevel);
              const eventName =
                task.type === "acara"
                  ? eventsById.get(task.event_id || "")?.name ?? "Acara tidak ditemukan"
                  : task.division_id || "Humas & Media Kreatif";

              return (
                <tr key={task.id} className="align-middle hover:bg-slate-50 dark:hover:bg-slate-950">
                  <td className="px-4 py-4 font-semibold text-slate-950 dark:text-slate-50">{task.name}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {usersById.get(task.pic_id)?.name ?? "User tidak ditemukan"}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{eventName}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatTaskDate(task.deadline)}</td>
                  <td className="px-4 py-4">
                    <TaskPriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-4">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      className="text-[10px] font-bold"
                      style={{
                        backgroundColor: `${riskColor}15`,
                        color: riskColor,
                        borderColor: `${riskColor}30`,
                        borderWidth: 1,
                      }}
                    >
                      {riskLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedTask(task);
                        setRefDialogOpen(true);
                      }}
                      className="text-xs font-semibold py-1 h-auto"
                    >
                      Perlu Referensi
                    </Button>
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <SuggestedReferencesDialog
          open={refDialogOpen}
          task={selectedTask}
          eventName={
            selectedTask.type === "acara"
              ? eventsById.get(selectedTask.event_id || "")?.name ?? ""
              : selectedTask.division_id || "Humas & Media Kreatif"
          }
          onClose={() => {
            setRefDialogOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
