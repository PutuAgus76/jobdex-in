"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EVENT_STATUS_OPTIONS } from "@/lib/event-status";
import { getDateInputValue } from "@/lib/firebase/events";
import type { Event, EventInput, EventStatus, UserProfile } from "@/types";

type EventFormDialogProps = {
  event: Event | null;
  open: boolean;
  coordinators: UserProfile[];
  fallbackCoordinatorId: string;
  onClose: () => void;
  onSave: (input: EventInput, eventId?: string) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export function EventFormDialog(props: EventFormDialogProps) {
  if (!props.open) {
    return null;
  }

  return <EventForm key={props.event?.id ?? "new"} {...props} />;
}

function EventForm({
  event,
  coordinators,
  fallbackCoordinatorId,
  onClose,
  onSave,
}: EventFormDialogProps) {
  const [name, setName] = useState(event?.name ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventDate, setEventDate] = useState(
    event ? getDateInputValue(event.event_date) : "",
  );
  const [coordinatorId, setCoordinatorId] = useState(
    event?.coordinator_id ?? fallbackCoordinatorId,
  );
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "persiapan");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama acara wajib diisi.");
      return;
    }

    if (!eventDate) {
      setError("Tanggal acara wajib diisi.");
      return;
    }

    if (!coordinatorId) {
      setError("Koordinator acara wajib dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim(),
          event_date: eventDate,
          coordinator_id: coordinatorId,
          status,
        },
        event?.id,
      );
      onClose();
    } catch {
      setError("Gagal menyimpan acara. Periksa izin akses dan Firestore Rules.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[8px] bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {event ? "Edit acara" : "Tambah acara"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Progress acara tetap memakai nilai tersimpan pada fase ini.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="event-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nama acara
            </label>
            <Input
              id="event-name"
              value={name}
              onChange={(item) => setName(item.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="event-description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Deskripsi
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(item) => setDescription(item.target.value)}
              className="min-h-28 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="event-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Tanggal acara
              </label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(item) => setEventDate(item.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="event-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="event-status"
                className={selectClassName}
                value={status}
                onChange={(item) => setStatus(item.target.value as EventStatus)}
              >
                {EVENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="event-coordinator"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Koordinator acara
            </label>
            <select
              id="event-coordinator"
              className={selectClassName}
              value={coordinatorId}
              onChange={(item) => setCoordinatorId(item.target.value)}
            >
              {coordinators.map((coordinator) => (
                <option key={coordinator.id} value={coordinator.id}>
                  {coordinator.name || coordinator.email}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan acara"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
