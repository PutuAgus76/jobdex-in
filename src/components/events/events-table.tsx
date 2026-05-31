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
    <div className="overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500 dark:text-slate-400">
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
  );
}
