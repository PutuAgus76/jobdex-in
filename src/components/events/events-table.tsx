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
      <div className="hidden md:block overflow-hidden jd-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama acara</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Koordinator</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
                <th className="px-4 py-3 font-semibold">Anggota</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {events.map((event) => (
                <tr key={event.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-950">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{event.name}</p>
                    <p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                      {event.description || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {formatEventDate(event.event_date)}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {usersById.get(event.coordinator_id)?.name ??
                      "Koordinator belum ditemukan"}
                  </td>
                  <td className="px-4 py-4">
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {event.progress_percentage ?? 0}%
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {memberCounts[event.id] ?? 0}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/events/${event.id}`}>Detail</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
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
          <div key={event.id} className="p-4 jd-surface space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-base text-slate-950 dark:text-slate-50">
                  {event.name}
                </p>
                <p className="text-xs opacity-75 mt-0.5">{formatEventDate(event.event_date)}</p>
              </div>
              <EventStatusBadge status={event.status} />
            </div>
            
            {event.description ? (
              <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">{event.description}</p>
            ) : null}
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 text-xs">
              <span className="opacity-60">Koordinator:</span>
              <span className="font-semibold text-slate-950 dark:text-slate-50">
                {usersById.get(event.coordinator_id)?.name ?? "Belum ada"}
              </span>
              <span className="mx-0.5 opacity-30">|</span>
              <span className="opacity-60">Progress:</span>
              <span className="font-bold text-slate-950 dark:text-slate-50">{event.progress_percentage ?? 0}%</span>
              <span className="mx-0.5 opacity-30">|</span>
              <span className="opacity-60">Anggota:</span>
              <span className="font-semibold text-slate-950 dark:text-slate-50">{memberCounts[event.id] ?? 0}</span>
            </div>
            
            <div className="flex gap-2 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800">
              <Button asChild size="sm" variant="secondary" className="flex-1">
                <Link href={`/dashboard/events/${event.id}`}>Detail</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="flex-1"
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
