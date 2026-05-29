import { USER_ROLES } from "@/lib/roles";
import type { Event, Task, UserProfile, UserRole } from "@/types";

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

export function canManageEvent(
  profile: UserProfile | null | undefined,
  event: Event | null | undefined,
) {
  if (!profile || !event) {
    return false;
  }

  return (
    isSuperAdmin(profile) ||
    isKoordinatorDivisi(profile) ||
    (isKoordinatorAcara(profile) && event.coordinator_id === profile.id)
  );
}

export function canCreateTask(input: UserProfile | UserRole | null | undefined) {
  return isSuperAdmin(input) || isKoordinatorDivisi(input) || isKoordinatorAcara(input);
}

export function canManageTask(
  profile: UserProfile | null | undefined,
  task: Task | null | undefined,
) {
  if (!profile || !task) {
    return false;
  }

  return (
    isSuperAdmin(profile) ||
    isKoordinatorDivisi(profile) ||
    (isKoordinatorAcara(profile) &&
      task.type === "acara" &&
      task.coordinator_id === profile.id)
  );
}

export function canReadTask(
  profile: UserProfile | null | undefined,
  task: Task | null | undefined,
) {
  if (!profile || !task) {
    return false;
  }

  return canManageTask(profile, task) || task.pic_id === profile.id;
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
