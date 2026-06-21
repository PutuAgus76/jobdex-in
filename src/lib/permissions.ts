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
  eventRole?: string,
) {
  if (!profile || !event) {
    return false;
  }

  const role = getRole(profile);
  const normalizedRole = eventRole?.toLowerCase().replace(/\s+/g, "_");

  if (role === "super_admin") {
    return true;
  }

  // Event coordinator can manage
  if (normalizedRole === "koordinator_acara" || event.coordinator_id === profile.id) {
    return true;
  }

  // Koordinator divisi can manage unless their event role is anggota_acara or sekretaris_acara
  if (role === "koordinator_divisi") {
    return normalizedRole !== "anggota_acara" && normalizedRole !== "sekretaris_acara";
  }

  return false;
}

export function canCreateTask(
  profile: UserProfile | UserRole | null | undefined,
  eventRole?: string,
) {
  if (!profile) return false;
  const role = getRole(profile);
  const normalizedRole = eventRole?.toLowerCase().replace(/\s+/g, "_");

  if (role === "super_admin") return true;

  if (normalizedRole === "koordinator_acara" || normalizedRole === "sekretaris_acara") {
    return true;
  }

  if (role === "koordinator_divisi") {
    return normalizedRole !== "anggota_acara";
  }

  return false;
}

export function canManageTask(
  profile: UserProfile | null | undefined,
  task: Task | null | undefined,
  eventRole?: string,
) {
  if (!profile || !task) {
    return false;
  }

  const role = getRole(profile);
  const normalizedRole = eventRole?.toLowerCase().replace(/\s+/g, "_");

  if (role === "super_admin") return true;

  if (task.type === "acara") {
    if (normalizedRole === "koordinator_acara" || normalizedRole === "sekretaris_acara" || task.coordinator_id === profile.id) {
      return true;
    }
    if (role === "koordinator_divisi") {
      return normalizedRole !== "anggota_acara" && normalizedRole !== "sekretaris_acara";
    }
  } else {
    // Division tasks
    if (role === "koordinator_divisi") return true;
  }

  return false;
}

export function canReadTask(
  profile: UserProfile | null | undefined,
  task: Task | null | undefined,
  eventRole?: string,
) {
  if (!profile || !task) {
    return false;
  }

  return canManageTask(profile, task, eventRole) || task.pic_id === profile.id;
}

export function canApproveTask(
  input: UserProfile | UserRole | null | undefined,
  eventRole?: string,
) {
  if (!input) return false;
  const role = getRole(input);
  const normalizedRole = eventRole?.toLowerCase().replace(/\s+/g, "_");

  if (role === "super_admin") return true;

  if (normalizedRole) {
    if (normalizedRole === "koordinator_acara") return true;
    if (role === "koordinator_divisi") {
      return normalizedRole !== "anggota_acara" && normalizedRole !== "sekretaris_acara";
    }
    return false;
  }

  return isSuperAdmin(input) || isKoordinatorDivisi(input) || isKoordinatorAcara(input);
}

export function canAccessAI(input: UserProfile | UserRole | null | undefined) {
  if (!input) return false;
  const role = typeof input === "string" ? input : input.role;
  return !!role; // All authenticated users with a role can access AI
}

export function canAccessAIFull(input: UserProfile | UserRole | null | undefined) {
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

export function formatEventRole(role?: string): string {
  if (!role) return "Anggota acara";
  const lower = role.toLowerCase().replace(/\s+/g, "_");
  if (lower === "koordinator_acara" || lower === "koordinator") return "Koordinator acara";
  if (lower === "sekretaris_acara" || lower === "sekretaris") return "Sekretaris acara";
  if (lower === "anggota_acara" || lower === "anggota") return "Anggota acara";
  return role;
}

