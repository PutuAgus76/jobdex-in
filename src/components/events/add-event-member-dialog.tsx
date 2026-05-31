"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EventMember, UserProfile } from "@/types";

type AddEventMemberDialogProps = {
  open: boolean;
  users: UserProfile[];
  eventMembers: EventMember[];
  onClose: () => void;
  onAdd: (userId: string, roleInEvent: string) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 outline-none transition-colors focus:border-slate-400 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800";

export function AddEventMemberDialog({
  open,
  users,
  eventMembers,
  onClose,
  onAdd,
}: AddEventMemberDialogProps) {
  const [userId, setUserId] = useState("");
  const [roleInEvent, setRoleInEvent] = useState("Anggota acara");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const existingUserIds = useMemo(
    () => new Set(eventMembers.map((member) => member.user_id)),
    [eventMembers],
  );
  const availableUsers = users.filter((user) => !existingUserIds.has(user.id));

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!userId) {
      setError("Pilih anggota terlebih dahulu.");
      return;
    }

    if (!roleInEvent.trim()) {
      setError("Role dalam acara wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd(userId, roleInEvent.trim());
      onClose();
    } catch {
      setError("Gagal menambahkan anggota acara.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-[8px] bg-white dark:bg-slate-900 shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
                Tambah anggota acara
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Anggota yang sudah masuk acara tidak ditampilkan lagi.
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
              htmlFor="event-member-user"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Anggota
            </label>
            <select
              id="event-member-user"
              className={selectClassName}
              value={userId}
              onChange={(item) => setUserId(item.target.value)}
            >
              <option value="">Pilih anggota</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="role-in-event"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Role dalam acara
            </label>
            <Input
              id="role-in-event"
              value={roleInEvent}
              onChange={(item) => setRoleInEvent(item.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !availableUsers.length}>
              {isSubmitting ? "Menambahkan..." : "Tambah anggota"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
