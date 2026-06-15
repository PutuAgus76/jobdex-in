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
  | "heroOutline"
  | "info";

type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
  secondary: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
  outline: "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
  ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350",
  light: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200",
  dark: "bg-slate-900 hover:bg-slate-950 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950",
  warning: "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  destructive: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  heroPrimary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
  heroOutline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-300",
  info: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-lg",
  lg: "h-10 px-5 text-sm rounded-lg",
  icon: "h-8 w-8 p-0 rounded-md",
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
    "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:border-sky-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:text-current [&_svg]:shrink-0",
    variantClasses[variant],
    sizeClasses[size],
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
