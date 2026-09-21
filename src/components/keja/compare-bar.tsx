"use client";
// KEJA HALISI — floating compare tray bar (appears when 1-3 listings selected)
import { useEffect, useMemo, useState } from "react";
import { Scale, X, ArrowRight } from "lucide-react";
import { useKeja, toast } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { fetchListings } from "./api";
import { kes } from "@/lib/nairobi";
import type { ListingDTO } from "@/lib/types";

export function CompareBar() {
  const { view, compare, toggleCompare, clearCompare, navigate } = useKeja();
  const [all, setAll] = useState<ListingDTO[]>([]);
  const t = useT();

  // catalog fetched once; tray rows derived (no setState-in-effect cascades)
  useEffect(() => {
    let alive = true;
    fetchListings({ limit: 60 })
      .then((rows) => alive && setAll(rows))
      .catch(() => alive && setAll([]));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => all.filter((l) => compare.includes(l.id)), [all, compare]);

  // hidden while already comparing or when tray empty
  if (compare.length === 0 || view === "compare") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-3 md:bottom-6">
      <div className="slide-up pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-kline bg-surface/95 p-2.5 shadow-2xl backdrop-blur-md">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-trust/10">
          <Scale className="h-4 w-4 text-trust" />
        </span>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-hide">
          {rows.map((l) => (
            <span
              key={l.id}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-kbg px-2.5 py-1.5 text-[10.5px] font-bold text-body"
            >
              {l.estate} • {kes(l.price)}
              <button
                onClick={() => toggleCompare(l.id)}
                aria-label={`${t("remove")} ${l.estate}`}
                className="grid h-4 w-4 place-items-center rounded-full bg-scam/10 text-scam hover:bg-scam/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {rows.length < compare.length && (
            <span className="shrink-0 rounded-xl bg-kbg px-2.5 py-1.5 text-[10.5px] font-bold text-kmuted">…</span>
          )}
        </div>
        {compare.length >= 2 ? (
          <button
            onClick={() => navigate("compare")}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-trust px-4 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("compareCta")} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => toast("info", "Pick 1 more keja to compare side-by-side")}
            className="inline-flex h-11 shrink-0 items-center rounded-xl bg-kbg px-4 text-[12px] font-extrabold text-kmuted"
          >
            1 more…
          </button>
        )}
        <button
          onClick={clearCompare}
          aria-label="Clear compare tray"
          className="grid h-11 w-9 shrink-0 place-items-center rounded-xl text-kmuted hover:bg-kbg hover:text-scam"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
