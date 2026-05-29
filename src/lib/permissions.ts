import { USER_ROLES } from "@/lib/roles";
import type { UserProfile, UserRole } from "@/types";

function getRole(input: UserProfile | UserRole | null | undefined) {
  if (!input) {
    return null;
  }

  return typeof input === "string" ? input : input.role;
}

export function isSuperAdmin(input: UserProfile | UserRole | null | undefined) {
  return getRole(input) === USER_ROLES.SUPER_ADMIN;
}

export function isKoordinatorDivisi(
  input: UserProfile | UserRole | null | undefined,
) {
  return getRole(input) === USER_ROLES.KOORDINATOR_DIVISI;
}

export function isKoordinatorAcara(
  input: UserProfile | UserRole | null | undefined,
) {
  return getRole(input) === USER_ROLES.KOORDINATOR_ACARA;
}

export function isKoordinator(
  input: UserProfile | UserRole | null | undefined,
) {
  return isSuperAdmin(input) || isKoordinatorDivisi(input) || isKoordinatorAcara(input);
}

export function isAnggota(input: UserProfile | UserRole | null | undefined) {
  return getRole(input) === USER_ROLES.ANGGOTA;
}

export function canManageMembers(
  input: UserProfile | UserRole | null | undefined,
) {
  return isSuperAdmin(input) || isKoordinatorDivisi(input);
}

export function canCreateEvent(
  input: UserProfile | UserRole | null | undefined,
) {
  return isKoordinator(input);
}

export function canCreateTask(input: UserProfile | UserRole | null | undefined) {
  return isSuperAdmin(input) || isKoordinatorDivisi(input) || isKoordinatorAcara(input);
}

export function canApproveTask(
  input: UserProfile | UserRole | null | undefined,
) {
  return isSuperAdmin(input) || isKoordinatorDivisi(input) || isKoordinatorAcara(input);
}

export function canAccessAI(input: UserProfile | UserRole | null | undefined) {
  return isKoordinator(input);
}

export function isUserProfileComplete(profile: UserProfile | null | undefined) {
  return Boolean(
    profile?.id &&
      profile.organization_id &&
      profile.name &&
      profile.email &&
      profile.whatsapp_number &&
      profile.role &&
      profile.division_id &&
      typeof profile.is_active === "boolean",
  );
}
