import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "info" | "success" | "warning";

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
