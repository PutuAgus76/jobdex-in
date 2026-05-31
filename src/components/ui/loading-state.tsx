import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LoadingState({
  title = "Memuat data...",
  description = "Sebentar, JobDex.in sedang mengambil informasi terbaru.",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 items-center justify-center px-4 text-center jd-surface",
        className,
      )}
    >
      <div>
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950 dark:border-slate-800 dark:border-t-slate-50" />
        <p className="mt-4 text-sm font-bold">{title}</p>
        <p className="mt-2 text-sm opacity-75">{description}</p>
      </div>
    </div>
  );
}
