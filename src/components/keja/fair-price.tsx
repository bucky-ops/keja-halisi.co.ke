"use client";
// KEJA HALISI — "Is this price fair?" widget (anti-bait pricing radar)
// Live comps from /api/market/fair-price: verdict pill + range bar with marker.
import { useEffect, useState } from "react";
import { Scale, Info, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { kesShort } from "@/lib/nairobi";
import { fetchFairPrice, type FairPrice } from "./api";
import type { ListingDTO } from "@/lib/types";

const TONE = {
  ok: { pill: "bg-verified-soft text-ok-strong", icon: CheckCircle2, bar: "bg-verified", iconCls: "text-verified" },
  warn: { pill: "bg-pending-soft text-warn-strong", icon: AlertTriangle, bar: "bg-pending", iconCls: "text-warn-strong" },
  scam: { pill: "bg-scam/10 text-scam", icon: AlertTriangle, bar: "bg-scam", iconCls: "text-scam" },
} as const;

export function FairPriceWidget({ listing }: { listing: ListingDTO }) {
  // payload keyed by inputs — loading/failed derived, no cascading setState
  const [payload, setPayload] = useState<{
    key: string;
    data: FairPrice | null;
    failed: boolean;
  }>({ key: listing.id, data: null, failed: false });

  const key = `${listing.id}-${listing.price}`;
  useEffect(() => {
    let alive = true;
    fetchFairPrice(listing.estate, listing.beds, listing.price, listing.id)
      .then((d) => { if (alive) setPayload({ key, data: d, failed: false }); })
      .catch(() => { if (alive) setPayload({ key, data: null, failed: true }); });
    return () => { alive = false; };
  }, [key, listing.estate, listing.beds, listing.price, listing.id]);

  const loading = payload.key !== key;
  const data = payload.key === key ? payload.data : null;
  const failed = payload.failed && payload.key === key;

  if (failed) return null; // silent — trust widget never blocks the page

  const tone = data ? TONE[data.verdict.tone] : null;
  const Icon = tone?.icon ?? Scale;

  // marker position on the min→max range (clamped 4%-96% so it never touches edges)
  const pct = data
    ? Math.min(96, Math.max(4, ((listing.price - data.stats.min) / Math.max(1, data.stats.max - data.stats.min)) * 100))
    : 0;

  return (
    <section
      className="rounded-3xl border border-kline bg-surface p-5"
      aria-label="Fair price check"
      aria-busy={loading}
      data-fair-price={data?.band ?? "loading"}
    >
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
          <Scale className="h-4 w-4 text-trust" /> Is this price fair?
        </p>
        {data ? (
          <span className={cn("pop inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-extrabold", tone!.pill)}>
            <Icon className="h-3.5 w-3.5" /> {data.verdict.label}
          </span>
        ) : (
          <span className="rounded-full bg-kbg px-3 py-1.5 text-[10px] font-extrabold text-kmuted">Checking comps…</span>
        )}
      </header>

      {/* range bar */}
      <div className="mt-4">
        <div className="relative h-2.5 rounded-full bg-kline" aria-hidden>
          {/* p25-p75 shaded band */}
          {data && (
            <span
              className="absolute top-0 h-full rounded-full bg-trust/25"
              style={{
                left: `${Math.max(0, ((data.stats.p25 - data.stats.min) / Math.max(1, data.stats.max - data.stats.min)) * 100)}%`,
                right: `${Math.max(0, 100 - ((data.stats.p75 - data.stats.min) / Math.max(1, data.stats.max - data.stats.min)) * 100)}%`,
              }}
            />
          )}
          {/* marker */}
          {data && (
            <span
              className={cn("absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface shadow-md transition-all", tone!.bar)}
              style={{ left: `${pct}%` }}
            />
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-extrabold text-kmuted">
          <span>{data ? kesShort(data.stats.min) : "—"}</span>
          <span>{data ? `${kesShort(data.stats.median)} median` : "market range"}</span>
          <span>{data ? kesShort(data.stats.max) : "—"}</span>
        </div>
      </div>

      {data && (
        <>
          <p className="mt-3 text-[11.5px] font-semibold leading-relaxed text-body/85">{data.verdict.note}</p>
          <p className="mt-2.5 flex items-start gap-1.5 border-t border-kline pt-2.5 text-[10px] font-semibold leading-relaxed text-kmuted">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-trust" />
            <span>
              {data.compCount > 0
                ? `${data.compCount} live comps • ${data.scope} level • ${data.beds} in ${data.estate}`
                : `Seeded estate average • ${data.scope} • ${data.beds} in ${data.estate}`}
            </span>
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-kmuted/70">
            <TrendingUp className="h-3 w-3" /> Not a valuation — always compare 2-3 kejas before deposit.
          </p>
        </>
      )}
    </section>
  );
}
