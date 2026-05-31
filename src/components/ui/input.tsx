import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full px-3 text-sm jd-input transition-all disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
