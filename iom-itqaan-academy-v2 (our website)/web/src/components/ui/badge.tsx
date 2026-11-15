import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warn" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
};

export function statusTone(status: string): Tone {
  const s = (status || "").toLowerCase();
  if (["active", "paid", "verified", "approved", "completed"].includes(s)) return "success";
  if (["unpaid", "depleted", "cancelled", "rejected", "returned", "overdue"].includes(s)) return "danger";
  if (["pending", "partially_paid", "in_progress", "submitted", "recorded"].includes(s)) return "warn";
  if (["one_to_one", "scheduled"].includes(s)) return "info";
  return "neutral";
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

