"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatEventDate } from "@/lib/firebase/events";
import type { Event, UserProfile } from "@/types";

type EventsTableProps = {
  events: Event[];
  usersById: Map<string, UserProfile>;
  memberCounts: Record<string, number>;
  onEdit: (event: Event) => void;
};

export function EventsTable({
  events,
  usersById,
  memberCounts,
  onEdit,
}: EventsTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden jd-neo-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Nama acara</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Koordinator</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-950 dark:divide-neutral-800">
              {events.map((event) => (
                <tr key={event.id} className="align-middle hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-900 dark:text-white">{event.name}</p>
                    <p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                      {event.description || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-350">
                    {formatEventDate(event.event_date)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-350">
                    {usersById.get(event.coordinator_id)?.name ??
                      "Koordinator belum ditemukan"}
                  </td>
                  <td className="px-4 py-4">
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-350">
                    {event.progress_percentage ?? 0}%
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-350">
                    {memberCounts[event.id] ?? 0}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="secondary" className="text-xs font-bold py-1 h-auto">
                        <Link href={`/dashboard/events/${event.id}`}>Detail</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="warning"
                        className="text-xs font-bold py-1 h-auto"
                        onClick={() => onEdit(event)}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3">
        {events.map((event) => (
          <div key={event.id} className="p-4 jd-neo-card space-y-3 m-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-base text-slate-900 dark:text-white">
                  {event.name}
                </p>
                <p className="text-xs opacity-75 mt-0.5 font-semibold">{formatEventDate(event.event_date)}</p>
              </div>
              <EventStatusBadge status={event.status} />
            </div>
            
            {event.description ? (
              <p className="text-xs opacity-70 line-clamp-2 leading-relaxed font-medium">{event.description}</p>
            ) : null}
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 text-xs">
              <span className="opacity-60">Koordinator:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {usersById.get(event.coordinator_id)?.name ?? "Belum ada"}
              </span>
              <span className="mx-0.5 opacity-30">|</span>
              <span className="opacity-60">Progress:</span>
              <span className="font-black text-slate-900 dark:text-slate-100">{event.progress_percentage ?? 0}%</span>
              <span className="mx-0.5 opacity-30">|</span>
              <span className="opacity-60">Anggota:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{memberCounts[event.id] ?? 0}</span>
            </div>
            
            <div className="flex gap-2 pt-3 border-t border-dashed border-neutral-300 dark:border-neutral-700">
              <Button asChild size="sm" variant="secondary" className="flex-1 text-xs font-bold py-1.5 h-auto">
                <Link href={`/dashboard/events/${event.id}`}>Detail</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="warning"
                className="flex-1 text-xs font-bold py-1.5 h-auto"
                onClick={() => onEdit(event)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
