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
        "flex min-h-48 items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 text-center",
        className,
      )}
    >
      <div>
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
        <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
