import * as React from "react";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(({ className, hasError, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={hasError || undefined}
    className={cn(
      "w-full h-9 px-3 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 transition-colors",
      hasError ? "border-rose-500 ring-2 ring-rose-500/15" : "border-slate-300",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }
>(({ className, hasError, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={hasError || undefined}
    className={cn(
      "w-full h-9 px-2.5 rounded-lg border bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 transition-colors",
      hasError ? "border-rose-500 ring-2 ring-rose-500/15" : "border-slate-300",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
>(({ className, hasError, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={hasError || undefined}
    className={cn(
      "w-full min-h-20 p-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 transition-colors",
      hasError ? "border-rose-500 ring-2 ring-rose-500/15" : "border-slate-300",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

