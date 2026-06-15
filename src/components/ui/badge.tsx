import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "info" | "success" | "warning" | "error" | "neutral" | "orange" | "purple" | "cyan";

const variants: Record<BadgeVariant, string> = {
  default: "jd-neo-badge bg-sky-600 border-sky-600 text-white",
  neutral: "jd-neo-badge jd-neo-badge-gray",
  info: "jd-neo-badge jd-neo-badge-blue",
  success: "jd-neo-badge jd-neo-badge-green",
  warning: "jd-neo-badge jd-neo-badge-yellow",
  error: "jd-neo-badge jd-neo-badge-red",
  orange: "jd-neo-badge jd-neo-badge-orange",
  purple: "jd-neo-badge jd-neo-badge-purple",
  cyan: "jd-neo-badge jd-neo-badge-cyan",
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
