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
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export function EventFilters({
  search,
  status,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateFilterChange,
}: EventFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
      <Input
        placeholder="Cari nama acara..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
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
