import { Badge } from "@/components/ui/badge";
import type { ApprovalStatus } from "@/types";

const labels: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  need_revision: "Need Revision",
};

export function TaskApprovalBadge({ status }: { status?: ApprovalStatus }) {
  const value = status ?? "pending";
  const variant = value === "approved" ? "success" : value === "need_revision" ? "warning" : "default";

  return <Badge variant={variant}>{labels[value]}</Badge>;
}
