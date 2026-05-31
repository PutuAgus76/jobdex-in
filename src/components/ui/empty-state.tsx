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
        "rounded-[8px] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50",
        className,
      )}
    >
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
