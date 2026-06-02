"use client";

import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { MemberStatusBadge } from "@/components/members/member-status-badge";
import type { UserProfile } from "@/types";

type MembersTableProps = {
  members: UserProfile[];
  onView: (member: UserProfile) => void;
  onEdit: (member: UserProfile) => void;
  onToggleStatus: (member: UserProfile) => void;
};

function formatDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format((value as { toDate: () => Date }).toDate());
}

export function MembersTable({
  members,
  onView,
  onEdit,
  onToggleStatus,
}: MembersTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden jd-neo-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Divisi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Bergabung</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-950 dark:divide-neutral-800">
              {members.map((member) => (
                <tr key={member.id} className="align-middle hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-4 font-black text-slate-900 dark:text-slate-50">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "User")}&background=ffd0b5&color=1a1a1a&bold=true&rounded=true`}
                        alt={member.name || "User"}
                        className="size-8 rounded-full border-2 border-neutral-950 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] shrink-0"
                      />
                      <span>{member.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-300">{member.email || "-"}</td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-300">
                    {member.whatsapp_number || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-300">
                    {member.division_id || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <MemberStatusBadge isActive={member.is_active} />
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-650 dark:text-slate-300">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="text-xs font-bold py-1 h-auto"
                        onClick={() => onView(member)}
                      >
                        Detail
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="warning"
                        className="text-xs font-bold py-1 h-auto"
                        onClick={() => onEdit(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={member.is_active ? "destructive" : "success"}
                        className="text-xs font-bold py-1 h-auto"
                        onClick={() => onToggleStatus(member)}
                      >
                        {member.is_active ? "Nonaktifkan" : "Aktifkan"}
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
        {members.map((member) => (
          <div key={member.id} className="p-4 jd-neo-card space-y-3 m-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "User")}&background=ffd0b5&color=1a1a1a&bold=true&rounded=true`}
                  alt={member.name || "User"}
                  className="size-10 rounded-full border-2 border-neutral-950 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] shrink-0"
                />
                <div>
                  <p className="font-black text-base text-slate-900 dark:text-white">
                    {member.name || "-"}
                  </p>
                  <p className="text-xs opacity-70 truncate max-w-[180px] font-semibold">{member.email || "-"}</p>
                </div>
              </div>
              <MemberStatusBadge isActive={member.is_active} />
            </div>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 text-xs">
              <span className="opacity-60">Role:</span>
              <RoleBadge role={member.role} />
              <span className="mx-0.5 opacity-30">|</span>
              <span className="opacity-60">Divisi:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                {member.division_id?.replace(/_/g, " ") || "-"}
              </span>
            </div>
            
            <div className="pt-3 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
              <p className="text-xs opacity-80 font-semibold">
                WhatsApp: <span className="font-bold">{member.whatsapp_number || "-"}</span>
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="flex-1 min-w-[70px] text-xs font-bold py-1.5 h-auto"
                  onClick={() => onView(member)}
                >
                  Detail
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="warning"
                  className="flex-1 min-w-[70px] text-xs font-bold py-1.5 h-auto"
                  onClick={() => onEdit(member)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={member.is_active ? "destructive" : "success"}
                  className="w-full sm:w-auto text-xs font-bold py-1.5 h-auto"
                  onClick={() => onToggleStatus(member)}
                >
                  {member.is_active ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
