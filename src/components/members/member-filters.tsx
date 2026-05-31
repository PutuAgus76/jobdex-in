import { Input } from "@/components/ui/input";
import { USER_ROLE_OPTIONS } from "@/lib/roles";
import type { UserRole } from "@/types";

export type MemberStatusFilter = "all" | "active" | "inactive";

type MemberFiltersProps = {
  search: string;
  role: "all" | UserRole;
  status: MemberStatusFilter;
  division: string;
  divisions: string[];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: "all" | UserRole) => void;
  onStatusChange: (value: MemberStatusFilter) => void;
  onDivisionChange: (value: string) => void;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function MemberFilters({
  search,
  role,
  status,
  division,
  divisions,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onDivisionChange,
}: MemberFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <Input
        placeholder="Cari nama atau email..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <select
        className={selectClassName}
        value={role}
        onChange={(event) => onRoleChange(event.target.value as "all" | UserRole)}
      >
        <option value="all">Semua role</option>
        {USER_ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className={selectClassName}
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as MemberStatusFilter)
        }
      >
        <option value="all">Semua status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </select>

      <select
        className={selectClassName}
        value={division}
        onChange={(event) => onDivisionChange(event.target.value)}
      >
        <option value="all">Semua divisi</option>
        {divisions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
