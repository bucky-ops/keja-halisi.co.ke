"use client";
// KEJA HALISI — brand toast stack (bottom, slide-in, brand colors)
import { useToasts, type ToastKind } from "@/lib/store";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

const KIND_STYLES: Record<ToastKind, { bg: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: "bg-verified", Icon: CheckCircle2 },
  error: { bg: "bg-scam", Icon: XCircle },
  warning: { bg: "bg-pending", Icon: AlertTriangle },
  info: { bg: "bg-ink", Icon: Info },
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => {
        const { bg, Icon } = KIND_STYLES[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={`toast-in pointer-events-auto flex items-center gap-2.5 ${bg} text-white rounded-full pl-3 pr-2 py-2.5 shadow-lg max-w-[92vw] sm:max-w-[420px]`}
          >
            <span className="h-6 w-6 shrink-0 rounded-full bg-white/15 grid place-items-center">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="text-[12.5px] font-semibold leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="touch-target grid place-items-center rounded-full hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
