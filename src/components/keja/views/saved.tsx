"use client";
// KEJA HALISI — SavedView: renter's shortlist + personal dashboard
// Blueprint "Renter dashboard": Saved / Fresh matches / Leads / Reports + rate-after-viewing loop.
import { useEffect, useMemo, useState } from "react";
import { Heart, Zap, Phone, Flag, SearchX, ArrowRight, Star, ShieldCheck, ArrowLeft, Bell, CalendarCheck, BellRing, Play, Trash2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { fetchListings } from "../api";
import { ListingCard, ListingCardSkeleton, MiniListingCard } from "../listing-card";
import { RatingSheet } from "../rating";
import type { ListingDTO } from "@/lib/types";

interface RatingMemory {
  listingId: string;
  agentHandle: string;
  agentId: string;
  estate: string;
}

export default function SavedView() {
  const { saved, toggleSaved, activity, navigate, back, savedSearches, runSearch, removeSearch } = useKeja();
  const [all, setAll] = useState<ListingDTO[] | null>(null);
  const [rateTarget, setRateTarget] = useState<RatingMemory | null>(null);

  useEffect(() => {
    let alive = true;
    fetchListings({ limit: 60 })
      .then((rows) => alive && setAll(rows))
      .catch(() => alive && setAll([]));
    return () => {
      alive = false;
    };
  }, []);

  const savedListings = useMemo(
    () => (all ?? []).filter((l) => saved.includes(l.id)),
    [all, saved]
  );
  const freshSaved = savedListings.filter((l) => l.freshH <= 24);
  const availableSaved = savedListings.filter((l) => l.status === "Available");

  // pending ratings: leads logged this session whose agent has no rating yet
  const pendingRatings = useMemo(() => {
    if (!all) return [];
    const rated = new Set<string>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("keja-rating-")) rated.add(k.replace("keja-rating-", ""));
      }
    } catch {
      /* ignore */
    }
    return activity.leads > 0
      ? savedListings
          .filter((l) => l.status === "Available" && !rated.has(l.poster.id))
          .slice(0, 3)
          .map((l) => ({ listingId: l.id, agentHandle: l.poster.tiktokHandle, agentId: l.poster.id, estate: l.estate }))
      : [];
  }, [all, savedListings, activity.leads]);

  const metrics = [
    { label: "Saved", value: savedListings.length, icon: Heart, color: "text-tiktok-pink" },
    { label: "Fresh matches", value: freshSaved.length, icon: Zap, color: "text-verified" },
    { label: "Leads", value: activity.leads, icon: Phone, color: "text-trust" },
    { label: "Reports", value: activity.reports, icon: Flag, color: "text-scam" },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-body">Your keja shortlist</h2>
          <p className="mt-0.5 text-[12px] font-semibold text-kmuted">
            Renter dashboard • saved houses, fresh matches and your trust activity — private to this device
          </p>
        </div>
        <button
          onClick={() => {
            navigate("estate");
            toast("info", "Back to browsing verified kejas");
          }}
          className="touch-target ml-auto inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Browse kejas <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* metrics 4-up */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-kline bg-card p-4">
            <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-wide text-kmuted">
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} /> {m.label}
            </p>
            <p className={`mt-1 font-display text-2xl font-extrabold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ===== saved searches (alert manager) ===== */}
      <section className="mt-5 rounded-3xl border border-kline bg-card p-4" aria-label="Saved searches">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-body">
            <BellRing className="h-4 w-4 text-trust" /> Saved searches • {savedSearches.length}
          </p>
          <span className="rounded-full bg-trust-soft px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-trust">
            alerts on
          </span>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-kmuted">
          We scan the catalog while you are here — new matches ring the bell. Set them up from any estate search.
        </p>
        {savedSearches.length === 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("estate")}
              className="touch-target rounded-full bg-trust px-4 py-2 text-[11.5px] font-extrabold text-white transition-transform hover:scale-[1.02]"
            >
              Create your first alert
            </button>
            <span className="text-[10.5px] font-semibold text-kmuted">e.g. “Kasarani • Bedsitter • KES 7k-10k”</span>
          </div>
        ) : (
          <ul className="keja-scroll mt-3 max-h-72 space-y-2 overflow-y-auto">
            {savedSearches.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-kline/70 bg-kbg/50 px-3 py-2.5"
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", s.newCount > 0 ? "bg-verified-soft text-ok-strong pop" : "bg-trust-soft text-trust")}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[11.5px] font-extrabold text-body">
                    {s.label}
                    {s.newCount > 0 && (
                      <span className="shrink-0 rounded-full bg-verified px-1.5 py-0.5 text-[8.5px] font-extrabold text-white">
                        {s.newCount} new
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[9.5px] font-semibold text-kmuted">
                    {[
                      s.filters.estate || s.filters.subCounty || s.filters.borough || "All Nairobi",
                      s.filters.beds,
                      `KES ${s.filters.minPrice >= 1000 ? `${Math.round(s.filters.minPrice / 1000)}k` : s.filters.minPrice}-${s.filters.maxPrice >= 100000 ? "100k+" : `${Math.round(s.filters.maxPrice / 1000)}k`}`,
                      s.filters.fresh ? "fresh" : null,
                      s.filters.verified ? "verified" : null,
                      s.filters.noFee ? "no fee" : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                    {" • "}
                    {s.lastSeen.length} matches
                  </p>
                </div>
                <button
                  onClick={() => runSearch(s.id)}
                  className="touch-target inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[10px] font-extrabold text-white transition-transform hover:scale-105"
                >
                  <Play className="h-3 w-3" /> Run
                </button>
                <button
                  onClick={() => {
                    removeSearch(s.id);
                    toast("info", "Search alert removed");
                  }}
                  aria-label={`Delete saved search ${s.label}`}
                  className="touch-target grid h-8 w-8 shrink-0 place-items-center rounded-full text-kmuted hover:bg-scam-soft hover:text-scam"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* rate-after-viewing loop */}
      {pendingRatings.length > 0 && (
        <section className="mt-5 rounded-3xl border border-gold/40 bg-gold/10 p-4" aria-label="Rate after viewing">
          <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-warn">
            <Star className="h-4 w-4 fill-gold text-gold" />
            Rate after viewing?
          </p>
          <p className="mt-1 text-[11.5px] font-semibold text-warn/90">
            You contacted {activity.leads} agent{activity.leads === 1 ? "" : "s"} this session — ratings help other renters avoid scams.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingRatings.map((r) => (
              <button
                key={r.agentId}
                onClick={() => setRateTarget(r)}
                className="touch-target rounded-full border border-gold/50 bg-surface px-3.5 py-2 text-[11.5px] font-extrabold text-body hover:bg-gold/15"
              >
                ⭐ Rate {r.agentHandle} • {r.estate}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* trust activity: your scam reports + viewing bookings + notifications feed */}
      {(activity.reportLog.length > 0 || activity.notifications.length > 0 || activity.viewingLog.length > 0) && (
        <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Trust activity">
          {activity.reportLog.length > 0 && (
            <div className="rounded-3xl border border-kline bg-card p-4">
              <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-body">
                <Flag className="h-4 w-4 text-scam" /> Your scam reports • {activity.reportLog.length}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-kmuted">
                Community policing — 3 reports on the same keja auto-hide it pending review.
              </p>
              <ul className="keja-scroll mt-3 max-h-56 space-y-2 overflow-y-auto">
                {activity.reportLog.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-kline/70 bg-kbg/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-extrabold text-body">
                        {r.estate} • {r.reason.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="text-[10px] font-semibold text-kmuted">{new Date(r.at).toLocaleString()}</p>
                    </div>
                    {r.autoHidden ? (
                      <span className="shrink-0 rounded-full bg-scam-soft px-2.5 py-1 text-[9.5px] font-extrabold text-scam">
                        Hidden • 3 strikes
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-pending-soft px-2.5 py-1 text-[9.5px] font-extrabold text-warn">
                        Under review
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activity.viewingLog.length > 0 && (
            <div className="rounded-3xl border border-trust/25 bg-trust-soft/40 p-4">
              <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-body">
                <CalendarCheck className="h-4 w-4 text-trust" /> Viewing bookings • {activity.viewingLog.length}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-kmuted">
                All viewings are free — never send money before the physical visit.
              </p>
              <ul className="keja-scroll mt-3 max-h-56 space-y-2 overflow-y-auto">
                {activity.viewingLog.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-trust/20 bg-surface px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-extrabold text-body">
                        {v.estate} • {v.date}
                      </p>
                      <p className="text-[10px] font-semibold text-kmuted">
                        {v.slot} EAT • booked {new Date(v.at).toLocaleDateString()} • SMS simulated
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("listing", { listingId: v.listingId })}
                      className="shrink-0 rounded-full bg-trust px-2.5 py-1 text-[9.5px] font-extrabold text-white transition-transform hover:scale-105"
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activity.notifications.length > 0 && (
            <div className="rounded-3xl border border-kline bg-card p-4">
              <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-body">
                <Bell className="h-4 w-4 text-trust" /> Recent activity
              </p>
              <ul className="keja-scroll mt-3 max-h-56 space-y-2 overflow-y-auto">
                {activity.notifications.slice(0, 6).map((n) => (
                  <li key={n.id} className="flex gap-2.5 rounded-xl border border-kline/70 bg-kbg/50 px-3 py-2.5">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        n.kind === "success" ? "bg-verified" : n.kind === "error" ? "bg-scam" : n.kind === "warning" ? "bg-pending" : "bg-trust"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-extrabold text-body">{n.title}</p>
                      <p className="text-[10.5px] leading-snug text-kmuted">{n.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* saved grid */}
      {savedListings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-kline bg-card p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-tiktok-pink/10 text-tiktok-pink">
            <SearchX className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-lg font-extrabold text-body">
            {all === null ? "Loading your shortlist..." : "No saved kejas yet"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[12px] font-semibold leading-relaxed text-kmuted">
            Tap the ♡ on any listing card to shortlist it here. Saved houses sync to this device — no account needed.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => navigate("estate")}
              className="touch-target rounded-full bg-trust px-5 py-2.5 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Discover kejas
            </button>
            <button
              onClick={back}
              className="touch-target inline-flex items-center gap-2 rounded-full border border-kline bg-surface px-5 py-2.5 text-[12px] font-extrabold text-body hover:bg-kbg"
            >
              <ArrowLeft className="h-4 w-4" /> Go back
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-extrabold text-body">
              Saved kejas • {savedListings.length}
            </h3>
            <p className="text-[11px] font-semibold text-kmuted">
              {availableSaved.length} available • {freshSaved.length} fresh ≤24h
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((l, i) => (
              <ListingCard
                key={l.id}
                listing={l}
                index={i}
                onCall={() => {
                  navigate("listing", { listingId: l.id });
                  toast("info", "Open the listing to call — phone masked until contact");
                }}
              />
            ))}
          </div>

          {/* similar-to-saved rail */}
          {all && availableSaved.length > 0 && (
            <section className="mt-8">
              <h3 className="font-display text-[15px] font-extrabold text-body">More like your shortlist</h3>
              <p className="text-[11px] font-semibold text-kmuted">Fresh verified kejas in the same boroughs</p>
              <div className="keja-scroll mt-3 flex gap-3 overflow-x-auto pb-2">
                {all
                  .filter((l) => !saved.includes(l.id) && availableSaved.some((s) => s.borough === l.borough))
                  .slice(0, 8)
                  .map((l) => (
                    <MiniListingCard key={l.id} listing={l} onOpen={() => navigate("listing", { listingId: l.id })} />
                  ))}
              </div>
            </section>
          )}

          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-white" role="note">
            <ShieldCheck className="h-4 w-4 shrink-0 text-verified" />
            <p className="text-[11px] font-semibold leading-relaxed">
              Shortlist is device-local (privacy by design). Before paying anything: viewing is always free — Hakuna
              Kulipa Kabla Ya Kuona Nyumba.
            </p>
          </div>
        </>
      )}

      {/* allow removing from shortlist quickly when viewing */}
      {saved.length > 0 && all === null && (
        <p className="mt-3 text-center text-[11px] text-kmuted">Loading saved kejas…</p>
      )}

      <RatingSheet
        open={Boolean(rateTarget)}
        onClose={() => setRateTarget(null)}
        agentHandle={rateTarget?.agentHandle ?? ""}
        agentId={rateTarget?.agentId ?? ""}
        estateHint={rateTarget?.estate}
      />
    </div>
  );
}
