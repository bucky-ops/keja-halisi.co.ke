"use client";
// KEJA HALISI — SavedView: renter's shortlist + personal dashboard
// Blueprint "Renter dashboard": Saved / Fresh matches / Leads / Reports + rate-after-viewing loop.
import { useEffect, useMemo, useState } from "react";
import { Heart, Zap, Phone, Flag, SearchX, ArrowRight, Star, ShieldCheck, ArrowLeft } from "lucide-react";
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
  const { saved, toggleSaved, activity, navigate, back } = useKeja();
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
          <h2 className="font-display text-xl font-extrabold text-ink">Your keja shortlist</h2>
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

      {/* rate-after-viewing loop */}
      {pendingRatings.length > 0 && (
        <section className="mt-5 rounded-3xl border border-gold/40 bg-gold/10 p-4" aria-label="Rate after viewing">
          <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-[#8c6700]">
            <Star className="h-4 w-4 fill-gold text-gold" />
            Rate after viewing?
          </p>
          <p className="mt-1 text-[11.5px] font-semibold text-[#8c6700]/90">
            You contacted {activity.leads} agent{activity.leads === 1 ? "" : "s"} this session — ratings help other renters avoid scams.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingRatings.map((r) => (
              <button
                key={r.agentId}
                onClick={() => setRateTarget(r)}
                className="touch-target rounded-full border border-gold/50 bg-white px-3.5 py-2 text-[11.5px] font-extrabold text-ink hover:bg-gold/15"
              >
                ⭐ Rate {r.agentHandle} • {r.estate}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* saved grid */}
      {savedListings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-kline bg-card p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-tiktok-pink/10 text-tiktok-pink">
            <SearchX className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-lg font-extrabold text-ink">
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
              className="touch-target inline-flex items-center gap-2 rounded-full border border-kline bg-white px-5 py-2.5 text-[12px] font-extrabold text-ink hover:bg-kbg"
            >
              <ArrowLeft className="h-4 w-4" /> Go back
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-extrabold text-ink">
              Saved kejas • {savedListings.length}
            </h3>
            <p className="text-[11px] font-semibold text-kmuted">
              {availableSaved.length} available • {freshSaved.length} fresh ≤24h
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
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
              <h3 className="font-display text-[15px] font-extrabold text-ink">More like your shortlist</h3>
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
