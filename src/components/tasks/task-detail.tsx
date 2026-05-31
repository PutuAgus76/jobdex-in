"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskActionButtons } from "@/components/tasks/task-action-buttons";
import { TaskActivityLog } from "@/components/tasks/task-activity-log";
import { TaskApprovalBadge } from "@/components/tasks/task-approval-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskUploadSection } from "@/components/tasks/task-upload-section";
import { TaskWorkflowPanel } from "@/components/tasks/task-workflow-panel";
import { formatTaskDate } from "@/lib/firebase/tasks";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import type { Event, Task, TaskStatusLog, TaskUpload, UserProfile } from "@/types";

type TaskDetailProps = {
  task: Task;
  usersById: Map<string, UserProfile>;
  eventsById: Map<string, Event>;
  logs: TaskStatusLog[];
  uploads: TaskUpload[];
  currentUser: UserProfile;
  onChanged: () => Promise<void>;
};

function formatDateTime(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format((value as { toDate: () => Date }).toDate());
}

export function TaskDetail({
  task,
  usersById,
  eventsById,
  logs,
  uploads,
  currentUser,
  onChanged,
}: TaskDetailProps) {
  const rows = [
    ["Tipe task", task.type],
    ["Acara", task.event_id ? eventsById.get(task.event_id)?.name ?? "Acara tidak ditemukan" : "-"],
    ["Divisi", task.division_id || "-"],
    ["PIC", usersById.get(task.pic_id)?.name ?? "User tidak ditemukan"],
    ["Koordinator", usersById.get(task.coordinator_id)?.name ?? "User tidak ditemukan"],
    ["Deadline", formatTaskDate(task.deadline)],
    ["Approval status", task.approval_status],
    ["Created by", usersById.get(task.created_by)?.name ?? task.created_by],
    ["Created at", formatDateTime(task.created_at)],
    ["Updated at", formatDateTime(task.updated_at)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <section>
          <div className="flex flex-wrap gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            <TaskApprovalBadge status={task.approval_status} />
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">{task.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {task.description || "Tidak ada deskripsi."}
          </p>
        </section>
        <Button asChild variant="secondary">
          <Link href="/dashboard/tasks">Kembali</Link>
        </Button>
      </div>

      <TaskActionButtons
        task={task}
        currentUser={currentUser}
        onChanged={onChanged}
      />

      <TaskWorkflowPanel task={task} usersById={usersById} />

      <Card>
        <CardHeader>
          <CardTitle>Informasi task</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-slate-200">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-medium text-slate-500">{label}</dt>
                <dd className="text-sm font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Redaksi dan referensi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Block label="Copywriting" value={task.copywriting} />
            <LinkBlock label="Google Docs redaksi" href={task.copywriting_docs_url} />
            <LinkBlock label="Referensi desain" href={task.design_reference_url} />
            <LinkBlock label="Google Drive referensi" href={task.drive_reference_url} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Arahan visual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Block label="Arahan visual/supergrafis" value={task.visual_direction} />
            <div>
              <p className="font-semibold text-slate-950">Color palette</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {task.color_palette?.length ? (
                  task.color_palette.map((color) => (
                    <span key={color} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <span className="size-4 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                      {color}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>
            <Block label="Revision notes" value={task.revision_notes} />
            <Block label="Stuck notes" value={task.stuck_notes} />
            <Block label="Status saat ini" value={TASK_STATUS_LABELS[task.status]} />
          </CardContent>
        </Card>
      </section>

      <TaskUploadSection
        task={task}
        uploads={uploads}
        currentUser={currentUser}
        usersById={usersById}
        onUploaded={onChanged}
      />

      <TaskActivityLog logs={logs} usersById={usersById} />
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{label}</p>
      <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">{value || "-"}</p>
    </div>
  );
}

function LinkBlock({ label, href }: { label: string; href?: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sky-700 hover:text-sky-900">
          {href}
        </a>
      ) : (
        <p className="mt-1 text-slate-500">-</p>
      )}
    </div>
  );
}
