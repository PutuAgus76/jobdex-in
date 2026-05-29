import { TaskCard } from "@/components/tasks/task-card";
import type { Event, Task, UserProfile } from "@/types";

type TaskCardGridProps = {
  tasks: Task[];
  usersById: Map<string, UserProfile>;
  eventsById: Map<string, Event>;
  canEdit: (task: Task) => boolean;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
};

export function TaskCardGrid({
  tasks,
  usersById,
  eventsById,
  canEdit,
  onEdit,
  onArchive,
}: TaskCardGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          usersById={usersById}
          eventsById={eventsById}
          canEdit={canEdit(task)}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
