"use client";

export function AIHistoryDateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
