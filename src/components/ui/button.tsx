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
  primary: "jd-neo-button jd-neo-btn-yellow",
  dark: "jd-neo-button jd-neo-btn-gray",
  light: "jd-neo-button jd-neo-btn-gray",
  heroPrimary: "jd-neo-button jd-neo-btn-yellow",
  heroOutline: "jd-neo-button jd-neo-btn-blue",
  outline: "jd-neo-button jd-neo-btn-gray",
  secondary: "jd-neo-button jd-neo-btn-blue",
  ghost: "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-150 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 p-2 text-sm text-neutral-800 dark:text-neutral-200",
  destructive: "jd-neo-button jd-neo-btn-red",
  success: "jd-neo-button jd-neo-btn-green",
  warning: "jd-neo-button jd-neo-btn-yellow",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "jd-btn-sm",
  md: "jd-btn-md",
  lg: "jd-btn-lg",
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
