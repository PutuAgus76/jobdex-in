import { Badge } from "@/components/ui/badge";
import type { ApprovalStatus } from "@/types";

const labels: Record<ApprovalStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  need_revision: "Perlu Revisi",
};

export function TaskApprovalBadge({ status }: { status?: ApprovalStatus }) {
  const value = status ?? "pending";
  const variant =
    value === "approved"
      ? "success"
      : value === "need_revision"
      ? "orange"
      : "info";

  return <Badge variant={variant}>{labels[value]}</Badge>;
}
