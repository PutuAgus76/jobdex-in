import {
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
} from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "light"
  | "dark"
  | "warning"
  | "success"
  | "destructive"
  | "heroPrimary"
  | "heroOutline";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
  secondary:
    "bg-slate-100 text-slate-950 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
  outline:
    "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-50 dark:hover:bg-slate-800",
  ghost:
    "text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
  light:
    "bg-white text-slate-950 hover:bg-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
  dark:
    "bg-slate-950 text-white hover:bg-slate-800 dark:border dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800",
  warning:
    "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-600",
  heroPrimary:
    "bg-white text-slate-950 hover:bg-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
  heroOutline:
    "border border-white/20 bg-transparent text-white hover:bg-white/10 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

function sanitizeClassName(className?: string): string {
  if (!className) return "";
  return className
    .split(/\s+/)
    .filter((cls) => {
      // Protects button contrast by stripping custom caller colors
      const isBg = /^(dark:|hover:|focus:|active:)?bg-/i.test(cls);
      const isText = /^(dark:|hover:|focus:|active:)?text-/i.test(cls);
      const isBorderColor = /^(dark:|hover:|focus:|active:)?border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)/i.test(cls);
      return !isBg && !isText && !isBorderColor;
    })
    .join(" ");
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  const sanitizedClassName = sanitizeClassName(className);
  return cn(
    "inline-flex items-center justify-center rounded-[8px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:outline-slate-100",
    sizeClasses[size],
    variantClasses[variant],
    sanitizedClassName,
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  asChild = false,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const composedClassName = buttonStyles({ variant, size, className });

  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      className: cn(children.props.className, composedClassName),
    });
  }

  return (
    <button className={composedClassName} {...props}>
      {children}
    </button>
  );
}
