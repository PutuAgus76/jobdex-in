import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "info" | "success" | "warning" | "error" | "neutral" | "orange" | "purple" | "cyan";

const variants: Record<BadgeVariant, string> = {
  default: "jd-neo-badge bg-main text-main-foreground",
  neutral: "jd-neo-badge bg-secondary-background text-foreground",
  info: "jd-neo-badge bg-[var(--jd-neo-blue)] text-neutral-950",
  success: "jd-neo-badge bg-[var(--jd-neo-green)] text-neutral-950",
  warning: "jd-neo-badge bg-[var(--jd-neo-yellow)] text-neutral-950",
  error: "jd-neo-badge bg-[var(--jd-neo-red)] text-neutral-950",
  orange: "jd-neo-badge bg-[var(--jd-neo-orange)] text-neutral-950",
  purple: "jd-neo-badge bg-[var(--jd-neo-purple)] text-neutral-950",
  cyan: "jd-neo-badge bg-[var(--jd-neo-cyan)] text-neutral-950",
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
