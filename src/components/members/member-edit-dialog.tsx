"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { USER_ROLE_OPTIONS } from "@/lib/roles";
import { X, Save } from "lucide-react";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";
import type { MemberUpdateInput, UserProfile, UserRole } from "@/types";

type MemberEditDialogProps = {
  member: UserProfile | null;
  currentUserProfile: UserProfile;
  onClose: () => void;
  onSave: (memberId: string, input: MemberUpdateInput) => Promise<void>;
};

type MemberEditFormProps = {
  member: UserProfile;
  currentUserProfile: UserProfile;
  onClose: () => void;
  onSave: (memberId: string, input: MemberUpdateInput) => Promise<void>;
};

const selectClassName =
  "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-800 dark:disabled:text-slate-400";

export function MemberEditDialog({
  member,
  currentUserProfile,
  onClose,
  onSave,
}: MemberEditDialogProps) {
  if (!member) {
    return null;
  }

  return (
    <MemberEditForm
      key={member.id}
      member={member}
      currentUserProfile={currentUserProfile}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function MemberEditForm({
  member,
  currentUserProfile,
  onClose,
  onSave,
}: MemberEditFormProps) {
  const [name, setName] = useState(member.name ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    member.whatsapp_number ?? "",
  );
  const [whatsappCommandPin, setWhatsappCommandPin] = useState(
    member.whatsapp_command_pin ?? "",
  );
  const [role, setRole] = useState<UserRole>(member.role ?? "anggota");
  const [divisionId, setDivisionId] = useState(
    member.division_id || "humas_media_kreatif",
  );
  const [isActive, setIsActive] = useState(Boolean(member.is_active));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canEditRole = currentUserProfile.role === "super_admin";
  const isSelf = member.id === currentUserProfile.id;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const normalizedWhatsapp = normalizeWhatsAppNumber(whatsappNumber);

    if (!trimmedName) {
      setError("Nama wajib diisi.");
      return;
    }

    if (!isValidWhatsAppNumber(normalizedWhatsapp)) {
      setError("Nomor WhatsApp wajib dan gunakan format 08xx, 628xx, atau +628xx.");
      return;
    }

    if (!divisionId.trim()) {
      setError("Divisi wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(member.id, {
        name: trimmedName,
        whatsapp_number: normalizedWhatsapp,
        role,
        division_id: divisionId.trim(),
        is_active: isSelf ? true : isActive,
        whatsapp_command_pin: whatsappCommandPin.trim(),
      });
      onClose();
    } catch {
      setError("Gagal menyimpan perubahan anggota.");
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
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Edit anggota</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
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
              htmlFor="member-name"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nama
            </label>
            <Input
              id="member-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="member-whatsapp"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nomor WhatsApp
            </label>
            <Input
              id="member-whatsapp"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label
              htmlFor="member-whatsapp-pin"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              PIN Perintah WhatsApp (6 Digit)
            </label>
            <Input
              id="member-whatsapp-pin"
              value={whatsappCommandPin}
              onChange={(event) => setWhatsappCommandPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Contoh: 123456"
              maxLength={6}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Digunakan untuk memvalidasi eksekusi perintah WhatsApp group (Fase 12C).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="member-role"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Role
              </label>
              <select
                id="member-role"
                className={selectClassName}
                value={role}
                disabled={!canEditRole}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!canEditRole ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Koordinator divisi tidak dapat mengubah role pada fase ini.
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="member-division"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Divisi
              </label>
              <Input
                id="member-division"
                value={divisionId}
                onChange={(event) => setDivisionId(event.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isSelf ? true : isActive}
              disabled={isSelf}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Akun aktif
          </label>
          {isSelf ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Untuk mencegah terkunci, akun sendiri tidak dapat dinonaktifkan
              dari UI ini.
            </p>
          ) : null}

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
              {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
