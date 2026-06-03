import { Badge } from "@/components/ui/badge";

type MemberStatusBadgeProps = {
  isActive?: boolean;
};

export function MemberStatusBadge({ isActive }: MemberStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "success" : "error"}>
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}
