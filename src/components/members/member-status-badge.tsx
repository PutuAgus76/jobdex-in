import { Badge } from "@/components/ui/badge";

type MemberStatusBadgeProps = {
  isActive?: boolean;
};

export function MemberStatusBadge({ isActive }: MemberStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "success" : "warning"}>
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}
