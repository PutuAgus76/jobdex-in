import { Input } from "@/components/ui/input";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-priority";
import { TASK_STATUS_OPTIONS } from "@/lib/task-status";
import type { Event, TaskPriority, TaskStatus, TaskType, UserProfile } from "@/types";

export type TaskDeadlineFilter = "all" | "overdue" | "week";

type TaskFiltersProps = {
  search: string;
  type: "all" | TaskType;
  status: "all" | TaskStatus;
  priority: "all" | TaskPriority;
  picId: string;
  eventId: string;
  deadline: TaskDeadlineFilter;
  users: UserProfile[];
  events: Event[];
  onSearchChange: (value: string) => void;
  onTypeChange: (value: "all" | TaskType) => void;
  onStatusChange: (value: "all" | TaskStatus) => void;
  onPriorityChange: (value: "all" | TaskPriority) => void;
  onPicChange: (value: string) => void;
  onEventChange: (value: string) => void;
  onDeadlineChange: (value: TaskDeadlineFilter) => void;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function TaskFilters({
  search,
  type,
  status,
  priority,
  picId,
  eventId,
  deadline,
  users,
  events,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onPriorityChange,
  onPicChange,
  onEventChange,
  onDeadlineChange,
}: TaskFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Input
        placeholder="Cari nama job desk..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <select className={selectClassName} value={type} onChange={(event) => onTypeChange(event.target.value as "all" | TaskType)}>
        <option value="all">Semua tipe</option>
        <option value="divisi">Divisi</option>
        <option value="acara">Acara</option>
      </select>
      <select className={selectClassName} value={status} onChange={(event) => onStatusChange(event.target.value as "all" | TaskStatus)}>
        <option value="all">Semua status</option>
        {TASK_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select className={selectClassName} value={priority} onChange={(event) => onPriorityChange(event.target.value as "all" | TaskPriority)}>
        <option value="all">Semua prioritas</option>
        {TASK_PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select className={selectClassName} value={picId} onChange={(event) => onPicChange(event.target.value)}>
        <option value="all">Semua PIC</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>{user.name || user.email}</option>
        ))}
      </select>
      <select className={selectClassName} value={eventId} onChange={(event) => onEventChange(event.target.value)}>
        <option value="all">Semua acara</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>{event.name}</option>
        ))}
      </select>
      <select className={selectClassName} value={deadline} onChange={(event) => onDeadlineChange(event.target.value as TaskDeadlineFilter)}>
        <option value="all">Semua deadline</option>
        <option value="overdue">Terlambat</option>
        <option value="week">7 hari ke depan</option>
      </select>
    </div>
  );
}
