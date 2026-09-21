"use client";
// KEJA HALISI — AffordView: "Rent reality check • Unaweza kulipa?"
// Anti-scam tool: shows what rent band your income actually supports BEFORE an
// agent pressures you into a stretch. Uses the 30% net rule calibrated for
// Nairobi (dependents tighten it), plus live borough averages from market-trends.
import { useEffect, useMemo, useState } from "react";
import {
  Calculator, TrendingUp, ArrowLeft, ShieldCheck, PiggyBank, ChevronRight,
  CircleCheck, TriangleAlert, CircleX, Wallet, BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { kes } from "@/lib/nairobi";
import { toast, useKeja } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { fetchMarketTrends } from "../api";

const QUICK_INCOME = [15000, 25000, 40000, 60000, 100000];

// safe/stretch shares of net income, tightened by dependents (Nairobi reality)
const SHARES: Record<string, { safe: number; stretch: number }> = {
  none: { safe: 0.30, stretch: 0.40 },
  few: { safe: 0.27, stretch: 0.36 },
  many: { safe: 0.24, stretch: 0.32 },
};

type Fit = "fits" | "stretch" | "above";

function fitOf(avg: number, safe: number, stretch: number): Fit {
  if (avg <= safe) return "fits";
  if (avg <= stretch) return "stretch";
  return "above";
}

const FIT_STYLE: Record<Fit, { cls: string; icon: typeof CircleCheck }> = {
  fits: { cls: "bg-verified-soft text-ok-strong", icon: CircleCheck },
  stretch: { cls: "bg-pending-soft text-pending", icon: TriangleAlert },
  above: { cls: "bg-scam-soft text-scam", icon: CircleX },
};

export default function AffordView() {
  const t = useT();
  const { params, back, navigate, setFilters, resetFilters, saveSearch } = useKeja();
  const [income, setIncome] = useState<number>(params.income ?? 0);
  const [side, setSide] = useState(0);
  const [deps, setDeps] = useState<keyof typeof SHARES>("none");
  const [savings, setSavings] = useState(0);
  const [alertSaved, setAlertSaved] = useState(false);
  const [trends, setTrends] = useState<{ borough: string; avgPrice: number; count: number }[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchMarketTrends()
      .then((rows) => {
        if (!alive) return;
        // aggregate sub-county rows → borough averages (weighted by live count)
        const m = new Map<string, { sum: number; n: number }>();
        for (const r of rows) {
          const cur = m.get(r.borough) ?? { sum: 0, n: 0 };
          m.set(r.borough, { sum: cur.sum + r.avgPrice * Math.max(1, r.count), n: cur.n + Math.max(1, r.count) });
        }
        setTrends([...m.entries()].map(([borough, v]) => ({ borough, avgPrice: Math.round(v.sum / v.n), count: v.n })));
        setTrendsLoading(false);
      })
      .catch(() => alive && setTrendsLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const net = Math.max(0, income) + Math.max(0, side);
  const share = SHARES[deps];
  const safe = Math.round((net * share.safe) / 500) * 500;
  const stretch = Math.round((net * share.stretch) / 500) * 500;
  const moveIn = safe * 2; // first month + 1-month deposit
  const safePct = net > 0 ? Math.round((safe / net) * 100) : 0;
  const hasIncome = net > 0;

  const readiness = useMemo(() => {
    if (!hasIncome) return null;
    if (savings <= 0) return { pct: 0, gap: moveIn, ready: false };
    const pct = Math.min(100, Math.round((savings / moveIn) * 100));
    return { pct, gap: Math.max(0, moveIn - savings), ready: savings >= moveIn };
  }, [savings, moveIn, hasIncome]);

  const browse = () => {
    if (!hasIncome) {
      toast("warning", "Enter your income first — hata makdirio yanahitaji namba");
      return;
    }
    resetFilters();
    setFilters({ maxPrice: Math.max(3000, safe), minPrice: 3000, estate: "", borough: "", subCounty: "" });
    navigate("estate", { maxPrice: Math.max(3000, safe) });
    toast("success", `Showing kejas ≤ ${kes(Math.max(3000, safe))} — your safe band`);
  };

  /* save the current band as a search alert — pings when fresh kejas fit */
  const saveAlert = () => {
    if (!hasIncome) {
      toast("warning", "Enter your income first — hata alerts zinahitaji namba");
      return;
    }
    resetFilters();
    setFilters({ maxPrice: Math.max(3000, safe), minPrice: 3000, estate: "", borough: "", subCounty: "" });
    saveSearch(`${t("affordAlertLabel")} ${kes(Math.max(3000, safe))}`);
    setAlertSaved(true);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-trust">
            <Calculator className="h-3.5 w-3.5" /> Rent reality check
          </p>
          <h1 className="mt-1 font-display text-[22px] font-extrabold text-body">Unaweza kulipa? — Can you afford it?</h1>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-kmuted">
            Know your real rent band <span className="font-bold text-body">before</span> an agent pressures you.
            The 30% rule, calibrated for Nairobi — viewing is free, deposits are the only serious cash.
          </p>
        </div>
        <button
          onClick={back}
          className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12px] font-extrabold text-body hover:bg-kbg"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        {/* ============ INPUTS ============ */}
        <section className="rounded-3xl border border-kline bg-card p-5 shadow-[0_10px_30px_rgba(17,25,40,0.06)]" aria-label="Your income details">
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">1 • Your money</p>

          <label className="mt-3.5 block text-[11.5px] font-bold text-body" htmlFor="afford-income">
            Net monthly income (KES)
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-extrabold text-kmuted">KES</span>
            <input
              id="afford-income"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={income || ""}
              onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
              placeholder="e.g. 35000"
              className="w-full rounded-2xl border border-kline bg-surface py-3 pl-[52px] pr-4 font-display text-[15px] font-extrabold tabular-nums text-body outline-none transition-colors placeholder:font-semibold placeholder:text-kmuted/60 focus:border-trust"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_INCOME.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setIncome(v)}
                className={cn(
                  "touch-target rounded-full border px-3 py-1.5 text-[10.5px] font-extrabold transition-colors",
                  income === v ? "border-trust bg-trust text-white" : "border-kline bg-surface text-kmuted hover:bg-kbg hover:text-body"
                )}
              >
                {kes(v)}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-[11.5px] font-bold text-body" htmlFor="afford-side">
            Side hustle (optional, KES)
          </label>
          <input
            id="afford-side"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={side || ""}
            onChange={(e) => setSide(Math.max(0, Number(e.target.value) || 0))}
            placeholder="boda, freelance, duka..."
            className="mt-1.5 w-full rounded-2xl border border-kline bg-surface px-4 py-3 font-display text-[14px] font-extrabold tabular-nums text-body outline-none transition-colors placeholder:font-semibold placeholder:text-kmuted/60 focus:border-trust"
          />

          <p className="mt-4 text-[11.5px] font-bold text-body">People relying on this income</p>
          <div className="mt-1.5 inline-flex rounded-full border border-kline bg-surface p-1" role="group" aria-label="Dependents">
            {(
              [
                ["none", "Just me"],
                ["few", "1–2"],
                ["many", "3+"],
              ] as [keyof typeof SHARES, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setDeps(k)}
                aria-pressed={deps === k}
                className={cn(
                  "touch-target rounded-full px-4 py-2 text-[11.5px] font-extrabold transition-colors",
                  deps === k ? "bg-ink text-white" : "text-kmuted hover:text-body"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-1.5 text-[11.5px] font-bold text-body" htmlFor="afford-savings">
            <PiggyBank className="h-3.5 w-3.5 text-verified" /> Cash saved for move-in (optional, KES)
          </label>
          <input
            id="afford-savings"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={savings || ""}
            onChange={(e) => setSavings(Math.max(0, Number(e.target.value) || 0))}
            placeholder="rent + deposit + small buffer"
            className="mt-1.5 w-full rounded-2xl border border-kline bg-surface px-4 py-3 font-display text-[14px] font-extrabold tabular-nums text-body outline-none transition-colors placeholder:font-semibold placeholder:text-kmuted/60 focus:border-verified"
          />
        </section>

        {/* ============ RESULTS ============ */}
        <section className="space-y-4" aria-label="Your rent band">
          <div className={cn("rounded-3xl border p-5 transition-colors", hasIncome ? "border-trust/25 bg-trust-soft" : "border-dashed border-kline bg-kbg/50")}>
            <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-trust">
              <TrendingUp className="h-3.5 w-3.5" /> 2 • Your rent band
            </p>
            {hasIncome ? (
              <>
                <div className="mt-3 flex flex-wrap items-end gap-x-2">
                  <p className="font-display text-[34px] font-extrabold leading-none text-trust">{kes(safe)}</p>
                  <p className="pb-1 text-[12px] font-bold text-kmuted">/mo safe rent • {safePct}% of income</p>
                </div>

                {/* band bar — safe / stretch / risky zones with marker */}
                <div className="mt-4" role="img" aria-label={`Safe rent ${safePct} percent of income, stretch ceiling ${Math.round((stretch / net) * 100)} percent`}>
                  <div className="relative h-3.5 overflow-hidden rounded-full">
                    <div className="absolute inset-y-0 left-0 bg-verified" style={{ width: "30%" }} aria-hidden />
                    <div className="absolute inset-y-0 left-[30%] bg-gold" style={{ width: "10%" }} aria-hidden />
                    <div className="absolute inset-y-0 left-[40%] bg-scam" style={{ width: "60%" }} aria-hidden />
                    {/* income marker */}
                    <span
                      className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink shadow-md transition-[left] duration-500"
                      style={{ left: `${Math.min(100, Math.round((stretch / net) * 100))}%` }}
                      aria-hidden
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9.5px] font-extrabold text-kmuted">
                    <span className="text-ok-strong">SAFE ≤30%</span>
                    <span className="text-warn-strong">STRETCH 30–40%</span>
                    <span className="text-scam">RISKY &gt;40%</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Safe", value: kes(safe), tone: "text-ok-strong" },
                    { label: "Stretch max", value: kes(stretch), tone: "text-warn-strong" },
                    { label: "Move-in cash", value: kes(moveIn), tone: "text-trust" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-surface/80 p-3 text-center ring-1 ring-kline">
                      <p className={cn("font-display text-[15px] font-extrabold tabular-nums", s.tone)}>{s.value}</p>
                      <p className="mt-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-kmuted">{s.label}</p>
                    </div>
                  ))}
                </div>

                {safePct > 40 && (
                  <p className="mt-3 rounded-xl bg-scam-soft px-3 py-2 text-[11px] font-bold text-scam">
                    Heads up — landlords evict for missed months. A cheaper estate beats a fancy struggle.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-[12.5px] font-semibold leading-relaxed text-kmuted">
                Enter your income to see your honest rent band — kwanza tumia akili, sasa utafute keja.
              </p>
            )}
          </div>

          {/* move-in readiness */}
          {readiness && (
            <div className="rounded-3xl border border-kline bg-card p-5" aria-label="Move-in readiness">
              <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
                <Wallet className="h-3.5 w-3.5 text-verified" /> 3 • Move-in readiness
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold text-body">
                  {savings.toLocaleString()} saved of {moveIn.toLocaleString()} needed
                </p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                    readiness.ready ? "bg-verified text-white" : "bg-pending-soft text-pending"
                  )}
                >
                  {readiness.ready ? "READY TO MOVE" : `SAVE ${kes(readiness.gap)} MORE`}
                </span>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-kline">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", readiness.ready ? "bg-verified" : "bg-gold")}
                  style={{ width: `${readiness.pct}%` }}
                />
              </div>
              <p className="mt-2 text-[10.5px] font-semibold leading-relaxed text-kmuted">
                First month + 1-month deposit at your safe rent. Anyone demanding{" "}
                <span className="font-extrabold text-body">more than this before the viewing = scam</span>.
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={browse}
            className="touch-target flex w-full items-center justify-center gap-2 rounded-full bg-trust py-3.5 font-display text-[13.5px] font-extrabold text-white shadow-lg shadow-trust/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <ShieldCheck className="h-4 w-4" /> Show kejas in my range <ChevronRight className="h-4 w-4" />
          </button>

          {/* save this band as an alert — pings when fresh kejas fit your safe rent */}
          {hasIncome && (
            <button
              onClick={saveAlert}
              className={cn(
                "touch-target mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-[12px] font-extrabold transition-all active:scale-[0.99]",
                alertSaved
                  ? "border-verified bg-verified-soft text-ok-strong"
                  : "border-dashed border-trust/50 bg-trust-soft/50 text-trust hover:border-trust hover:bg-trust-soft"
              )}
              aria-live="polite"
            >
              {alertSaved ? (
                <>
                  <CircleCheck className="h-4 w-4 text-verified" /> {t("affordAlertSaved")}
                </>
              ) : (
                <>
                  <BellRing className="h-4 w-4" /> {t("affordSaveAlert")}
                </>
              )}
            </button>
          )}
        </section>
      </div>

      {/* ============ BOROUGH FIT ============ */}
      <section className="mt-6 rounded-3xl border border-kline bg-card p-5" aria-label="Which boroughs fit your budget">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
            4 • Where your band fits • live borough averages
          </p>
          {hasIncome && <span className="rounded-full bg-trust-soft px-2.5 py-1 text-[10px] font-extrabold text-trust">band ≤ {kes(safe)}</span>}
        </div>

        {trendsLoading ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trends
              .map((b) => ({ ...b, fit: hasIncome ? fitOf(b.avgPrice, safe, stretch) : ("above" as Fit) }))
              .sort((a, b) => a.avgPrice - b.avgPrice)
              .map((b) => {
                const st = FIT_STYLE[b.fit];
                const Icon = st.icon;
                const shareOfIncome = hasIncome ? Math.min(150, Math.round((b.avgPrice / net) * 100)) : 0;
                return (
                  <li key={b.borough}>
                    <button
                      onClick={() => {
                        if (!hasIncome) {
                          toast("warning", "Enter your income first");
                          return;
                        }
                        resetFilters();
                        setFilters({ borough: b.borough, subCounty: "", estate: "", maxPrice: Math.max(3000, safe) });
                        navigate("estate", { borough: b.borough, maxPrice: Math.max(3000, safe) });
                        toast("success", `${b.borough} kejas ≤ ${kes(Math.max(3000, safe))}`);
                      }}
                      className="card-lift w-full rounded-2xl border border-kline bg-surface p-3.5 text-left"
                      aria-label={`${b.borough}, average ${kes(b.avgPrice)} — ${b.fit === "fits" ? "fits your budget" : b.fit === "stretch" ? "stretch" : "above your budget"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12.5px] font-extrabold text-body">{b.borough}</p>
                        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold", st.cls)}>
                          <Icon className="h-2.5 w-2.5" /> {b.fit === "fits" ? "FITS" : b.fit === "stretch" ? "STRETCH" : "ABOVE"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-bold tabular-nums text-kmuted">
                        avg {kes(b.avgPrice)} • {b.count} live
                      </p>
                      {hasIncome && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-kline">
                          <div
                            className={cn("h-full rounded-full", b.fit === "fits" ? "bg-verified" : b.fit === "stretch" ? "bg-gold" : "bg-scam")}
                            style={{ width: `${shareOfIncome}%` }}
                          />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
        <p className="mt-3 text-[10px] font-semibold text-kmuted">
          Averages from live approved listings — individual estates vary. Bedsitters rent far below 2BR in the same borough.
        </p>
      </section>

      {/* anti-scam footer note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-ink px-4 py-3.5 text-white" role="note">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-tiktok-cyan" />
        <p className="text-[11px] font-semibold leading-relaxed">
          Budget rule of the streets: <span className="font-extrabold">rent ≤ 30% of net income</span>, deposit refundable,
          viewing FREE. Hakuna kulipa kabla ya kuona nyumba — an agent who pressures you over budget is an agent to drop.
        </p>
      </div>
    </div>
  );
}
