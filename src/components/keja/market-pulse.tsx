"use client";
// KEJA HALISI — Market Pulse widget + Trustbar pills + stats strip
import { ShieldCheck, Flag, Timer, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketPulse, HomeStats } from "@/lib/types";

export function MarketPulse({ pulse, className }: { pulse: MarketPulse | null; className?: string }) {
  const data = pulse ?? { verifiedToday: 0, scamsBlocked: 0, avgResponse: 0, freshListings: 0 };
  const tiles = [
    { label: "Verified Today", value: data.verifiedToday, sub: "+18% vs yest", color: "text-verified", icon: ShieldCheck },
    { label: "Scams Blocked", value: data.scamsBlocked, sub: "Fee signal • repost", color: "text-scam", icon: Flag },
    { label: "Avg Response", value: `${data.avgResponse} min`, sub: "Fastest 4 min", color: "text-trust", icon: Timer },
    { label: "Fresh Listings", value: `${data.freshListings} ≤24h`, sub: "Kile • Syoki • Zimm", color: "text-trust", icon: Zap },
  ];
  return (
    <section className={cn("rounded-3xl bg-card border border-kline p-4 shadow-[0_10px_30px_rgba(17,25,40,0.06)]", className)} aria-label="Market pulse">
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-[13px] font-bold text-ink">
          <TrendingUp className="h-4 w-4 text-verified" /> Market Pulse • Nairobi Live
        </h3>
        <span className="rounded-full bg-verified/10 text-verified px-2 py-0.5 text-[9px] font-extrabold tracking-wider flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-verified pulse-dot" /> LIVE TODAY
        </span>
      </header>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-kbg p-3">
            <p className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-kmuted">
              <t.icon className="h-3 w-3" /> {t.label}
            </p>
            <p className={cn("mt-1 font-display text-xl font-extrabold", t.color)}>{t.value}</p>
            <p className="text-[9.5px] text-kmuted font-medium">{t.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Trustbar({ className }: { className?: string }) {
  const pills = [
    { label: "Verified Green", cls: "bg-verified text-white", icon: ShieldCheck },
    { label: "No Viewing Fee Blue", cls: "bg-trust text-white", icon: ShieldCheck },
    { label: "Reported Red", cls: "bg-scam text-white", icon: Flag },
    { label: "Fresh ≤24h", cls: "bg-white/10 text-white border border-white/20", icon: Zap },
  ];
  return (
    <section className={cn("rounded-3xl bg-tiktok text-white p-4", className)} aria-label="Trustbar">
      <p className="text-[9.5px] font-extrabold tracking-[0.14em] text-white/60">TRUSTBAR PILLS</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {pills.map((p) => (
          <span key={p.label} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold", p.cls)}>
            <p.icon className="h-3 w-3" /> {p.label}
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-[10.5px] leading-relaxed text-white/60">
        Every card shows freshH, response mins, fee boolean, verified. Filters hide fee listings when No Fee is active.
      </p>
    </section>
  );
}

/** Animated stats strip: 1,247 Verified Agents • 3,421 Units • 892 Scams Blocked Today */
export function StatsStrip({ stats }: { stats: HomeStats | null }) {
  const s = stats ?? { verifiedAgents: 1247, units: 3421, scamsBlocked: 892 };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-display text-[12px] sm:text-[13px] font-bold text-white/90">
      <span className="text-white">{s.verifiedAgents.toLocaleString()} VERIFIED AGENTS</span>
      <span className="text-white/40" aria-hidden>•</span>
      <span className="text-white">{s.units.toLocaleString()} UNITS</span>
      <span className="text-white/40" aria-hidden>•</span>
      <span className="text-tiktok-cyan">{s.scamsBlocked.toLocaleString()} SCAMS BLOCKED TODAY</span>
    </div>
  );
}
