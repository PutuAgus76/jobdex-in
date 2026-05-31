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
      <div className="hidden md:block overflow-hidden jd-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Divisi</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Bergabung</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {members.map((member) => (
                <tr key={member.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-950">
                  <td className="px-4 py-4 font-semibold text-slate-950 dark:text-slate-50">
                    {member.name || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{member.email || "-"}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {member.whatsapp_number || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {member.division_id || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <MemberStatusBadge isActive={member.is_active} />
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onView(member)}
                      >
                        Detail
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={member.is_active ? "warning" : "success"}
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
          <div key={member.id} className="p-4 jd-surface space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-base text-slate-950 dark:text-slate-50">
                  {member.name || "-"}
                </p>
                <p className="text-xs opacity-70 truncate max-w-[240px]">{member.email || "-"}</p>
              </div>
              <MemberStatusBadge isActive={member.is_active} />
            </div>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 text-xs">
              <span className="opacity-60">Role:</span>
              <RoleBadge role={member.role} />
              <span className="mx-0.5 opacity-30">|</span>
              <span className="opacity-60">Divisi:</span>
              <span className="font-semibold text-slate-950 dark:text-slate-50 capitalize">
                {member.division_id?.replace(/_/g, " ") || "-"}
              </span>
            </div>
            
            <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 space-y-3">
              <p className="text-xs opacity-80">
                WhatsApp: <span className="font-semibold">{member.whatsapp_number || "-"}</span>
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="flex-1 min-w-[70px]"
                  onClick={() => onView(member)}
                >
                  Detail
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="flex-1 min-w-[70px]"
                  onClick={() => onEdit(member)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={member.is_active ? "warning" : "success"}
                  className="w-full sm:w-auto"
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
