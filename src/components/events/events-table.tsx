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
    <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
          <tbody className="divide-y divide-slate-200">
            {events.map((event) => (
              <tr key={event.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-950">{event.name}</p>
                  <p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500">
                    {event.description || "-"}
                  </p>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {formatEventDate(event.event_date)}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {usersById.get(event.coordinator_id)?.name ??
                    "Koordinator belum ditemukan"}
                </td>
                <td className="px-4 py-4">
                  <EventStatusBadge status={event.status} />
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {event.progress_percentage ?? 0}%
                </td>
                <td className="px-4 py-4 text-slate-600">
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
