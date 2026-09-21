"use client";
// KEJA HALISI — Viewing Safety Kit (interactive pre-viewing checklist).
// Reinforces the core rule at the moment it matters: on viewing day.
// Checklist state persists per booking (device-local, privacy by design).
import { useState } from "react";
import {
  X, ShieldCheck, IdCard, Droplets, DoorOpen, Eye, BanknoteX, Flag,
  RotateCcw, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { ViewingLogItem } from "@/lib/store";

const KIT_ITEMS: { key: string; icon: typeof IdCard; en: string; enSub: string }[] = [
  {
    key: "id",
    icon: IdCard,
    en: "Carry your ID / passport",
    enSub: "The caretaker may note it at the gate — never hand over the original to keep.",
  },
  {
    key: "water",
    icon: Droplets,
    en: "Ask to open the water + check the meter",
    enSub: "Dry taps or a mismatched meter number = negotiating point or walk-away.",
  },
  {
    key: "door",
    icon: DoorOpen,
    en: "Match the door to the listing",
    enSub: "Confirm the block/door you were shown online is the one you enter. Fake listings swap houses.",
  },
  {
    key: "view",
    icon: Eye,
    en: "View it YOURSELF — inside, not photos",
    enSub: "No 'my colleague will show you'. If you cannot enter today, book another day.",
  },
  {
    key: "nofee",
    icon: BanknoteX,
    en: "Pay ZERO viewing fee",
    enSub: "Viewing is free — hakuna kulipa kabla ya kuona nyumba. Deposit comes AFTER you choose to take it.",
  },
  {
    key: "report",
    icon: Flag,
    en: "Pushed to pay? Walk away + report",
    enSub: "Any fee demanded before viewing = scam. Your report arms the 3-strike auto-hide.",
  },
];

export function viewingKitKey(id: number) {
  return `keja-kit-${id}`;
}

export function readKitProgress(id: number): number {
  try {
    const raw = JSON.parse(localStorage.getItem(viewingKitKey(id)) || "[]") as string[];
    return raw.length;
  } catch {
    return 0;
  }
}

/* ---------- expandable kit card (inline use under the home reminder banner) ---------- */
export function ViewingSafetyKit({ viewing, onClose }: { viewing: ViewingLogItem; onClose?: () => void }) {
  const t = useT();
  // read persisted progress lazily on first mount (device-local, privacy by design)
  const [done, setDone] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(viewingKitKey(viewing.id)) || "[]") as string[];
    } catch {
      return [];
    }
  });

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(viewingKitKey(viewing.id), JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  const pct = Math.round((done.length / KIT_ITEMS.length) * 100);
  const allDone = done.length === KIT_ITEMS.length;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-trust/30 bg-surface p-4 shadow-[0_10px_30px_rgba(17,25,40,0.08)]"
      aria-label="Viewing safety kit checklist"
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-trust/10 blur-xl" aria-hidden />

      <div className="relative flex flex-wrap items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-trust text-white">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-extrabold text-body">{t("kitTitle")}</p>
          <p className="truncate text-[10.5px] font-semibold text-kmuted">
            {viewing.estate} • {viewing.date} • {viewing.slot} EAT
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close safety kit" className="touch-target grid h-8 w-8 place-items-center rounded-full hover:bg-kbg">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* progress */}
      <div className="relative mt-3 flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Kit progress">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-kbg">
          <div
            className={cn("h-full rounded-full transition-all duration-500", allDone ? "bg-verified" : "bg-trust")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn("text-[10px] font-extrabold tabular-nums", allDone ? "text-verified" : "text-trust")}>
          {done.length}/{KIT_ITEMS.length}
        </span>
        {done.length > 0 && (
          <button
            onClick={() => KIT_ITEMS.forEach((i) => done.includes(i.key) && toggle(i.key))}
            aria-label="Reset checklist"
            className="touch-target grid h-6 w-6 place-items-center rounded-full text-kmuted hover:bg-kbg"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* checklist */}
      <ul className="relative mt-3 space-y-2">
        {KIT_ITEMS.map((item, i) => {
          const checked = done.includes(item.key);
          return (
            <li key={item.key}>
              <button
                onClick={() => toggle(item.key)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                  checked
                    ? "border-verified/30 bg-verified-soft"
                    : "border-kline bg-kbg/50 hover:border-trust/40 hover:bg-trust-soft/40"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold transition-colors",
                    checked ? "bg-verified text-white" : "bg-surface text-kmuted ring-1 ring-kline"
                  )}
                >
                  {checked ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("flex items-center gap-1.5 text-[11.5px] font-extrabold", checked ? "text-ok-strong" : "text-body")}>
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0", checked ? "text-verified" : "text-trust")} />
                    {item.en}
                  </span>
                  <span className={cn("mt-0.5 block text-[10px] font-semibold leading-snug", checked ? "text-ok-strong/70" : "text-kmuted")}>
                    {item.enSub}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* completion state */}
      {allDone && (
        <div className="pop relative mt-3 flex items-center gap-2 rounded-xl border border-verified/30 bg-verified-soft px-3.5 py-2.5" role="status">
          <PartyPopper className="h-4 w-4 shrink-0 text-verified" />
          <p className="text-[11px] font-extrabold text-ok-strong">{t("kitDone")}</p>
        </div>
      )}
    </div>
  );
}
