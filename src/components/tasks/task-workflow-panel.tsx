import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskApprovalBadge } from "@/components/tasks/task-approval-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { formatTaskDate } from "@/lib/firebase/tasks";
import type { Task, UserProfile } from "@/types";

type TaskWorkflowPanelProps = {
  task: Task;
  usersById: Map<string, UserProfile>;
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

export function TaskWorkflowPanel({ task, usersById }: TaskWorkflowPanelProps) {
  const approvedBy = task.approved_by
    ? usersById.get(task.approved_by)?.name ?? task.approved_by
    : "-";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status sekarang</dt>
            <dd className="mt-2"><TaskStatusBadge status={task.status} /></dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Approval</dt>
            <dd className="mt-2"><TaskApprovalBadge status={task.approval_status} /></dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Deadline</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{formatTaskDate(task.deadline)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved by</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{approvedBy}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved at</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{formatDateTime(task.approved_at)}</dd>
          </div>
        </dl>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <NoteBlock title="Catatan kendala" value={task.stuck_notes} />
          <NoteBlock title="Catatan revisi" value={task.revision_notes} />
        </div>
      </CardContent>
    </Card>
  );
}

function NoteBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
        {value || "-"}
      </p>
    </div>
  );
}
