"use client";

import { Input } from "@/components/ui/input";
import { DESIGN_TYPE_OPTIONS } from "@/lib/design-types";
import type { DesignType, Division, Event } from "@/types";

type ReferenceFiltersProps = {
  search: string;
  designType: "all" | DesignType;
  scopeFilter: "all" | "divisi" | "acara";
  sourceTypeFilter: "all" | "manual" | "approved";
  selectedDivisionId: string;
  selectedEventId: string;
  year: string;
  eventName: string;
  eventNames: string[];
  years: number[];
  divisions: Division[];
  events: Event[];
  showArchived: boolean;
  canShowArchived: boolean;
  onSearchChange: (value: string) => void;
  onDesignTypeChange: (value: "all" | DesignType) => void;
  onScopeFilterChange: (value: "all" | "divisi" | "acara") => void;
  onSourceTypeChange: (value: "all" | "manual" | "approved") => void;
  onDivisionChange: (value: string) => void;
  onEventChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onEventNameChange: (value: string) => void;
  onShowArchivedChange: (value: boolean) => void;
};

const selectClassName =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950/30";

export function ReferenceFilters({
  search,
  designType,
  scopeFilter,
  sourceTypeFilter,
  selectedDivisionId,
  selectedEventId,
  year,
  eventName,
  eventNames,
  years,
  divisions,
  events,
  showArchived,
  canShowArchived,
  onSearchChange,
  onDesignTypeChange,
  onScopeFilterChange,
  onSourceTypeChange,
  onDivisionChange,
  onEventChange,
  onYearChange,
  onEventNameChange,
  onShowArchivedChange,
}: ReferenceFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3 jd-neo-card p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr_1fr_auto]">
      <div className="col-span-2 lg:col-span-1">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari judul, acara, atau catatan"
        />
      </div>

      <select
        className={selectClassName}
        value={scopeFilter}
        onChange={(event) => onScopeFilterChange(event.target.value as "all" | "divisi" | "acara")}
      >
        <option value="all">Semua Skope (Divisi/Acara)</option>
        <option value="divisi">Skope Divisi</option>
        <option value="acara">Skope Acara</option>
      </select>

      {/* Dynamic Specific Division or Event selector */}
      {scopeFilter === "divisi" ? (
        <select
          className={selectClassName}
          value={selectedDivisionId}
          onChange={(event) => onDivisionChange(event.target.value)}
        >
          <option value="all">Semua Divisi</option>
          {divisions.map((div) => (
            <option key={div.id} value={div.id}>
              {div.name}
            </option>
          ))}
        </select>
      ) : scopeFilter === "acara" ? (
        <select
          className={selectClassName}
          value={selectedEventId}
          onChange={(event) => onEventChange(event.target.value)}
        >
          <option value="all">Semua Acara</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      ) : (
        <select
          className={selectClassName}
          value={eventName}
          onChange={(event) => onEventNameChange(event.target.value)}
        >
          <option value="">Semua Nama Acara/Divisi</option>
          {eventNames.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}

      <select
        className={selectClassName}
        value={sourceTypeFilter}
        onChange={(event) => onSourceTypeChange(event.target.value as "all" | "manual" | "approved")}
      >
        <option value="all">Semua Sumber</option>
        <option value="manual">Input Manual</option>
        <option value="approved">Dari Jobdesk Approved</option>
      </select>

      <select
        className={selectClassName}
        value={designType}
        onChange={(event) => onDesignTypeChange(event.target.value as "all" | DesignType)}
      >
        <option value="all">Semua jenis visual</option>
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

      {canShowArchived ? (
        <label className="col-span-2 lg:col-span-1 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-350 shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => onShowArchivedChange(event.target.checked)}
            className="accent-sky-600 border border-slate-300 dark:border-slate-700 rounded"
          />
          Archived
        </label>
      ) : null}
    </div>
  );
}
