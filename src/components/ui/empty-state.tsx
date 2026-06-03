import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-8 text-center jd-neo-card bg-[var(--secondary-background)] text-[var(--foreground)]",
        className,
      )}
    >
      <p className="text-sm font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 opacity-75">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
