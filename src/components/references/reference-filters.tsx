"use client";

import { Input } from "@/components/ui/input";
import { DESIGN_TYPE_OPTIONS } from "@/lib/design-types";
import type { DesignType } from "@/types";

type ReferenceFiltersProps = {
  search: string;
  designType: "all" | DesignType;
  year: string;
  eventName: string;
  eventNames: string[];
  years: number[];
  showArchived: boolean;
  canShowArchived: boolean;
  onSearchChange: (value: string) => void;
  onDesignTypeChange: (value: "all" | DesignType) => void;
  onYearChange: (value: string) => void;
  onEventNameChange: (value: string) => void;
  onShowArchivedChange: (value: boolean) => void;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function ReferenceFilters({
  search,
  designType,
  year,
  eventName,
  eventNames,
  years,
  showArchived,
  canShowArchived,
  onSearchChange,
  onDesignTypeChange,
  onYearChange,
  onEventNameChange,
  onShowArchivedChange,
}: ReferenceFiltersProps) {
  return (
    <div className="grid gap-3 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 lg:grid-cols-[1.3fr_1fr_0.8fr_1fr_auto]">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Cari judul, acara, atau catatan"
      />
      <select
        className={selectClassName}
        value={designType}
        onChange={(event) => onDesignTypeChange(event.target.value as "all" | DesignType)}
      >
        <option value="all">Semua jenis</option>
        {DESIGN_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className={selectClassName}
        value={year}
        onChange={(event) => onYearChange(event.target.value)}
      >
        <option value="">Semua tahun</option>
        {years.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        className={selectClassName}
        value={eventName}
        onChange={(event) => onEventNameChange(event.target.value)}
      >
        <option value="">Semua acara</option>
        {eventNames.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {canShowArchived ? (
        <label className="flex items-center gap-2 rounded-[8px] border border-slate-200 dark:border-slate-800 px-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => onShowArchivedChange(event.target.checked)}
          />
          Archived
        </label>
      ) : null}
    </div>
  );
}
