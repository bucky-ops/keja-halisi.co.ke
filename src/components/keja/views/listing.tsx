"use client";
// KEJA HALISI — ListingView: TikTok embed + trust stack + evidence gate + agent panel.
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Play, Flag, MessageCircle, Phone, BadgeCheck, Check, MapPin,
  CloudSun, ExternalLink, Clock, Eye, Zap, ChevronRight, Home as HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { EVIDENCE_ITEMS, kes, kesShort, timeAgo } from "@/lib/nairobi";
import { fetchListing, fetchListings } from "../api";
import { MiniListingCard } from "../listing-card";
import { VerificationBadge, TrustChecksNotice, PrivacyNotice, FeeWarning } from "../badges";
import { ReportModal, ContactModal } from "../modals";
import type { ListingDTO } from "@/lib/types";

type Oembed = { thumb: string | null; author: string | null } | null;

export default function ListingView() {
  const { params, back, navigate } = useKeja();
  const [oembed, setOembed] = useState<Oembed>(null);
  const [similar, setSimilar] = useState<ListingDTO[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  /* payload keyed by listingId — loading/failed derived, no cascading setState */
  const id = params.listingId ?? null;
  const [payload, setPayload] = useState<{ id: string | null; l: ListingDTO | null; failed: boolean }>({
    id: null,
    l: null,
    failed: false,
  });
  const loading = id !== payload.id; // waiting for a different listing than the one we hold
  const failed = payload.failed && payload.id === id;
  const listing = payload.id === id ? payload.l : null;

  /* ---------------- fetch detail ---------------- */
  useEffect(() => {
    if (!id) return; // nothing selected — render layer shows the empty state
    let alive = true;
    fetchListing(id)
      .then((l) => { if (alive) setPayload({ id, l, failed: false }); })
      .catch(() => { if (alive) setPayload({ id, l: null, failed: true }); });
    return () => { alive = false; };
  }, [id]);

  /* ---------------- TikTok oEmbed (legal; falls back offline) ---------------- */
  useEffect(() => {
    if (!listing?.tiktokUrl) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(listing.tiktokUrl)}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("oembed unavailable"))))
      .then((d: { thumbnail_url?: string; author_name?: string }) =>
        setOembed({ thumb: d.thumbnail_url ?? null, author: d.author_name ?? null })
      )
      .catch(() => setOembed(null))
      .finally(() => clearTimeout(timer));
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [listing?.tiktokUrl]);

  /* ---------------- similar kejas (same estate, exclude self) ---------------- */
  useEffect(() => {
    if (!listing) return;
    let alive = true;
    fetchListings({ estate: listing.estate, limit: 12 })
      .then((rows) => {
        if (!alive) return;
        const others = rows.filter((l) => l.id !== listing.id);
        if (others.length === 0 && rows.length > 0) {
          // estate only has this keja — fall back to freshest catalog rail
          return fetchListings({ limit: 12 }).then((all) => {
            if (alive) setSimilar(all.filter((l) => l.id !== listing.id).slice(0, 8));
          });
        }
        if (alive) setSimilar(others.slice(0, 8));
      })
      .catch(() => { /* rail stays empty */ });
    return () => { alive = false; };
  }, [listing]);

  /* after report modal closes: silently re-check — 404 means 3-strike auto-hide */
  const closeReport = async () => {
    setReportOpen(false);
    if (!listing) return;
    try {
      await fetchListing(listing.id);
    } catch {
      toast("error", "Listing hidden after 3 reports");
      navigate("estate");
    }
  };

  const specs = useMemo(() => {
    if (!listing) return [];
    return [
      { label: "Size", value: listing.sizeSqm ? `${listing.sizeSqm}sqm` : "—" },
      { label: "Floor", value: listing.floor || "—" },
      { label: "Deposit", value: kesShort(listing.deposit) },
      { label: "Water", value: listing.amenities[0] || "Borehole + county" },
      { label: "Noise", value: "Quiet" },
      { label: "Landlord", value: "Lives no" },
    ];
  }, [listing]);

  /* ---------------- loading skeleton ---------------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="h-9 w-24 rounded-full shimmer" />
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <div className="h-[420px] rounded-3xl shimmer" />
            <div className="h-20 rounded-2xl shimmer" />
            <div className="h-20 rounded-2xl shimmer" />
            <div className="h-36 rounded-2xl shimmer" />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-3xl shimmer" />
            <div className="h-28 rounded-3xl shimmer" />
            <div className="h-24 rounded-3xl shimmer" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- empty state ---------------- */
  if (!listing) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-kline bg-white p-10 text-center">
          <HomeIcon className="mx-auto h-9 w-9 text-kline" aria-hidden />
          <p className="mt-3 font-display text-[16px] font-extrabold text-ink">
            {failed ? "Listing not found" : "No keja selected"}
          </p>
          <p className="mt-1.5 text-[12.5px] font-semibold leading-relaxed text-kmuted">
            {failed
              ? "It may have been hidden after reports, expired, or already taken."
              : "Open a keja from the estates grid or the featured rail."}
          </p>
          <button
            onClick={() => navigate("home")}
            className="touch-target mt-5 rounded-full bg-ink px-5 py-2.5 text-[12.5px] font-extrabold text-white"
          >
            Back to discover
          </button>
        </div>
      </div>
    );
  }

  const l = listing;
  const statusPill =
    l.status === "Available"
      ? { cls: "bg-verified-soft text-[#08743A]", dot: "bg-verified pulse-dot", label: "Available" }
      : l.status === "Reserved"
        ? { cls: "bg-pending-soft text-[#92400E]", dot: "bg-pending", label: "Reserved" }
        : { cls: "bg-kbg text-kmuted", dot: "bg-kmuted", label: l.status };

  const initials = l.poster.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase();
  const walkMin = Math.max(1, Math.round(l.distanceToRoadM / 70));

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <button
        onClick={back}
        className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-white px-4 py-2.5 text-[12.5px] font-extrabold text-ink hover:bg-kbg"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        {/* ============================= LEFT ============================= */}
        <div className="min-w-0 space-y-4">
          {/* 1. TikTok embed card */}
          <section className="rounded-3xl bg-tiktok p-4 text-white" aria-label="TikTok walkthrough">
            <header className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[10px] font-extrabold tracking-[0.16em] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-tiktok-pink pulse-dot" aria-hidden />
                TIKTOK • AUTO MUTED PLAYING
              </p>
              <button
                onClick={() => setReportOpen(true)}
                className="touch-target inline-flex items-center gap-1.5 rounded-full border border-scam/70 px-3.5 py-2 text-[11px] font-extrabold text-[#ff6b6b] transition-colors hover:bg-scam hover:text-white"
              >
                <Flag className="h-3.5 w-3.5" /> Report
              </button>
            </header>

            {/* embed area — real oEmbed attempted, styled fallback offline */}
            <div className="relative mx-auto mt-3.5 flex max-h-[480px] w-full max-w-[270px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-black/40 keja-building" style={{ aspectRatio: "9 / 16" }}>
              {oembed?.thumb ? (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{ backgroundImage: `url(${oembed.thumb})` }}
                  aria-hidden
                />
              ) : null}
              <div className="relative z-10 grid place-items-center px-4 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
                  <Play className="h-6 w-6 fill-white text-white" />
                </span>
                <p className="mt-3 line-clamp-2 font-display text-[13px] font-extrabold">
                  {l.title} • {l.poster.tiktokHandle}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-white/60">
                  {oembed?.author ? `oEmbed OK • ${oembed.author}` : `${l.beds} walkthrough • ${l.estate}`}
                </p>
              </div>
              <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold text-white/80 backdrop-blur-sm">
                TikTok embed • simulated (legal oEmbed iframe in production)
              </span>
              <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-tiktok-pink px-2 py-0.5 text-[9px] font-extrabold">
                {l.freshH <= 24 ? "Fresh" : "Catalog"}
              </span>
            </div>

            {/* muted note + photo thumbs */}
            <p className="mt-2.5 text-center text-[9.5px] font-semibold text-white/45">
              Autoplay muted • captions burned in • vertical evidence
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(l.photos.length > 0 ? l.photos : ["p1", "p2", "p3"]).slice(0, 3).map((p, i) => (
                <div
                  key={`${p}-${i}`}
                  className="grid h-16 place-items-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 text-[10px] font-extrabold text-white/70 ring-1 ring-white/15"
                  aria-label={`Photo ${i + 1}`}
                >
                  Photo {i + 1}
                </div>
              ))}
            </div>
          </section>

          {/* 2. Trust notices stack */}
          <TrustChecksNotice />
          <PrivacyNotice />
          {l.fee ? <FeeWarning /> : null}

          {/* 3. Evidence checklist — readOnly, all green (passed publish gate) */}
          <section className="rounded-2xl border border-verified/20 bg-verified-soft p-4" aria-label="Evidence checklist">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {EVIDENCE_ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-verified/30 bg-white px-2.5 py-2.5"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-verified">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="truncate text-[11px] font-extrabold text-[#0a6b40]">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-bold text-[#08743A]">
              <BadgeCheck className="h-3.5 w-3.5" /> Evidence checklist • 5 required before publish
            </p>
          </section>

          {/* 4. Similar kejas rail */}
          {similar.length > 0 && (
            <section aria-label="Similar kejas">
              <h2 className="font-display text-[15px] font-extrabold text-ink">
                Similar kejas in {l.estate} • Horizontal scroll
              </h2>
              <div className="keja-scroll -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
                {similar.map((s) => (
                  <MiniListingCard
                    key={s.id}
                    listing={s}
                    onOpen={() => navigate("listing", { listingId: s.id })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ============================ RIGHT (sticky) ============================ */}
        <aside className="min-w-0 space-y-4 self-start lg:sticky lg:top-24">
          {/* 1. price panel */}
          <section className="rounded-3xl border border-kline bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-2xl font-extrabold text-ink">
                {kes(l.price)}<span className="text-[13px] font-bold text-kmuted"> /mo</span>
              </p>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold", statusPill.cls)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", statusPill.dot)} aria-hidden /> {statusPill.label}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] font-semibold text-kmuted">
              Deposit {kes(l.deposit)} • {l.beds}
              {l.sizeSqm ? ` • ${l.sizeSqm}sqm` : ""}
              {l.floor ? ` • ${l.floor}` : ""}
            </p>

            {/* 2. meta */}
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-kline pt-3 text-[11px] font-semibold text-kmuted">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-trust" /> Posted {timeAgo(l.freshH)}</span>
              <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-verified" /> Response ~{l.responseTime}min</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3 text-trust" /> {l.views} views</span>
            </p>
          </section>

          {/* 3. agent card */}
          <section>
            <button
              onClick={() => navigate("agent", { handle: l.poster.tiktokHandle })}
              className="w-full rounded-3xl border border-kline bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              aria-label={`Open agent profile ${l.poster.tiktokHandle}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-trust to-verified font-display text-[13px] font-extrabold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-display text-[13.5px] font-extrabold text-ink">
                    {l.poster.tiktokHandle}
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-kmuted" />
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">
                    {l.poster.listingsCount} listings • {l.poster.rating}★ • Reports {l.reportsCount}
                  </p>
                </div>
                <VerificationBadge status={l.poster.verificationStatus} role={l.poster.role} />
              </div>
            </button>
          </section>

          {/* 4. CTA buttons */}
          <section className="space-y-2" aria-label="Contact actions">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  toast("success", "Number copied • Lead logged • Haptic vibrate");
                  setContactOpen(true);
                }}
                className="touch-target flex items-center justify-center gap-1.5 rounded-full bg-safaricom text-[12.5px] font-extrabold text-white shadow-[0_8px_20px_rgba(0,177,64,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" /> 📞 Call Agent
              </button>
              <button
                onClick={() => {
                  toast("success", "Opening WhatsApp • wa.me/2547...");
                  setContactOpen(true);
                }}
                className="touch-target flex items-center justify-center gap-1.5 rounded-full bg-wa text-[12.5px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>
            <button
              onClick={() => toast("info", `Opening TikTok ${l.poster.tiktokHandle}`)}
              className="touch-target flex w-full items-center justify-center gap-1.5 rounded-full bg-tiktok py-3 text-[12.5px] font-extrabold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <ExternalLink className="h-4 w-4 text-tiktok-cyan" /> View on TikTok
            </button>
          </section>

          {/* 5. specs grid */}
          <section className="rounded-3xl border border-kline bg-white p-4" aria-label="Unit specs">
            <div className="grid grid-cols-3 gap-2.5">
              {specs.map((s) => (
                <div key={s.label} className="rounded-2xl bg-kbg p-2.5 text-center">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-kmuted">{s.label}</p>
                  <p className="mt-0.5 truncate font-display text-[12px] font-extrabold text-ink">{s.value}</p>
                </div>
              ))}
            </div>

            {/* 6. amenities chips */}
            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-kline pt-3.5" aria-label="Amenities">
              {l.amenities.length === 0 ? (
                <span className="text-[11px] font-semibold text-kmuted">Amenities not declared — ask on call</span>
              ) : (
                l.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-verified-soft px-2.5 py-1.5 text-[10.5px] font-extrabold text-[#0a6b40]">
                    <Check className="h-3 w-3" /> {a}
                  </span>
                ))
              )}
            </div>
          </section>

          {/* 7. location */}
          <section className="rounded-3xl border border-kline bg-white p-4" aria-label="Location">
            <p className="flex items-start gap-1.5 text-[12px] font-bold leading-relaxed text-ink">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trust" />
              {l.estate}, near {l.road || "main road"} - {l.distanceToRoadM}m to road - {walkMin} min walk - Matatu 2 min
            </p>
            <div className="keja-map relative mt-3 h-24 overflow-hidden rounded-2xl" role="img" aria-label={`Map pin for ${l.estate}`}>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bounce-pin grid h-8 w-8 place-items-center rounded-full bg-trust text-white ring-2 ring-white shadow-lg">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
              </span>
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[8.5px] font-extrabold tracking-wider text-ink">
                {l.subCounty.toUpperCase()} • DEMO LAYER
              </span>
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-kmuted">
              <CloudSun className="h-3.5 w-3.5 text-gold" /> {l.weather.temp}°C • Windy
            </p>
          </section>

          {/* 8. report */}
          <button
            onClick={() => setReportOpen(true)}
            className="touch-target flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-scam py-3 text-[12.5px] font-extrabold text-scam transition-colors hover:bg-scam hover:text-white"
          >
            <Flag className="h-4 w-4" /> 🚩 Report Scam / Fake
          </button>
        </aside>
      </div>

      {/* modals */}
      <ReportModal listing={l} open={reportOpen} onClose={closeReport} />
      <ContactModal listing={l} open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
