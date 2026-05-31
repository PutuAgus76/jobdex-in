import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import type { TaskStatusLog, UserProfile } from "@/types";

type TaskActivityLogProps = {
  logs: TaskStatusLog[];
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

export function TaskActivityLog({ logs, usersById }: TaskActivityLogProps) {
  function getActorName(userId: string) {
    const user = usersById.get(userId);

    if (user?.name) {
      return user.name;
    }

    const shortUid = userId ? `${userId.slice(0, 8)}...` : "-";

    return `User tidak ditemukan (${shortUid})`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState
            title="Belum ada activity log"
            description="Riwayat perubahan status akan muncul setelah task diperbarui."
          />
        ) : (
          <ol className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="rounded-[8px] border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {TASK_STATUS_LABELS[log.from_status]} ke {TASK_STATUS_LABELS[log.to_status]}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(log.created_at)}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Oleh {getActorName(log.changed_by)}
                </p>
                {log.note ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-[8px] bg-slate-50 dark:bg-slate-900/60 p-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {log.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
