import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/35" />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col focus:outline-none",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50/70">
            <div>
              <DialogPrimitive.Title className="text-base font-bold text-slate-900">
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <DialogPrimitive.Description className="text-xs text-slate-500 mt-0.5">
                  {subtitle}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="rounded-md p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

