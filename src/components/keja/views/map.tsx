"use client";
// KEJA HALISI — MapView: Nairobi discovery map (illustrative GIS) + market pulse analytics
// Density clustering: sub-counties with 3+ listings collapse into sized cluster
// bubbles (tap to open a cluster panel); 1-2 listing areas stay individual pins.
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudSun, MapPin, Minus, Play, RefreshCw, TrendingUp, X, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_SUB_COUNTIES, BOROUGH_INFO, estateWeather, kes } from "@/lib/nairobi";
import { toast, useKeja } from "@/lib/store";
import { fetchListings, fetchMarketTrends } from "@/components/keja/api";
import type { ListingDTO } from "@/lib/types";

type Mode = "listings" | "pulse";
type Trend = Awaited<ReturnType<typeof fetchMarketTrends>>;

// Nairobi bounding box used to normalize pins (illustrative until live GIS)
const LAT_MAX = -1.19;
const LAT_MIN = -1.36;
const LNG_MIN = 36.65;
const LNG_MAX = 36.95;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const ROADS = [
  { cls: "rotate-[8deg]", top: "16%" },
  { cls: "rotate-[-18deg]", top: "36%" },
  { cls: "rotate-[28deg]", top: "56%" },
  { cls: "rotate-[45deg]", top: "78%" },
];

function pinPos(l: ListingDTO) {
  return {
    left: clamp(((l.lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100, 3, 97),
    top: clamp(((LAT_MAX - l.lat) / (LAT_MAX - LAT_MIN)) * 100, 5, 95),
  };
}

function MapSkeleton() {
  return (
    <div className="relative h-[560px] overflow-hidden rounded-3xl border border-kline keja-map">
      {[18, 34, 52, 70, 84].map((t, i) => (
        <div key={t} className="absolute h-6 w-6 rounded-full shimmer" style={{ left: `${12 + i * 17}%`, top: `${t}%` }} />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-surface/70 shimmer" />
    </div>
  );
}

export default function MapView() {
  const { navigate } = useKeja();
  const [mode, setMode] = useState<Mode>("listings");
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [trends, setTrends] = useState<Trend>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCluster, setOpenCluster] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setLoading(true);
      const [ls, tr] = await Promise.all([fetchListings({ limit: 50 }), fetchMarketTrends()]);
      setListings(ls);
      setTrends(tr);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => listings.find((l) => l.id === selectedId) ?? null, [listings, selectedId]);

  // density clustering — group by sub-county; 3+ listings become a cluster bubble
  const { clusters, singles } = useMemo(() => {
    const groups = new Map<string, ListingDTO[]>();
    for (const l of listings) {
      const arr = groups.get(l.subCounty) ?? [];
      arr.push(l);
      groups.set(l.subCounty, arr);
    }
    const clusters: { subCounty: string; items: ListingDTO[]; left: number; top: number; freshRatio: number }[] = [];
    const singles: ListingDTO[] = [];
    for (const [subCounty, items] of groups) {
      if (items.length >= 3) {
        const left = items.reduce((s, l) => s + pinPos(l).left, 0) / items.length;
        const top = items.reduce((s, l) => s + pinPos(l).top, 0) / items.length;
        const freshRatio = items.filter((l) => l.freshH <= 24).length / items.length;
        clusters.push({ subCounty, items, left, top, freshRatio });
      } else {
        singles.push(...items);
      }
    }
    // relaxation pass — nudge overlapping cluster bubbles apart so neighbors
    // (e.g. Kasarani vs Roysambu) never hide each other. Deterministic.
    const MIN_DIST = 9; // % of map box — clears the largest 52px bubble
    for (let iter = 0; iter < 12; iter++) {
      let moved = false;
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const a = clusters[i];
          const b = clusters[j];
          const dx = b.left - a.left;
          const dy = b.top - a.top;
          const dist = Math.hypot(dx, dy);
          if (dist < MIN_DIST) {
            const push = (MIN_DIST - dist) / 2;
            const nx = dist === 0 ? 1 : dx / dist;
            const ny = dist === 0 ? -0.6 : dy / dist;
            a.left = clamp(a.left - nx * push, 4, 96);
            a.top = clamp(a.top - ny * push, 6, 92);
            b.left = clamp(b.left + nx * push, 4, 96);
            b.top = clamp(b.top + ny * push, 6, 92);
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    return { clusters, singles };
  }, [listings]);

  const clusterItems = openCluster ? listings.filter((l) => l.subCounty === openCluster) : [];

  // group trends: borough -> deduped sub-counties
  const byBorough = useMemo(() => {
    const m = new Map<string, Map<string, { avg: number; count: number; n: number }>>();
    for (const t of trends) {
      const b = m.get(t.borough) ?? new Map<string, { avg: number; count: number; n: number }>();
      const cur = b.get(t.subCounty) ?? { avg: 0, count: 0, n: 0 };
      b.set(t.subCounty, { avg: cur.avg + t.avgPrice, count: cur.count + t.count, n: cur.n + 1 });
      m.set(t.borough, b);
    }
    return m;
  }, [trends]);

  const weatherChips = useMemo(
    () => BOROUGH_INFO.map((b) => ({ borough: b.name, temp: estateWeather(b.estates.split("•")[0].trim()).temp })),
    []
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-extrabold text-body">Nairobi discovery map</h1>
          <p className="mt-0.5 text-[12px] text-kmuted">Clustered by borough • illustrative until live GIS</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-trust px-3 py-1 text-[10.5px] font-extrabold text-white">
            {ALL_SUB_COUNTIES.length} sub-counties covered
          </span>
          <div className="inline-flex rounded-full border border-kline bg-card p-1" role="tablist" aria-label="Map mode">
            {(["listings", "pulse"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "touch-target rounded-full px-4 text-[12px] font-extrabold transition-colors",
                  mode === m ? "bg-ink text-white" : "text-kmuted hover:text-body"
                )}
              >
                {m === "listings" ? "Listings" : "Market pulse"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* weather strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" aria-label="Weather by borough">
        {weatherChips.map((w) => (
          <span key={w.borough} className="flex shrink-0 items-center gap-1.5 rounded-full border border-kline bg-card px-3 py-1.5 text-[11px] font-bold text-body">
            <CloudSun className="h-3.5 w-3.5 text-trust" /> {w.borough}: {w.temp}°C
          </span>
        ))}
      </div>

      {failed && (
        <div className="mt-4 rounded-3xl border border-kline bg-card p-8 text-center">
          <p className="font-display text-[15px] font-extrabold text-body">Map data failed to load</p>
          <button onClick={() => void load()} className="touch-target mt-3 rounded-full bg-trust px-5 font-extrabold text-[12.5px] text-white">
            Retry
          </button>
        </div>
      )}

      {/* ============ LISTINGS MODE ============ */}
      {mode === "listings" && !failed && (
        <div className="mt-4">
          {loading ? (
            <MapSkeleton />
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-kline p-12 text-center">
              <MapPin className="mx-auto h-7 w-7 text-kmuted" />
              <p className="mt-2 text-[13px] font-bold text-body">No listings to map yet</p>
              <p className="text-[12px] text-kmuted">Approved listings with coordinates appear as pins here.</p>
            </div>
          ) : (
            <div className="relative h-[560px] overflow-hidden rounded-3xl border border-kline keja-map" aria-label="Nairobi listings map">
              {/* roads overlay — illustrative */}
              {ROADS.map((r) => (
                <div key={r.cls} aria-hidden className={cn("pointer-events-none absolute -left-[10%] h-1.5 w-[120%] bg-kline/80", r.cls)} style={{ top: r.top }} />
              ))}

              {/* individual pins (areas with only 1-2 listings) */}
              {singles.map((l, i) => {
                const p = pinPos(l);
                const active = l.id === selectedId;
                const fresh = l.freshH <= 24; // green = fresh/available-heavy per legend
                return (
                  <div key={l.id} className="absolute" style={{ left: `${p.left}%`, top: `${p.top}%`, transform: "translate(-50%, -50%)" }}>
                    <button
                      onClick={() => setSelectedId(active ? null : l.id)}
                      aria-label={`${l.estate} • ${kes(l.price)}${fresh ? " • fresh" : ""}`}
                      aria-pressed={active}
                      style={{ animationDelay: `${(i % 12) * 110}ms` }}
                      className={cn(
                        "bounce-pin grid place-items-center rounded-full p-1.5 shadow-md ring-2 ring-white transition-all",
                        active
                          ? "z-10 scale-125 bg-ink text-white"
                          : fresh
                            ? "bg-verified text-white hover:bg-verified/90"
                            : "bg-trust text-white hover:bg-trust/90"
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5 fill-white" />
                    </button>
                  </div>
                );
              })}

              {/* density clusters — sub-counties with 3+ listings, sized by count */}
              {clusters.map((c) => {
                const size = c.items.length >= 7 ? 52 : c.items.length >= 5 ? 46 : 40;
                const open = openCluster === c.subCounty;
                return (
                  <div
                    key={c.subCounty}
                    className="absolute"
                    style={{ left: `${c.left}%`, top: `${c.top}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <button
                      onClick={() => setOpenCluster(open ? null : c.subCounty)}
                      aria-label={`${c.subCounty} cluster — ${c.items.length} listings`}
                      aria-pressed={open}
                      style={{ width: size, height: size, animationDelay: `${(c.subCounty.length % 8) * 110}ms` }}
                      className={cn(
                        "bounce-pin grid place-items-center rounded-full text-center shadow-lg ring-[3px] ring-white/90 transition-all hover:scale-110",
                        open
                          ? "z-10 bg-ink text-white"
                          : c.freshRatio >= 0.6
                            ? "bg-verified text-white"
                            : "bg-trust text-white"
                      )}
                    >
                      <span className="leading-none">
                        <span className="block font-display text-[14px] font-extrabold tabular-nums">{c.items.length}</span>
                        <span className="block text-[7px] font-extrabold uppercase tracking-wide opacity-90">kejas</span>
                      </span>
                    </button>
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface/90 px-2 py-0.5 text-[8.5px] font-extrabold text-body shadow-sm",
                        open && "bg-ink text-white"
                      )}
                    >
                      {c.subCounty}
                    </span>
                  </div>
                );
              })}

              {/* cluster panel — listings inside the open cluster */}
              {openCluster && clusterItems.length > 0 && (
                <div
                  className="slide-up absolute inset-x-3 bottom-10 z-20 overflow-hidden rounded-2xl border border-kline bg-surface shadow-2xl"
                  role="dialog"
                  aria-label={`${openCluster} cluster listings`}
                >
                  <div className="flex items-center justify-between border-b border-kline bg-kbg/60 px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 font-display text-[12.5px] font-extrabold text-body">
                      <Layers className="h-3.5 w-3.5 text-trust" /> {openCluster} • {clusterItems.length} kejas
                    </p>
                    <button
                      onClick={() => setOpenCluster(null)}
                      aria-label="Close cluster"
                      className="touch-target grid place-items-center rounded-full p-1 hover:bg-kline"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ul className="keja-scroll max-h-[190px] overflow-y-auto">
                    {clusterItems.map((l) => (
                      <li key={l.id}>
                        <button
                          onClick={() => {
                            setOpenCluster(null);
                            navigate("listing", { listingId: l.id });
                          }}
                          className="flex w-full items-center gap-3 border-b border-kline/60 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-kbg"
                        >
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", l.freshH <= 24 ? "bg-verified" : "bg-trust")} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11.5px] font-extrabold text-body">
                              {kes(l.price)} • {l.estate} • {l.beds}
                            </span>
                            <span className="block truncate text-[9.5px] font-semibold text-kmuted">
                              {l.title} • {l.freshH <= 24 ? "fresh" : `${l.freshH}h`}
                            </span>
                          </span>
                          {l.poster.verificationStatus === "verified" && (
                            <span className="shrink-0 rounded-full bg-verified-soft px-1.5 py-0.5 text-[8.5px] font-extrabold text-ok-strong">✓</span>
                          )}
                          <MapPin className="h-3 w-3 shrink-0 text-kmuted" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* selected mini card */}
              {selected && (() => {
                const p = pinPos(selected);
                const walkMin = Math.round(selected.distanceToRoadM / 70);
                return (
                  <div
                    className="slide-up absolute z-20 w-[232px] rounded-2xl border border-kline bg-surface p-3.5 shadow-xl"
                    style={{
                      left: `${clamp(p.left, 4, 68)}%`,
                      top: `${p.top > 52 ? clamp(p.top - 30, 4, 62) : clamp(p.top + 9, 4, 62)}%`,
                    }}
                    role="dialog"
                    aria-label={`Listing in ${selected.estate}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-[15px] font-extrabold text-body">
                        {kes(selected.price)}
                        <span className="text-[10.5px] font-semibold text-kmuted"> /mo</span>
                      </p>
                      <button onClick={() => setSelectedId(null)} aria-label="Close preview" className="touch-target grid place-items-center rounded-full hover:bg-kbg">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-[11.5px] font-bold text-body/85">{selected.estate} • {selected.beds}</p>
                    <p className="mt-0.5 text-[10.5px] text-kmuted">
                      {selected.distanceToRoadM}m to road • {walkMin} min walk
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-trust-soft px-2 py-0.5 text-[10px] font-extrabold text-trust">{selected.weather.temp}°C</span>
                      {selected.poster.verificationStatus === "verified" && (
                        <span className="rounded-full bg-verified-soft px-2 py-0.5 text-[10px] font-extrabold text-ok">Verified</span>
                      )}
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate("listing", { listingId: selected.id })}
                        className="touch-target rounded-full bg-ink text-[11.5px] font-extrabold text-white"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setSelectedId(null)}
                        className="touch-target rounded-full border border-kline text-[11.5px] font-extrabold text-body hover:bg-kbg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* legend */}
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface/85 px-3.5 py-2 text-[10px] font-semibold text-body/80 backdrop-blur-sm">
                <span className="flex items-center gap-1.5">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-trust text-[7px] font-extrabold text-white" aria-hidden>3</span>
                  Cluster = 3+ kejas in a sub-county
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-trust" aria-hidden /> Blue = available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-verified" aria-hidden /> Green = fresh-heavy
                </span>
                <span className="hidden text-kmuted sm:inline">Map geometry is illustrative until live GIS is connected</span>
              </div>
            </div>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-kmuted">
            <Play className="h-3 w-3" /> Tap a cluster to open its keja list • tap a single pin to preview price, walk time and weather.
          </p>
        </div>
      )}

      {/* ============ MARKET PULSE MODE ============ */}
      {mode === "pulse" && !failed && (
        <div className="mt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Price trends • sub-county level</p>
          {loading ? (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 rounded-3xl shimmer" />)}
            </div>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {BOROUGH_INFO.map((b) => {
                const rows = Array.from(byBorough.get(b.name)?.entries() ?? []);
                return (
                  <section key={b.name} className="rounded-3xl border border-kline bg-card p-4">
                    <header className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-[14px] font-extrabold text-body">{b.name}</h3>
                      <TrendingUp className={cn("h-4 w-4", rows.some(([, r]) => r.count > 1) ? "text-verified" : "text-kmuted")} />
                    </header>
                    <p className="mt-0.5 text-[10.5px] text-kmuted">{b.estates}</p>
                    <ul className="mt-2.5 max-h-40 space-y-1 overflow-y-auto keja-scroll pr-1">
                      {rows.length > 0 ? (
                        rows.map(([sub, r]) => (
                          <li key={sub} className="flex items-center justify-between gap-2 rounded-xl bg-kbg px-3 py-2 text-[11px]">
                            <span className="min-w-0 truncate font-bold text-body">
                              {sub} — avg {kes(Math.round(r.avg / r.n))}
                            </span>
                            <span className="flex shrink-0 items-center gap-1 font-semibold text-kmuted">
                              {r.count > 1 ? <TrendingUp className="h-3 w-3 text-verified" /> : <Minus className="h-3 w-3" />}
                              {r.count} live
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="rounded-xl bg-kbg px-3 py-2 text-[11px] text-kmuted">Reference band {b.price}</li>
                      )}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-kmuted">
            <RefreshCw className="h-3 w-3" /> Configurable borough model — update list without code rewrite.
          </p>
          {!loading && trends.length === 0 && (
            <div className="mt-3 rounded-2xl border border-dashed border-kline p-8 text-center">
              <p className="text-[12.5px] font-bold text-body">No trend data yet</p>
              <p className="text-[11.5px] text-kmuted">
                Sub-county averages appear once listings are approved. <button onClick={() => toast("info", "Borough model is configurable in src/lib/nairobi.ts")} className="font-bold text-trust underline">How it works</button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
