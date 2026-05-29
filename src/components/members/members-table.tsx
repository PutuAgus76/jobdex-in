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
    <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
          <tbody className="divide-y divide-slate-200">
            {members.map((member) => (
              <tr key={member.id} className="align-top">
                <td className="px-4 py-4 font-semibold text-slate-950">
                  {member.name || "-"}
                </td>
                <td className="px-4 py-4 text-slate-600">{member.email || "-"}</td>
                <td className="px-4 py-4 text-slate-600">
                  {member.whatsapp_number || "-"}
                </td>
                <td className="px-4 py-4">
                  <RoleBadge role={member.role} />
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {member.division_id || "-"}
                </td>
                <td className="px-4 py-4">
                  <MemberStatusBadge isActive={member.is_active} />
                </td>
                <td className="px-4 py-4 text-slate-600">
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
                      className={
                        member.is_active
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }
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
  );
}
