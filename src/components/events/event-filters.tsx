import { Input } from "@/components/ui/input";
import { EVENT_STATUS_OPTIONS } from "@/lib/event-status";
import type { EventStatus } from "@/types";

export type EventDateFilter = "all" | "upcoming" | "past";

type EventFiltersProps = {
  search: string;
  status: "all" | EventStatus;
  dateFilter: EventDateFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | EventStatus) => void;
  onDateFilterChange: (value: EventDateFilter) => void;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function EventFilters({
  search,
  status,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateFilterChange,
}: EventFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
      <div className="col-span-2 md:col-span-1">
        <Input
          placeholder="Cari nama acara..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <select
        className={selectClassName}
        value={status}
        onChange={(event) => onStatusChange(event.target.value as "all" | EventStatus)}
      >
        <option value="all">Semua status</option>
        {EVENT_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className={selectClassName}
        value={dateFilter}
        onChange={(event) =>
          onDateFilterChange(event.target.value as EventDateFilter)
        }
      >
        <option value="all">Semua tanggal</option>
        <option value="upcoming">Akan datang</option>
        <option value="past">Sudah lewat</option>
      </select>
    </div>
  );
}
