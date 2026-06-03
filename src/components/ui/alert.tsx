import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "destructive" | "warning" | "success";

const variantClasses: Record<AlertVariant, string> = {
  default: "bg-main text-main-foreground",
  destructive: "bg-[var(--jd-neo-red)] text-neutral-950",
  warning: "bg-[var(--jd-neo-yellow)] text-neutral-950",
  success: "bg-[var(--jd-neo-green)] text-neutral-950",
};

export function Alert({
  className,
  variant = "default",
  ...props
}: ComponentPropsWithoutRef<"div"> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-base border-2 border-border p-4 text-sm flex gap-3.5 items-start shadow-shadow",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <h5
      className={cn(
        "font-heading font-black tracking-tight leading-none text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "text-xs font-medium leading-relaxed [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
