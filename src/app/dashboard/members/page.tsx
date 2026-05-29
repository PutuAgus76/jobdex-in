"use client";

import { useEffect, useMemo, useState } from "react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { MemberDetailDialog } from "@/components/members/member-detail-dialog";
import { MemberEditDialog } from "@/components/members/member-edit-dialog";
import {
  MemberFilters,
  type MemberStatusFilter,
} from "@/components/members/member-filters";
import { MembersTable } from "@/components/members/members-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import { getMembers, updateMember } from "@/lib/firebase/members";
import { canManageMembers } from "@/lib/permissions";
import type { MemberUpdateInput, UserProfile, UserRole } from "@/types";

export default function MembersPage() {
  return (
    <PermissionGuard canAccess={canManageMembers}>
      <MembersManagement />
    </PermissionGuard>
  );
}

function MembersManagement() {
  const { reloadUserProfile, userProfile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [selectedDetail, setSelectedDetail] = useState<UserProfile | null>(null);
  const [selectedEdit, setSelectedEdit] = useState<UserProfile | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const data = await getMembers();
      setMembers(data);
    } catch {
      setError("Gagal mengambil daftar anggota. Periksa koneksi dan Firestore Rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadMembers);
  }, []);

  const divisions = useMemo(() => {
    return Array.from(
      new Set(
        members
          .map((member) => member.division_id)
          .filter((divisionId): divisionId is string => Boolean(divisionId)),
      ),
    ).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && member.is_active) ||
        (statusFilter === "inactive" && !member.is_active);
      const matchesDivision =
        divisionFilter === "all" || member.division_id === divisionFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDivision;
    });
  }, [divisionFilter, members, roleFilter, search, statusFilter]);

  async function handleSaveMember(memberId: string, input: MemberUpdateInput) {
    if (!userProfile) {
      return;
    }

    const canUpdateRole = userProfile.role === "super_admin";
    await updateMember(memberId, input, canUpdateRole);
    await loadMembers();

    if (memberId === userProfile.id) {
      await reloadUserProfile();
    }
  }

  async function handleToggleStatus(member: UserProfile) {
    if (!userProfile || member.id === userProfile.id) {
      return;
    }

    if (userProfile.role !== "super_admin" && member.role === "super_admin") {
      setError("Koordinator divisi tidak dapat mengubah status super admin.");
      return;
    }

    await handleSaveMember(member.id, {
      name: member.name || "-",
      whatsapp_number: member.whatsapp_number || "",
      role: member.role,
      division_id: member.division_id || "humas_media_kreatif",
      is_active: !member.is_active,
    });
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge variant="info">Manajemen Anggota</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Manajemen Anggota
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Kelola profil dasar, role, divisi, dan status aktif anggota
            organisasi.
          </p>
        </div>
        <div className="rounded-[8px] border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Total anggota</p>
          <p className="text-2xl font-bold text-slate-950">{members.length}</p>
        </div>
      </section>

      <MemberFilters
        search={search}
        role={roleFilter}
        status={statusFilter}
        division={divisionFilter}
        divisions={divisions}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onDivisionChange={setDivisionFilter}
      />

      {error ? (
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <LoadingState title="Memuat daftar anggota..." />
      ) : members.length === 0 ? (
        <EmptyState
          title="Belum ada anggota"
          description="Collection users belum berisi anggota atau akun Anda belum memiliki izin membaca daftar anggota."
        />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          title="Tidak ada anggota yang cocok"
          description="Coba ubah kata kunci pencarian atau filter yang digunakan."
        />
      ) : (
        <MembersTable
          members={filteredMembers}
          onView={setSelectedDetail}
          onEdit={(member) => {
            if (userProfile.role !== "super_admin" && member.role === "super_admin") {
              setError("Koordinator divisi tidak dapat mengedit super admin.");
              return;
            }

            setSelectedEdit(member);
          }}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <MemberDetailDialog
        member={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
      <MemberEditDialog
        member={selectedEdit}
        currentUserProfile={userProfile}
        onClose={() => setSelectedEdit(null)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
