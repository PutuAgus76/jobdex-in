"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EVENT_STATUS_OPTIONS } from "@/lib/event-status";
import { getDateInputValue } from "@/lib/firebase/events";
import { NeoDatePicker } from "@/components/ui/neo-date-picker";
import { X, Save } from "lucide-react";
import type { Event, EventInput, EventStatus, UserProfile, EventMember } from "@/types";

type EventFormDialogProps = {
  event: Event | null;
  open: boolean;
  coordinators: UserProfile[];
  fallbackCoordinatorId: string;
  onClose: () => void;
  onSave: (input: EventInput, eventId?: string) => Promise<void>;
  users: UserProfile[];
  eventMembers: EventMember[];
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

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
  users,
  eventMembers,
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
  const [whatsappGroupId, setWhatsappGroupId] = useState(event?.whatsapp_group_id ?? "");
  const [whatsappGroupName, setWhatsappGroupName] = useState(event?.whatsapp_group_name ?? "");
  
  const [secretaryId, setSecretaryId] = useState(() => {
    if (!event || !eventMembers) return "";
    const sec = eventMembers.find((m) => {
      const r = m.role_in_event?.toLowerCase() || "";
      return r === "sekretaris_acara" || r === "sekretaris acara" || r === "sekretaris";
    });
    return sec?.user_id ?? "";
  });

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => {
    if (!event || !eventMembers) return [];
    const coordId = event.coordinator_id;
    const sec = eventMembers.find((m) => {
      const r = m.role_in_event?.toLowerCase() || "";
      return r === "sekretaris_acara" || r === "sekretaris acara" || r === "sekretaris";
    });
    const secId = sec?.user_id;
    return eventMembers
      .filter((m) => m.user_id !== coordId && m.user_id !== secId)
      .map((m) => m.user_id);
  });

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
          whatsapp_group_id: whatsappGroupId.trim(),
          whatsapp_group_name: whatsappGroupName.trim(),
          secretary_id: secretaryId,
          initial_member_ids: selectedMemberIds,
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
      <div className="w-full max-w-2xl rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
                {event ? "Edit acara" : "Tambah acara"}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Progress acara tetap memakai nilai tersimpan pada fase ini.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              Tutup
            </Button>
          </div>
        </div>

        <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="event-name"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Deskripsi
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(item) => setDescription(item.target.value)}
              className="min-h-28 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="event-date"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Tanggal acara
              </label>
              <NeoDatePicker
                id="event-date"
                value={eventDate}
                onChange={setEventDate}
              />
            </div>

            <div>
              <label
                htmlFor="event-status"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
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

          <div>
            <label
              htmlFor="event-secretary"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Sekretaris acara
            </label>
            <select
              id="event-secretary"
              className={selectClassName}
              value={secretaryId}
              onChange={(item) => setSecretaryId(item.target.value)}
            >
              <option value="">Pilih sekretaris acara (opsional)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
            {coordinatorId === secretaryId && coordinatorId && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Warning: Koordinator dan sekretaris sebaiknya orang berbeda.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Anggota acara
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-[8px] bg-white dark:bg-slate-950 p-3 space-y-2">
              {users.filter(u => u.id !== coordinatorId && u.id !== secretaryId).map((u) => {
                const isChecked = selectedMemberIds.includes(u.id);
                return (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMemberIds([...selectedMemberIds, u.id]);
                        } else {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== u.id));
                        }
                      }}
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{u.name || u.email}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              WhatsApp Group (Opsional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-wa-group-id"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  ID Grup WhatsApp Acara
                </label>
                <Input
                  id="event-wa-group-id"
                  value={whatsappGroupId}
                  onChange={(item) => {
                    const val = item.target.value.replace(/\D/g, "");
                    setWhatsappGroupId(val);
                  }}
                  placeholder="Contoh: 120363406824082148"
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Isi jika acara ini punya grup WhatsApp khusus. Reminder event akan dikirim ke grup ini.
                </p>
              </div>
              <div>
                <label
                  htmlFor="event-wa-group-name"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Nama Grup (opsional)
                </label>
                <Input
                  id="event-wa-group-name"
                  value={whatsappGroupName}
                  onChange={(item) => setWhatsappGroupName(item.target.value)}
                  placeholder="Contoh: Grup Rapat Kerja 2026"
                />
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan acara"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
