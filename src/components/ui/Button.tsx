import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gold-500 text-white hover:bg-gold-600 shadow-md hover:shadow-lg",
  secondary: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
  outline: "border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white",
  ghost: "text-dark hover:bg-dark/5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
