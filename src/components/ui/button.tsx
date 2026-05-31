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
  primary: "jd-btn jd-btn-dark",
  dark: "jd-btn jd-btn-dark",
  light: "jd-btn jd-btn-light",
  heroPrimary: "jd-btn jd-btn-light",
  heroOutline: "jd-btn jd-btn-hero-outline",
  outline: "jd-btn jd-btn-outline",
  secondary: "jd-btn jd-btn-outline",
  ghost: "jd-btn jd-btn-ghost",
  destructive: "jd-btn jd-btn-danger",
  success: "jd-btn jd-btn-success",
  warning: "jd-btn jd-btn-outline", // warning fallback to outline
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
