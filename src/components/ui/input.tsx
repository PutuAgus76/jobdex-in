import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800 dark:disabled:bg-slate-800 dark:disabled:text-slate-400",
        className,
      )}
      {...props}
    />
  );
}
