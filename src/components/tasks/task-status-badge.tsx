import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS } from "@/lib/task-status";
import type { TaskStatus } from "@/types";

export function TaskStatusBadge({ status }: { status?: TaskStatus }) {
  if (!status) {
    return <Badge>Tanpa status</Badge>;
  }

  const variant = status === "approved" ? "success" : status === "stuck" ? "warning" : "info";

  return <Badge variant={variant}>{TASK_STATUS_LABELS[status]}</Badge>;
}
