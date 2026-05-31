"use client";

import { useState } from "react";
import { AddEventMemberDialog } from "@/components/events/add-event-member-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/role-badge";
import type { EventMember, UserProfile } from "@/types";

type EventMembersManagerProps = {
  eventId: string;
  eventMembers: EventMember[];
  users: UserProfile[];
  canManage: boolean;
  onAdd: (userId: string, roleInEvent: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
};

export function EventMembersManager({
  eventMembers,
  users,
  canManage,
  onAdd,
  onRemove,
}: EventMembersManagerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Anggota acara</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola anggota yang terlibat pada acara ini.
          </p>
        </div>
        {canManage ? (
          <Button type="button" onClick={() => setAddOpen(true)}>
            Tambah anggota
          </Button>
        ) : null}
      </div>

      {eventMembers.length === 0 ? (
        <EmptyState
          title="Belum ada anggota acara"
          description="Tambahkan anggota yang terlibat agar koordinasi acara lebih jelas."
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role akun</th>
                <th className="px-4 py-3 font-semibold">Role acara</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {eventMembers.map((member) => {
                const user = usersById.get(member.user_id);

                return (
                  <tr key={member.id}>
                    <td className="px-4 py-4 font-semibold text-slate-950 dark:text-slate-50">
                      {user?.name ?? "Anggota tidak ditemukan"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {user?.email ?? member.user_id}
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user?.role} />
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {member.role_in_event || "-"}
                    </td>
                    <td className="px-4 py-4">
                      {canManage ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => onRemove(member.user_id)}
                        >
                          Hapus
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddEventMemberDialog
        open={addOpen}
        users={users}
        eventMembers={eventMembers}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
      />
    </div>
  );
}
