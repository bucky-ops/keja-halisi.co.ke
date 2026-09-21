"use client";
// KEJA HALISI — MoveInCost: interactive move-in budget estimator on the listing rail.
// Trust angle: shows exactly what a fair move-in looks like, flags anyone demanding MORE
// than this before viewing (Hakuna Kulipa rule). Pure client-side math, no API.
import { useMemo, useState } from "react";
import { Calculator, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { kes } from "@/lib/nairobi";
import { useT } from "@/lib/i18n";
import type { ListingDTO } from "@/lib/types";

const EXTRAS = [
  { key: "water", label: "Water hookup", note: "borehole setup", amount: 1500, on: true },
  { key: "garbage", label: "Garbage (3 mo)", note: "county chute", amount: 900, on: true },
  { key: "internet", label: "Fibre install", note: "waived on promos", amount: 2500, on: false },
  { key: "kplc", label: "KPLC token float", note: "starter tokens", amount: 1000, on: true },
] as const;

export function MoveInCost({ listing }: { listing: ListingDTO }) {
  const t = useT();
  const [depositMonths, setDepositMonths] = useState(1);
  const [extras, setExtras] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EXTRAS.map((e) => [e.key, e.on]))
  );

  const math = useMemo(() => {
    const deposit = listing.deposit > 0 ? depositMonths * listing.price : 0;
    const extrasTotal = EXTRAS.reduce((sum, e) => sum + (extras[e.key] ? e.amount : 0), 0);
    return {
      rent: listing.price,
      deposit,
      extrasTotal,
      total: listing.price + deposit + extrasTotal,
    };
  }, [listing.price, listing.deposit, depositMonths, extras]);

  return (
    <section className="rounded-3xl border border-kline bg-surface p-5" aria-label="Move-in cost estimator">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-body">
          <Calculator className="h-4 w-4 text-trust" /> {t("moveTitle")}
        </h3>
        <span className="rounded-full bg-trust-soft px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-trust">
          estimator
        </span>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-kmuted">
        {t("moveSub")}
      </p>

      {/* deposit months selector */}
      <div className="mt-3.5 flex items-center gap-2" role="group" aria-label="Deposit months">
        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-kmuted">{t("moveDeposit")}</span>
        {[0, 1, 2].map((m) => (
          <button
            key={m}
            onClick={() => setDepositMonths(m)}
            aria-pressed={depositMonths === m}
            className={cn(
              "min-h-9 flex-1 rounded-xl px-2 py-1.5 text-[11px] font-extrabold transition-colors",
              depositMonths === m ? "bg-ink text-white" : "bg-kbg text-body/70 hover:bg-ink/10"
            )}
          >
            {m === 0 ? t("moveNone") : `${m} ${t("moveMo")}`}
          </button>
        ))}
      </div>

      {/* extras toggles */}
      <div className="mt-3 grid grid-cols-2 gap-1.5" role="group" aria-label="One-off extras">
        {EXTRAS.map((e) => (
          <button
            key={e.key}
            onClick={() => setExtras((p) => ({ ...p, [e.key]: !p[e.key] }))}
            aria-pressed={extras[e.key]}
            title={`${e.label} • ${e.note} • ${kes(e.amount)}`}
            className={cn(
              "flex min-h-11 items-center justify-between gap-1 rounded-xl px-2.5 py-2 text-left transition-colors",
              extras[e.key] ? "bg-verified-soft ring-1 ring-verified/40" : "bg-kbg opacity-70 hover:opacity-100"
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-[10.5px] font-extrabold text-body">{e.label}</span>
              <span className="block truncate text-[9px] font-semibold text-kmuted">{e.note}</span>
            </span>
            <span className={cn("text-[10px] font-extrabold", extras[e.key] ? "text-ok-strong" : "text-kmuted line-through")}>
              {e.amount >= 1000 ? `${e.amount / 1000}k` : e.amount}
            </span>
          </button>
        ))}
      </div>

      {/* breakdown */}
      <dl className="mt-3.5 space-y-1.5 border-t border-kline pt-3 text-[12px] font-bold text-body">
        <div className="flex items-center justify-between">
          <dt className="text-kmuted">{t("moveRent")}</dt>
          <dd className="tabular-nums">{kes(math.rent)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-kmuted">{t("moveDeposit")} ({depositMonths === 0 ? t("moveWaived") : `${depositMonths} ${t("moveMo")}`})</dt>
          <dd className="tabular-nums">{math.deposit ? kes(math.deposit) : "—"}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-kmuted">{t("moveExtras")}</dt>
          <dd className="tabular-nums">{math.extrasTotal ? kes(math.extrasTotal) : "—"}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-kline pt-2">
          <dt className="flex items-center gap-1.5 font-display text-[13px] font-extrabold">
            <TrendingUp className="h-3.5 w-3.5 text-trust" /> {t("moveTotal")}
          </dt>
          <dd className="font-display text-[16px] font-extrabold tabular-nums text-trust">{kes(math.total)}</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-verified-soft px-3 py-2 text-[10.5px] font-semibold leading-snug text-ok-strong">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("moveWarn")}
      </p>
    </section>
  );
}
