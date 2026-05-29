import type { UserRole } from "@/types";

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  KOORDINATOR_DIVISI: "koordinator_divisi",
  KOORDINATOR_ACARA: "koordinator_acara",
  ANGGOTA: "anggota",
} as const satisfies Record<string, UserRole>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  koordinator_divisi: "Koordinator Divisi",
  koordinator_acara: "Koordinator Acara",
  anggota: "Anggota",
};
