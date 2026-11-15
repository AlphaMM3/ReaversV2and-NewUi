import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-800 border-transparent",
  primary: "bg-teal-700 text-white hover:bg-teal-800 border-transparent shadow-xs",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-200",
  outline: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs rounded-md",
  md: "h-9 px-3.5 text-sm rounded-lg",
  lg: "h-10 px-4 text-sm rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

