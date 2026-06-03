import { Badge } from "@/components/ui/badge";
import { USER_ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/types";

type RoleBadgeProps = {
  role?: UserRole | null;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) {
    return <Badge>Profil belum lengkap</Badge>;
  }

  const variant =
    role === "super_admin"
      ? "purple"
      : role === "koordinator_divisi"
      ? "orange"
      : role === "koordinator_acara"
      ? "cyan"
      : "info";

  return <Badge variant={variant}>{USER_ROLE_LABELS[role]}</Badge>;
}
