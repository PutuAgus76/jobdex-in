import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "info" | "success" | "warning";

const variants: Record<BadgeVariant, string> = {
  default: "jd-neo-badge jd-neo-badge-gray",
  info: "jd-neo-badge jd-neo-badge-blue",
  success: "jd-neo-badge jd-neo-badge-green",
  warning: "jd-neo-badge jd-neo-badge-yellow",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
