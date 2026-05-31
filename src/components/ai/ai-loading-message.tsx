"use client";

export function AILoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] rounded-[8px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          AI Assistant
        </p>
        <div className="mt-3 flex gap-1.5">
          <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
          <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
          <span className="size-2 animate-bounce rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
