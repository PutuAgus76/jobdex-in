import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full text-sm jd-neo-input transition-all disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
