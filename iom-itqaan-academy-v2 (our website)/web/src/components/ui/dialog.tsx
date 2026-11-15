import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white border border-slate-200 shadow-2xl p-5 max-h-[90vh] overflow-y-auto focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <DialogPrimitive.Title className="text-base font-bold text-slate-900">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-xs text-slate-500 mt-0.5">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="pt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

