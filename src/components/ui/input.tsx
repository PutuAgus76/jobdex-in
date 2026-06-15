import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-secondary-background selection:bg-sky-500 selection:text-white px-3 py-2 text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:border-sky-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className,
      )}
      {...props}
    />
  );
}
