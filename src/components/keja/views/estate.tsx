"use client";
// KEJA HALISI — EstateView: /nairobi/[borough]/[subCounty]/[estate]/[beds]
// Breadcrumb + smart-filters sidebar + listing grid / demo map layer + weather + SEO box.
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Search, SlidersHorizontal, LayoutGrid, Map as MapIcon,
  RotateCcw, MapPin, CloudSun, X, Home as HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { ALL_SUB_COUNTIES, AMENITY_OPTIONS, BEDS_OPTIONS, estateWeather, kes } from "@/lib/nairobi";
import { fetchListings } from "../api";
import { ListingCard, ListingCardSkeleton } from "../listing-card";
import type { ListingDTO } from "@/lib/types";

const PRICE_MIN = 3000;
const PRICE_MAX = 100000;

export default function EstateView() {
  const { filters, setFilters, resetFilters, navigate } = useKeja();

  const [amenities, setAmenities] = useState<string[]>([]);
  const [mapMode, setMapMode] = useState(false);
  const [activePin, setActivePin] = useState<ListingDTO | null>(null);

  /* ------- deep-link params (navigate("estate", {borough,...})) -> filters, once ------- */
  useEffect(() => {
    const p = useKeja.getState().params;
    const patch: Partial<ReturnType<typeof useKeja.getState>["filters"]> = {};
    if (p.borough) patch.borough = p.borough;
    if (p.subCounty) patch.subCounty = p.subCounty;
    if (p.estate !== undefined) patch.estate = p.estate;
    if (p.beds) patch.beds = p.beds;
    if (p.q !== undefined) patch.q = p.q;
    if (p.minPrice !== undefined) patch.minPrice = p.minPrice;
    if (p.maxPrice !== undefined) patch.maxPrice = p.maxPrice;
    if (Object.keys(patch).length > 0) setFilters(patch);
  }, [setFilters]);

  /* ------- fetch on every filter change (loading is derived from the query key) ------- */
  const query = useMemo(
    () => ({
      q: filters.q || undefined,
      borough: filters.borough || undefined,
      subCounty: filters.subCounty || undefined,
      estate: filters.estate || undefined,
      beds: filters.beds || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      fresh: filters.fresh,
      noFee: filters.noFee,
      verified: filters.verified,
      available: filters.available,
      sort: filters.sort,
      limit: 60,
    }),
    [filters]
  );
  const queryKey = JSON.stringify(query);
  const [payload, setPayload] = useState<{ key: string; rows: ListingDTO[] }>({ key: "", rows: [] });
  const loading = payload.key !== queryKey;
  const listings = payload.rows;

  useEffect(() => {
    let alive = true;
    fetchListings(query)
      .then((rows) => { if (alive) { setPayload({ key: queryKey, rows }); setActivePin(null); } })
      .catch(() => { if (alive) setPayload({ key: queryKey, rows: [] }); });
    return () => { alive = false; };
  }, [query, queryKey]);

  /* ------- amenity filtering is client-side (API has no amenity param) ------- */
  const visible = useMemo(
    () =>
      amenities.length === 0
        ? listings
        : listings.filter((l) => amenities.every((a) => l.amenities.includes(a))),
    [listings, amenities]
  );

  /* ------- map bounds (normalized with padding) ------- */
  const bounds = useMemo(() => {
    if (visible.length === 0) return null;
    const lats = visible.map((l) => l.lat);
    const lngs = visible.map((l) => l.lng);
    const pad = 0.004;
    const minLat = Math.min(...lats) - pad;
    const maxLat = Math.max(...lats) + pad;
    const minLng = Math.min(...lngs) - pad;
    const maxLng = Math.max(...lngs) + pad;
    return { minLat, maxLat, minLng, maxLng };
  }, [visible]);

  const pinPos = (l: ListingDTO) => {
    if (!bounds) return { left: "50%", top: "50%" };
    const nx = bounds.maxLng - bounds.minLng === 0 ? 0.5 : (l.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
    const ny = bounds.maxLat - bounds.minLat === 0 ? 0.5 : (l.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
    return { left: `${8 + nx * 84}%`, top: `${88 - ny * 76}%` };
  };

  const weather = estateWeather(filters.estate || "Nairobi");
  const titleScope = filters.estate || filters.borough || "Nairobi";

  const clearAll = () => {
    resetFilters();
    setAmenities([]);
    setMapMode(false);
    toast("success", "Filters reset");
  };

  const toggleBed = (b: string) => setFilters({ beds: filters.beds === b ? "" : b });
  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const trustChips: { label: string; active: boolean; activeCls: string; onClick: () => void }[] = [
    { label: "Fresh ≤24h", active: filters.fresh, activeCls: "bg-ink text-white", onClick: () => setFilters({ fresh: !filters.fresh }) },
    { label: "No Viewing Fee", active: filters.noFee, activeCls: "bg-trust text-white", onClick: () => setFilters({ noFee: !filters.noFee }) },
    { label: "Verified Only", active: filters.verified, activeCls: "bg-verified text-white", onClick: () => setFilters({ verified: !filters.verified }) },
    { label: "Available Only", active: filters.available, activeCls: "bg-ink text-white", onClick: () => setFilters({ available: !filters.available }) },
    {
      label: "Sort: Response ↓ fastest",
      active: filters.sort === "response",
      activeCls: "bg-trust text-white",
      onClick: () => setFilters({ sort: filters.sort === "response" ? "fresh" : "response" }),
    },
  ];

  /* breadcrumb model */
  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: "Nairobi", onClick: () => setFilters({ borough: "", subCounty: "", estate: "", beds: "" }) },
    { label: filters.borough || "All", onClick: filters.borough ? () => setFilters({ subCounty: "", estate: "" }) : undefined },
    { label: filters.subCounty || "Sub-county", onClick: filters.subCounty ? () => setFilters({ estate: "" }) : undefined },
    { label: filters.estate || "All estates", onClick: filters.estate ? () => setFilters({ beds: "" }) : undefined },
  ];
  if (filters.beds) crumbs.push({ label: filters.beds });

  const subCountyOptions = ALL_SUB_COUNTIES;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* ============================ 1. BREADCRUMB ============================ */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-0.5 text-[12px] font-bold text-kmuted">
        <HomeIcon className="mr-1 h-3.5 w-3.5 text-trust" aria-hidden />
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="flex items-center gap-0.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-kline" aria-hidden />}
            {c.onClick ? (
              <button onClick={c.onClick} className="min-h-11 rounded-lg px-1.5 py-2 font-bold hover:text-trust hover:underline">
                {c.label}
              </button>
            ) : (
              <span className="px-1.5 text-body" aria-current="page">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* ============================ 2. LAYOUT GRID ============================ */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ======================= 3. SIDEBAR: SMART FILTERS ======================= */}
        <aside className="hidden self-start lg:sticky lg:top-24 lg:block" aria-label="Smart filters">
          <div className="rounded-3xl border border-kline bg-surface p-4">
            <h2 className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
              <SlidersHorizontal className="h-4 w-4 text-trust" /> Smart filters
            </h2>

            {/* search */}
            <div className="relative mt-3.5">
              <label htmlFor="estate-search" className="sr-only">Search estate or landmark</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kmuted" />
              <input
                id="estate-search"
                value={filters.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                placeholder="Search estate / landmark..."
                className="w-full rounded-xl border border-kline bg-kbg py-2.5 pl-9 pr-8 text-[12.5px] font-semibold outline-none focus:border-trust focus:bg-surface focus:ring-4 focus:ring-trust/10"
              />
              {filters.q && (
                <button
                  onClick={() => setFilters({ q: "" })}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full hover:bg-kline"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* sub-county */}
            <label className="mt-3.5 block text-[10px] font-extrabold uppercase tracking-wider text-kmuted" htmlFor="sc-select">
              Sub-county
            </label>
            <select
              id="sc-select"
              value={filters.subCounty}
              onChange={(e) => setFilters({ subCounty: e.target.value, estate: "" })}
              className="mt-1 w-full rounded-xl border border-kline bg-surface px-3 py-2.5 text-[12.5px] font-bold text-body outline-none focus:border-trust"
            >
              <option value="">All Nairobi</option>
              {subCountyOptions.map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>

            {/* sort */}
            <label className="mt-3.5 block text-[10px] font-extrabold uppercase tracking-wider text-kmuted" htmlFor="sort-select">
              Sort by
            </label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value as typeof filters.sort })}
              className="mt-1 w-full rounded-xl border border-kline bg-surface px-3 py-2.5 text-[12.5px] font-bold text-body outline-none focus:border-trust"
            >
              <option value="fresh">Newest first</option>
              <option value="price_asc">Lowest rent</option>
              <option value="price_desc">Highest rent</option>
              <option value="response">Fastest response</option>
            </select>

            {/* price dual slider */}
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-kmuted">Price KES</p>
            <p className="mt-1 font-display text-[13px] font-extrabold text-trust">
              KES {filters.minPrice.toLocaleString()} – KES {filters.maxPrice.toLocaleString()}
            </p>
            <div className="relative mt-2 h-6">
              <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-kline" aria-hidden />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-trust"
                style={{
                  left: `${((filters.minPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                  right: `${100 - ((filters.maxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                }}
                aria-hidden
              />
              <input
                type="range" min={PRICE_MIN} max={PRICE_MAX} step={1000} value={filters.minPrice}
                onChange={(e) => setFilters({ minPrice: Math.min(Number(e.target.value), filters.maxPrice) })}
                aria-label="Minimum price"
                className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-trust [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow"
              />
              <input
                type="range" min={PRICE_MIN} max={PRICE_MAX} step={1000} value={filters.maxPrice}
                onChange={(e) => setFilters({ maxPrice: Math.max(Number(e.target.value), filters.minPrice) })}
                aria-label="Maximum price"
                className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-trust [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow"
              />
            </div>

            {/* beds */}
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-kmuted">Beds</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Beds filter">
              {BEDS_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBed(b)}
                  aria-pressed={filters.beds === b}
                  className={cn(
                    "min-h-11 rounded-full px-3.5 py-2 text-[11.5px] font-extrabold transition-colors",
                    filters.beds === b ? "bg-ink text-white" : "bg-kbg text-body/70 hover:bg-ink/10"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* amenities */}
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-kmuted">Amenities</p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1" role="group" aria-label="Amenities filter">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a} className="flex min-h-11 cursor-pointer items-center gap-1.5 text-[11.5px] font-bold text-body/80">
                  <input
                    type="checkbox"
                    checked={amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="accent-verified"
                  />
                  {a}
                </label>
              ))}
            </div>

            {/* trust filters */}
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-kmuted">Trust filters</p>
            <div className="mt-1.5 space-y-1" role="group" aria-label="Trust filters">
              {([
                ["fresh", "Fresh ≤24h"],
                ["available", "Available now"],
                ["noFee", "No viewing fee signal"],
                ["verified", "Verified profile signal"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 text-[12px] font-bold text-body/80">
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={(e) => setFilters({ [key]: e.target.checked })}
                    className="accent-verified"
                  />
                  {label}
                </label>
              ))}
            </div>

            <button
              onClick={clearAll}
              className="touch-target mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-kline text-[12.5px] font-extrabold text-body hover:bg-kbg"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear filters
            </button>

            <p className="mt-3.5 rounded-xl bg-trust-soft px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-trust">
              Market agility mode: use Fresh + Available when you are moving soon.
            </p>
          </div>

          {/* ==================== 7. WEATHER WIDGET ==================== */}
          <div className="mt-4 rounded-3xl border border-kline bg-surface p-4">
            <h3 className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
              <CloudSun className="h-4 w-4 text-gold" /> Weather • {filters.estate || "Nairobi"}
            </h3>
            <p className="mt-2 font-display text-2xl font-extrabold text-body">
              {weather.temp}°C <span className="text-[12px] font-bold text-kmuted">{weather.note}</span>
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-kmuted">
              5km from CBD, avg 400m to main road
            </p>
          </div>
        </aside>

        {/* ================================ MAIN ================================ */}
        <main>
          {/* header row */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-extrabold text-body sm:text-2xl">
                Fresh houses for {titleScope}
                {filters.beds ? ` • ${filters.beds}` : ""}
              </h1>
              <p className="mt-1 text-[12.5px] font-semibold text-kmuted">
                {loading ? "Scanning catalog…" : `${visible.length} listings match your Nairobi filters`}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-kline" role="group" aria-label="View mode">
              <button
                onClick={() => setMapMode(false)}
                aria-pressed={!mapMode}
                className={cn(
                  "min-h-11 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-extrabold transition-colors",
                  !mapMode ? "bg-ink text-white" : "text-kmuted hover:bg-kbg"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cards
              </button>
              <button
                onClick={() => setMapMode(true)}
                aria-pressed={mapMode}
                className={cn(
                  "min-h-11 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11.5px] font-extrabold transition-colors",
                  mapMode ? "bg-ink text-white" : "text-kmuted hover:bg-kbg"
                )}
              >
                <MapIcon className="h-3.5 w-3.5" /> Map
              </button>
            </div>
          </div>

          {/* trust quick chips */}
          <div className="keja-scroll mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Quick trust filters">
            {trustChips.map((c) => (
              <button
                key={c.label}
                onClick={c.onClick}
                aria-pressed={c.active}
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-4 py-2.5 text-[11.5px] font-extrabold transition-colors",
                  c.active ? c.activeCls + " shadow-md" : "bg-surface text-body/65 ring-1 ring-kline hover:bg-kbg"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* ============ 5/6. GRID or MAP ============ */}
          {loading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : mapMode ? (
            /* ---------- demo map layer ---------- */
            <div className="mt-5">
              <div className="keja-map relative h-[420px] overflow-hidden rounded-3xl border border-kline shadow-sm" role="img" aria-label="Demo map of Nairobi listings">
                <span className="absolute left-3 top-3 z-20 rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-white backdrop-blur-sm">
                  NAIROBI • DEMO MAP LAYER
                </span>

                {bounds ? (
                  visible.map((l) => {
                    const pos = pinPos(l);
                    const isActive = activePin?.id === l.id;
                    return (
                      <span key={l.id} className="absolute z-10" style={pos}>
                        <button
                          onClick={() => {
                            setActivePin(isActive ? null : l);
                            toast("info", `Pin • ${l.estate} • ${kes(l.price)} • Mini card`);
                          }}
                          aria-label={`Listing pin ${l.estate} ${kes(l.price)}`}
                          className={cn(
                            "bounce-pin grid h-9 w-9 place-items-center rounded-full bg-trust text-white ring-2 ring-white shadow-lg transition-transform hover:scale-110",
                            isActive && "scale-110 bg-verified ring-4 ring-verified/25"
                          )}
                          style={{ animationDelay: `${(l.lat * 1000) % 1.2}s` }}
                        >
                          <MapPin className="h-4 w-4 fill-white/20" />
                        </button>

                        {/* mini card overlay near pin */}
                        {isActive && (
                          <div className="slide-up absolute left-1/2 top-full z-30 mt-2 w-48 -translate-x-1/2 rounded-2xl border border-kline bg-surface p-3 shadow-xl pop">
                            <p className="font-display text-[14px] font-extrabold text-body">{kes(l.price)}<span className="text-[10px] font-bold text-kmuted"> /mo</span></p>
                            <p className="mt-0.5 text-[11px] font-bold text-body/80">{l.estate} • {l.beds}</p>
                            <p className="text-[10px] font-semibold text-kmuted">{l.road ?? l.subCounty} • {l.distanceToRoadM}m to road</p>
                            <button
                              onClick={() => navigate("listing", { listingId: l.id })}
                              className="touch-target mt-2 w-full rounded-full bg-ink py-2 text-[11px] font-extrabold text-white"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </span>
                    );
                  })
                ) : (
                  <p className="absolute inset-0 grid place-items-center text-[12.5px] font-bold text-kmuted">
                    No pins to plot — widen the filters
                  </p>
                )}
              </div>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-kmuted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-trust" /> Blue = listings cluster
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-verified" /> Green = fresh/available heavy
                </span>
              </p>
            </div>
          ) : visible.length === 0 ? (
            /* ---------- empty state ---------- */
            <div className="mt-5 rounded-3xl border border-dashed border-kline bg-surface p-10 text-center">
              <MapPin className="mx-auto h-8 w-8 text-kline" aria-hidden />
              <p className="mt-3 font-display text-[15px] font-extrabold text-body">No matching demo listings</p>
              <p className="mx-auto mt-1.5 max-w-md text-[12.5px] font-semibold leading-relaxed text-kmuted">
                Try a wider budget, another sub-county, or clear the freshness filters.
              </p>
              <button
                onClick={clearAll}
                className="touch-target mt-4 rounded-full bg-ink px-5 py-2.5 text-[12px] font-extrabold text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* ---------- listing grid ---------- */
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {/* ============================ 8. SEO TEXT BOX ============================ */}
          <p className="mt-8 rounded-2xl bg-kbg px-4 py-3.5 text-[11.5px] font-medium leading-relaxed text-kmuted">
            Verified 1BR houses in {filters.estate || "Nairobi"} near main roads — borehole + county water, fibre, tokens. Bedsitter 7k-12k, 1BR 28k-45k (Kileleshwa), 2BR 45k-70k. No viewing fee before viewing. Hakuna Kulipa Kabla Ya Kuona Nyumba.
          </p>
        </main>
      </div>

    </div>
  );
}
