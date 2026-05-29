import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY_LABELS } from "@/lib/task-priority";
import type { TaskPriority } from "@/types";

export function TaskPriorityBadge({ priority }: { priority?: TaskPriority }) {
  if (!priority) {
    return <Badge>Tanpa prioritas</Badge>;
  }

  const variant = priority === "kritis" || priority === "tinggi" ? "warning" : "default";

  return <Badge variant={variant}>{TASK_PRIORITY_LABELS[priority]}</Badge>;
}
