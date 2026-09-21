"use client";
// KEJA HALISI — ShareSheet (round 10): channel picker with an anti-scam message preview.
// WhatsApp/SMS deep links carry the free-viewing reminder so every share spreads the rule.
import { useEffect, useState } from "react";
import { X, Copy, MessageCircle, Share2, Smartphone, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/store";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** e.g. "1BR • Kileleshwa • KES 35,000/mo — verified on Keja Halisi" */
  text: string;
  url: string;
}

const WHATSAPP_GREEN = "#25D366";

export function ShareSheet({ open, onClose, title, text, url }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  // lazy initializer — only rendered client-side after user interaction (no hydration impact)
  const [hasNative] = useState(() => typeof navigator !== "undefined" && Boolean(navigator.share));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fullMessage = `${text}\n${url}\n\nViewing is FREE — hakuna kulipa kabla ya kuona nyumba. 🏡✅`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      toast("success", "Copied — message + link + free-viewing rule");
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast("warning", "Copy blocked by browser — select the text instead");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: fullMessage, url });
      onClose();
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") toast("error", "Native share unavailable");
    }
  };

  const channels: {
    key: string; label: string; sub: string; badgeCls: string; badgeStyle?: React.CSSProperties; icon: React.ReactNode; href?: string; action?: () => void;
  }[] = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      sub: "Groups • house-hunting chats",
      badgeCls: "text-white",
      badgeStyle: { backgroundColor: WHATSAPP_GREEN },
      icon: <MessageCircle className="h-5 w-5" />,
      href: `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
    },
    {
      key: "sms",
      label: "SMS",
      sub: "Works offline • mama mboga safe",
      badgeCls: "bg-ink text-white",
      icon: <Smartphone className="h-5 w-5" />,
      href: `sms:?&body=${encodeURIComponent(fullMessage)}`,
    },
    {
      key: "copy",
      label: copied ? "Copied ✓" : "Copy message",
      sub: "Message + link + rule",
      badgeCls: "bg-trust text-white",
      icon: copied ? <CircleCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />,
      action: copy,
    },
  ];
  if (hasNative) {
    channels.push({
      key: "native",
      label: "More…",
      sub: "IG, X, Telegram, Bluetooth",
      badgeCls: "bg-verified text-white",
      icon: <Share2 className="h-5 w-5" />,
      action: nativeShare,
    });
  }

  return (
    <div className="fixed inset-0 z-[95] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label="Share this keja">
      <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="Close share sheet" tabIndex={-1} />
      <div className="slide-up relative w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl border border-kline bg-surface shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-2 border-b border-kline px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="font-display text-[15px] font-extrabold text-body">Share this keja</h3>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-kmuted">{title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="touch-target grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kbg text-kmuted transition-colors hover:bg-kline hover:text-body"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* message preview — shows exactly what friends will receive */}
        <div className="px-5 pt-4">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Message preview</p>
          <div className="mt-1.5 rounded-2xl rounded-tl-md bg-[#E7F5EC] px-3.5 py-2.5 dark:bg-[#12321f]" role="note">
            <p className="whitespace-pre-line break-words text-[11.5px] font-semibold leading-relaxed text-body">{fullMessage}</p>
          </div>
        </div>

        {/* channel tiles */}
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {channels.map((c) => {
            const body = (
              <>
                <span
                  className={cn("grid h-11 w-11 place-items-center rounded-2xl shadow-sm transition-transform group-hover:scale-105", c.badgeCls)}
                  style={c.badgeStyle}
                >
                  {c.icon}
                </span>
                <span className="mt-1.5 block text-center text-[10.5px] font-extrabold leading-tight text-body">{c.label}</span>
                <span className="mt-0.5 block text-center text-[8.5px] font-semibold leading-tight text-kmuted">{c.sub}</span>
              </>
            );
            const cls =
              "touch-target group flex flex-col items-center rounded-2xl border border-kline bg-kbg px-2 py-3 transition-all hover:border-trust/40 hover:bg-surface active:scale-95";
            if (c.href) {
              return (
                <a key={c.key} href={c.href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`Share via ${c.label}`}>
                  {body}
                </a>
              );
            }
            return (
              <button key={c.key} onClick={c.action} className={cls} aria-label={c.label}>
                {body}
              </button>
            );
          })}
        </div>

        <p className="px-5 pb-4 text-center text-[9.5px] font-bold leading-relaxed text-kmuted">
          Every share carries the rule: no viewing fee before you see the house.
        </p>
      </div>
    </div>
  );
}
