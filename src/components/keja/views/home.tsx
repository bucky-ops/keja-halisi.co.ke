"use client";
// KEJA HALISI — HomeView: hero "Stop Scrolling Fake Kejas", Find Keja search card,
// stats strip, borough explorer, market pulse, featured TikTok rail, how-it-works, trust pills.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ArrowRight, BadgeCheck, ShieldCheck, Building2, Flag, CalendarClock,
  Play, Zap, MapPin, Smartphone, Ban, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import { BOROUGHS, BOROUGH_INFO, BEDS_OPTIONS } from "@/lib/nairobi";
import { fetchListings, fetchMarketPulse, fetchHomeStats } from "../api";
import { MiniListingCard } from "../listing-card";
import { MarketPulse, Trustbar, StatsStrip } from "../market-pulse";
import type { HomeStats, ListingDTO, MarketPulse as MarketPulseData } from "@/lib/types";

/* ---------- count-up (rAF, 1.8s ease-out) ---------- */
function useCountUp(target: number, duration = 1800): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const from = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - from) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

const AGENTS_ONLINE = 1247;

export default function HomeView() {
  const { navigate, setFilters, filters } = useKeja();
  const t = useT();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [pulse, setPulse] = useState<MarketPulseData | null>(null);
  const [catalog, setCatalog] = useState<ListingDTO[]>([]);
  const [featured, setFeatured] = useState<ListingDTO[]>([]);
  const [featuredReady, setFeaturedReady] = useState(false);

  /* --- Find Keja card state --- */
  const [estateInput, setEstateInput] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [beds, setBeds] = useState<string>("");
  const [budget, setBudget] = useState({ min: 3000, max: 100000 });
  const [borough, setBorough] = useState<string>(filters.borough || "Western");

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const s = await fetchHomeStats(); if (alive) setStats(s); } catch { /* demo defaults */ }
      try { const p = await fetchMarketPulse(); if (alive) setPulse(p); } catch { /* demo defaults */ }
      try { const c = await fetchListings({ limit: 60 }); if (alive) setCatalog(c); } catch { /* empty states handle */ }
      try { const f = await fetchListings({ verified: true, sort: "response", limit: 12 }); if (alive) setFeatured(f); } catch { /* empty states handle */ } finally { if (alive) setFeaturedReady(true); }
    })();
    return () => { alive = false; };
  }, []);

  const uniqueEstates = useMemo(
    () => Array.from(new Set(catalog.map((l) => l.estate))),
    [catalog]
  );
  const suggestions = useMemo(() => {
    const q = estateInput.trim().toLowerCase();
    return uniqueEstates.filter((e) => e.toLowerCase().includes(q)).slice(0, 6);
  }, [estateInput, uniqueEstates]);

  /* featured = verified + fresh first (TikTok rail) */
  const railItems = useMemo(() => {
    const fresh = featured.filter((l) => l.freshH <= 24);
    return fresh.length >= 4 ? fresh : featured;
  }, [featured]);

  /* count-ups for trust snapshot */
  const agents = useCountUp(stats?.verifiedAgents ?? 1247);
  const units = useCountUp(stats?.units ?? 3421);
  const scams = useCountUp(stats?.scamsBlocked ?? 892);

  const runSearch = () => {
    setFilters({ estate: estateInput.trim(), beds, minPrice: budget.min, maxPrice: budget.max });
    toast(
      "info",
      `Searching ${estateInput.trim() || "Nairobi"} • ${beds || "Any"} • KES ${budget.min.toLocaleString()}-${budget.max.toLocaleString()}`
    );
    navigate("estate");
  };

  const pickSubCounty = (b: string, sc: string) => {
    setFilters({ borough: b, subCounty: sc, estate: "" });
    navigate("estate");
  };

  const openFeatured = (l: ListingDTO) => navigate("listing", { listingId: l.id });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* ============================= 1. HERO ============================= */}
      <section className="keja-hero-dark relative -mx-4 -mt-6 overflow-hidden rounded-none px-4 pb-28 pt-10 text-white sm:pt-14" aria-label="Keja Halisi hero">
        <div className="mx-auto max-w-[1240px]">
          {/* eyebrow pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-tiktok-cyan/15 px-3 py-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-tiktok-cyan">
              {t("heroEyebrow")}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-white/80">
              NEXT.JS + SUPABASE READY
            </span>
          </div>

          <div className="mt-7 grid items-start gap-10 lg:grid-cols-[1.35fr_0.65fr]">
            {/* left: headline */}
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-[0.95] sm:text-5xl lg:text-6xl">
                {t("heroTitle1")}
                <br />
                <span className="text-tiktok-pink">{t("heroTitle2")}</span>
              </h1>
              <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-white/75">
                {t("heroSub1")}{" "}
                <strong className="font-extrabold text-tiktok-cyan">{t("heroSub2")}</strong>
              </p>

              {/* color system pills */}
              <div className="mt-6 flex flex-wrap gap-2" aria-label="Brand color system">
                <span className="inline-flex items-center gap-2 rounded-full bg-trust px-3.5 py-2 text-[11px] font-extrabold text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-white/80" /> Trust Blue #1976D2
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-safaricom px-3.5 py-2 text-[11px] font-extrabold text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-white/80" /> Safaricom Green #00B140
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[11px] font-extrabold text-body shadow-lg">
                  <BadgeCheck className="h-3.5 w-3.5 text-verified" /> TikTok Verified
                </span>
              </div>
            </div>

            {/* right: trust snapshot */}
            <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/60">
                <ShieldCheck className="h-4 w-4 text-verified" /> {t("trustSnapshot")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5" role="list">
                {[
                  { icon: BadgeCheck, value: agents.toLocaleString(), label: t("verifiedAgents"), tone: "text-verified" },
                  { icon: Building2, value: units.toLocaleString(), label: t("unitsCatalog"), tone: "text-tiktok-cyan" },
                  { icon: Flag, value: scams.toLocaleString(), label: t("scamsBlocked"), tone: "text-tiktok-pink" },
                  { icon: CalendarClock, value: "7", label: t("recheckWindow"), tone: "text-gold" },
                ].map((s) => (
                  <div key={s.label} role="listitem" className="rounded-2xl bg-black/25 p-3.5">
                    <s.icon className={cn("h-4 w-4", s.tone)} />
                    <p className={cn("mt-1.5 font-display text-2xl font-extrabold", s.tone)}>{s.value}</p>
                    <p className="text-[10px] font-semibold leading-tight text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("payments")}
                className="touch-target mt-4 w-full rounded-full bg-gold px-4 py-3 font-display text-[13px] font-extrabold text-body transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("unlockPro")}
              </button>
            </aside>
          </div>
        </div>
      </section>

      {/* ====================== 2. FIND KEJA SEARCH CARD ====================== */}
      <div className="relative z-10 mx-auto -mt-16 max-w-[880px]">
        <section className="rounded-3xl bg-surface p-5 shadow-2xl sm:p-6" aria-label="Find Keja search">
          <header className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-body">{t("findKeja")}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-soft px-2.5 py-1 text-[10px] font-extrabold text-verified">
              <span className="h-1.5 w-1.5 rounded-full bg-verified pulse-dot" aria-hidden /> LIVE
            </span>
          </header>

          {/* estate autocomplete */}
          <div className="relative mt-4">
            <label htmlFor="find-estate" className="sr-only">Estate or area</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kmuted" />
            <input
              id="find-estate"
              value={estateInput}
              onChange={(e) => { setEstateInput(e.target.value); setSuggestOpen(true); }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
              placeholder={t("findPlaceholder")}
              autoComplete="off"
              className="w-full rounded-2xl border border-kline bg-kbg py-3 pl-10 pr-4 text-[13.5px] font-semibold text-body outline-none placeholder:font-medium placeholder:text-kmuted focus:border-trust focus:bg-surface focus:ring-4 focus:ring-trust/10"
            />
            {suggestOpen && suggestions.length > 0 && (
              <ul
                className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto keja-scroll rounded-2xl border border-kline bg-surface p-1.5 shadow-xl"
                role="listbox"
                aria-label="Estate suggestions"
              >
                {suggestions.map((e) => (
                  <li key={e}>
                    <button
                      type="button"
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => { setEstateInput(e); setSuggestOpen(false); setFilters({ estate: e }); navigate("estate"); }}
                      className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-bold text-body hover:bg-kbg"
                      role="option"
                      aria-selected={estateInput === e}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-trust" /> {e}
                      </span>
                      <span className="text-[10.5px] font-semibold text-kmuted">Verified</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* beds chips */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Bedrooms">
            {BEDS_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBeds(beds === b ? "" : b)}
                aria-pressed={beds === b}
                className={cn(
                  "min-h-11 rounded-full px-4 py-2.5 text-[12px] font-extrabold transition-colors",
                  beds === b ? "bg-ink text-white" : "bg-kbg text-body/70 hover:bg-ink/10"
                )}
              >
                {b}
              </button>
            ))}
          </div>

          {/* budget dual range */}
          <div className="mt-5 rounded-2xl bg-kbg p-4">
            <div className="flex items-center justify-between text-[12px] font-extrabold text-body">
              <span>{t("budgetMonth")}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-surface px-2.5 py-1 text-trust shadow-sm">KES {budget.min.toLocaleString()}</span>
                <span className="text-kmuted">–</span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-trust shadow-sm">KES {budget.max.toLocaleString()}</span>
              </span>
            </div>
            <div className="relative mt-3 h-6">
              <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-kline" aria-hidden />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-trust"
                style={{
                  left: `${((budget.min - 3000) / 97000) * 100}%`,
                  right: `${100 - ((budget.max - 3000) / 97000) * 100}%`,
                }}
                aria-hidden
              />
              <input
                type="range" min={3000} max={100000} step={1000} value={budget.min}
                onChange={(e) => setBudget((b) => ({ ...b, min: Math.min(Number(e.target.value), b.max) }))}
                aria-label="Minimum budget"
                className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-trust [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-md"
              />
              <input
                type="range" min={3000} max={100000} step={1000} value={budget.max}
                onChange={(e) => setBudget((b) => ({ ...b, max: Math.max(Number(e.target.value), b.min) }))}
                aria-label="Maximum budget"
                className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-trust [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
          </div>

          <button
            onClick={runSearch}
            className="touch-target mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-trust py-3.5 font-display text-[15px] font-extrabold text-white shadow-[0_10px_24px_rgba(25,118,210,0.35)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {t("findCta")} <ArrowRight className="h-4.5 w-4.5" />
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-kmuted">
            <span className="h-1.5 w-1.5 rounded-full bg-verified pulse-dot" aria-hidden />
            {AGENTS_ONLINE.toLocaleString()} {t("findFootnote")}
          </p>
        </section>
      </div>

      {/* ============================ 3. STATS STRIP ============================ */}
      <section className="keja-hero-dark mt-8 rounded-3xl px-4 py-6" aria-label="Platform stats">
        <StatsStrip stats={stats} />
      </section>

      {/* ==================== 4. BOROUGH + SUB-COUNTY CHIPS ==================== */}
      <section className="mt-10" aria-label="Explore Nairobi by borough">
        <h2 className="font-display text-xl font-extrabold text-body">{t("exploreBoroughs")}</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Boroughs">
          {Object.keys(BOROUGHS).map((b) => (
            <button
              key={b}
              onClick={() => setBorough(b)}
              aria-pressed={borough === b}
              className={cn(
                "min-h-11 rounded-full px-4 py-2.5 text-[12px] font-extrabold transition-colors",
                borough === b ? "bg-ink text-white shadow-md" : "bg-surface text-body/70 ring-1 ring-kline hover:bg-kbg"
              )}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`${borough} sub-counties`}>
          {(BOROUGHS[borough] ?? []).map((sc) => (
            <button
              key={sc}
              onClick={() => pickSubCounty(borough, sc)}
              className="min-h-11 inline-flex items-center gap-1.5 rounded-full bg-trust-soft px-4 py-2.5 text-[12px] font-extrabold text-trust transition-colors hover:bg-trust hover:text-white"
            >
              {sc} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BOROUGH_INFO.map((b) => (
            <button
              key={b.name}
              onClick={() => pickSubCounty(b.name, (BOROUGHS[b.name] ?? [])[0] ?? "")}
              className={cn(
                "rounded-2xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                borough === b.name ? "border-ink bg-ink text-white" : "border-kline bg-surface"
              )}
            >
              <p className={cn("font-display text-[13px] font-extrabold", borough === b.name ? "text-white" : "text-body")}>{b.name}</p>
              <p className={cn("mt-1.5 line-clamp-2 text-[10px] font-semibold leading-snug", borough === b.name ? "text-white/60" : "text-kmuted")}>{b.estates}</p>
              <p className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-extrabold", borough === b.name ? "bg-white/15 text-tiktok-cyan" : "bg-trust-soft text-trust")}>{b.price}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ================= 5. MARKET PULSE + TRUSTBAR (2-col) ================= */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2" aria-label="Live market intelligence">
        <MarketPulse pulse={pulse} />
        <Trustbar />
      </section>

      {/* =================== 6. FEATURED VERIFIED TIKTOK RAIL =================== */}
      <section className="mt-10" aria-label="Featured verified listings">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold text-body">{t("featuredTitle")}</h2>
            <p className="mt-1 text-[12px] font-semibold text-kmuted">{t("featuredSub")}</p>
          </div>
          <button
            onClick={() => navigate("estate")}
            className="touch-target hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12px] font-extrabold text-white sm:inline-flex"
          >
            {t("browseAll")} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {!featuredReady ? (
          <div className="mt-4 flex gap-4 overflow-hidden" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-44 shrink-0">
                <div className="h-24 rounded-2xl shimmer" />
                <div className="mt-2 h-3 w-24 rounded shimmer" />
                <div className="mt-1.5 h-2.5 w-32 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : railItems.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-kline bg-surface p-5 text-[13px] font-semibold text-kmuted">
            No verified listings yet — check the estates view for fresh demo data.
          </p>
        ) : (
          <div className="keja-scroll -mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 pt-1">
            {railItems.map((l) => (
              <MiniListingCard key={l.id} listing={l} onOpen={() => openFeatured(l)} />
            ))}
            <button
              onClick={() => navigate("estate")}
              className="grid w-44 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-kline text-[12px] font-extrabold text-kmuted transition-colors hover:border-trust hover:text-trust"
            >
              View all kejas →
            </button>
          </div>
        )}
      </section>

      {/* ========================== 7. HOW IT WORKS ========================== */}
      <section className="mt-10 rounded-3xl border border-kline bg-surface p-5 sm:p-6" aria-label="How Keja Halisi works">
        <h2 className="font-display text-xl font-extrabold text-body">{t("howItWorks")}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { n: 1, icon: Play, title: t("how1t"), sub: t("how1d") },
            { n: 2, icon: ShieldCheck, title: t("how2t"), sub: t("how2d") },
            { n: 3, icon: BadgeCheck, title: t("how3t"), sub: t("how3d") },
            { n: 4, icon: Smartphone, title: t("how4t"), sub: t("how4d") },
          ] as { n: number; icon: typeof Play; title: string; sub: string }[]).map((s, i) => (
            <div key={s.n} className="relative rounded-2xl bg-kbg p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink font-display text-[14px] font-extrabold text-white">
                  {s.n}
                </span>
                <s.icon className="h-4.5 w-4.5 text-trust" />
              </div>
              <p className="mt-3 font-display text-[13.5px] font-extrabold text-body">{s.title}</p>
              <p className="mt-1 text-[11px] font-semibold leading-snug text-kmuted">{s.sub}</p>
              {i < 3 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-kline lg:block" aria-hidden />
              )}
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-2xl bg-verified py-3 text-center font-display text-[14px] font-extrabold text-white" role="note">
          {t("banner")}
        </p>
      </section>

      {/* ======================== 8. TRUST STRIP PILLS ======================== */}
      <section className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Trust rules">
        {([
          { icon: BadgeCheck, label: `✓ ${t("pillVerified")}`, key: "v" as DictKey },
          { icon: Zap, label: `⚡ ${t("pillExpiry")}`, key: "e" as DictKey },
          { icon: MapPin, label: `📍 ${t("pillLocation")}`, key: "l" as DictKey },
          { icon: Smartphone, label: `📱 ${t("pillCall")}`, key: "c" as DictKey },
          { icon: Ban, label: `🚫 ${t("pillReports")}`, key: "r" as DictKey },
        ]).map((p) => (
          <span
            key={p.key}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2.5 text-[12px] font-extrabold text-body shadow-sm ring-1 ring-kline"
          >
            <p.icon className="h-3.5 w-3.5 text-verified" /> {p.label}
          </span>
        ))}
      </section>
    </div>
  );
}
