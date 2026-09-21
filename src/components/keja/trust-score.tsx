"use client";
// KEJA HALISI — Keja Score widget: animated trust ring + explainable breakdown.
// Combines listing fields with the live fair-price band into one glanceable 0-100 score.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Fingerprint, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeTrustScore, TRUST_BANDS } from "@/lib/trust-score";
import type { ListingDTO } from "@/lib/types";
import type { FairPrice } from "./api";

/* count-up hook — respects prefers-reduced-motion by jumping straight to the value
   (the jump happens inside the rAF callback, not synchronously in the effect) */
function useCountUp(target: number, active: boolean, ms = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!active) return;
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = reduced ? 1 : Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active, ms]);
  return val;
}

export function TrustScoreWidget({ listing, fairPrice }: { listing: ListingDTO; fairPrice: FairPrice | null }) {
  const [open, setOpen] = useState(false);
  const band = fairPrice?.band ?? null;
  const trust = useMemo(() => computeTrustScore(listing, band), [listing, band]);
  const meta = TRUST_BANDS[trust.band];
  const shown = useCountUp(trust.score, true);

  // SVG ring geometry (r=52, c=2πr)
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, shown) / 100) * circ;

  return (
    <section className="rounded-3xl border border-kline bg-surface p-5" aria-label="Keja trust score">
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
          <Fingerprint className="h-4 w-4 text-trust" /> Keja Score
        </p>
        <span className={cn("pop rounded-full px-3 py-1.5 text-[10.5px] font-extrabold", meta.chip)}>{meta.label}</span>
      </header>

      <div className="mt-3 flex items-center gap-4">
        {/* ring */}
        <div className="relative h-[104px] w-[104px] shrink-0" role="img" aria-label={`Trust score ${trust.score} out of 100 — ${meta.label}`}>
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-trust/10 via-transparent to-verified/10" aria-hidden />
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="ks-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={meta.stroke[0]} />
                <stop offset="100%" stopColor={meta.stroke[1]} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" className="stroke-kline" />
            <circle
              cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
              stroke="url(#ks-ring)"
              strokeDasharray={`${dash} ${circ - dash}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className={cn("font-display text-[26px] font-extrabold leading-none tabular-nums", meta.text)}>{shown}</p>
              <p className="mt-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">/ 100</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-semibold leading-relaxed text-body/85">{meta.hint}</p>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="touch-target mt-2 inline-flex items-center gap-1 rounded-full bg-kbg px-3 py-1.5 text-[10.5px] font-extrabold text-body transition-colors hover:bg-ink/10"
          >
            Why {trust.score}? <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* explainable breakdown */}
      {open && (
        <ul className="mt-3 space-y-1.5 border-t border-kline pt-3 slide-up">
          {trust.parts.map((p) => {
            const pct = Math.round((p.got / p.max) * 100);
            const tone = pct >= 70 ? "bg-verified" : pct >= 40 ? "bg-pending" : "bg-scam";
            return (
              <li key={p.key} className="rounded-xl bg-kbg px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-body">
                  <span className="truncate">{p.label}</span>
                  <span className="tabular-nums text-kmuted">{p.got}<span className="text-kmuted/60">/{p.max}</span></span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-kline">
                  <div className={cn("h-full rounded-full transition-all duration-700", tone)} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[9.5px] font-semibold leading-snug text-kmuted">{p.note}</p>
              </li>
            );
          })}
          <li className="flex items-start gap-1.5 pt-1 text-[9.5px] font-semibold text-kmuted/80">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Score is a guide, not a guarantee — the 5-point viewing check is always on you.
          </li>
        </ul>
      )}
    </section>
  );
}
