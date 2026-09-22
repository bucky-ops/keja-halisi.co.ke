"use client";
// KEJA HALISI — ListingView: TikTok embed (staged, thumbnail-first) + trust stack + evidence gate + agent panel.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Play, Flag, MessageCircle, Phone, BadgeCheck, Check, MapPin,
  CloudSun, ExternalLink, Clock, Eye, Zap, ChevronRight, ChevronLeft, Home as HomeIcon,
  Star, ZapOff, CalendarCheck, Share2, Printer, Heart, ZoomIn, X, Images, Link2Off,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { cached, TTL_OEMBED } from "@/lib/cache";
import { recordInteraction, bumpTrending } from "@/lib/learning";
import { EVIDENCE_ITEMS, kes, kesShort, timeAgo } from "@/lib/nairobi";
import { fetchListing, fetchListings, fetchFairPrice, type FairPrice } from "../api";
import { MiniListingCard } from "../listing-card";
import { VerificationBadge, TrustChecksNotice, PrivacyNotice, FeeWarning } from "../badges";
import { ReportModal, ContactModal } from "../modals";
import { ViewingModal } from "../viewing";
import { RatingSheet } from "../rating";
import { FairPriceWidget } from "../fair-price";
import { MoveInCost } from "../move-in-cost";
import { TrustScoreWidget } from "../trust-score";
import { TrustTimeline } from "../trust-timeline";
import { ShareSheet } from "../share-sheet";
import type { ListingDTO } from "@/lib/types";

type OembedData = { thumb: string | null; author: string | null; html: string | null } | null;

/**
 * Embed state machine (spec B+E) — thumbnail-first, exactly ONE iframe ever mounted:
 *   thumb     → static thumbnail / styled fallback + tap-to-play button (default; low-data stops here)
 *   armed     → in viewport + browser idle + !lowData, waiting for oEmbed to settle
 *   resolving → user tapped; oEmbed link resolving (shimmer)
 *   live      → oEmbed html iframe mounted (sandboxed)
 *   removed   → link 404/failed on tap — estate + road context kept
 */
type EmbedStage = "thumb" | "armed" | "resolving" | "live" | "removed";

export default function ListingView() {
  const { params, back, navigate, lowData, bumpActivity, notify, logReport, pushRecent, toggleSaved, saved } = useKeja();
  const [similar, setSimilar] = useState<ListingDTO[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  // shared fair-price fetch — ONE request feeds both the Keja Score and the radar widget
  const [fairPrice, setFairPrice] = useState<{ id: string | null; data: FairPrice | null }>({ id: null, data: null });
  // trust feedback loop — after a lead is logged, invite the renter to rate the agent
  const [leadLogged, setLeadLogged] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  // photo lightbox — index into listing.photos, null = closed
  const [lightbox, setLightbox] = useState<number | null>(null);
  // share sheet (round 10) — channel picker with anti-scam message preview
  const [shareOpen, setShareOpen] = useState(false);

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

  /* ---------------- recently viewed (drives home rail + saved metrics) ---------------- */
  useEffect(() => {
    if (id && payload.id === id && payload.l) pushRecent(id);
  }, [id, payload.id, payload.l]);

  /* ---------------- learning loop (D): view interaction + anonymous trending bump ---------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const l = payload.id === id ? payload.l : null;
    if (!l) return;
    recordInteraction(l, "view");
    bumpTrending(l);
  }, [id, payload.id, payload.l]);

  /* ---------------- fair-price comps (shared: score + radar) ---------------- */
  useEffect(() => {
    const l = payload.id === id ? payload.l : null;
    if (!l) return;
    let alive = true;
    fetchFairPrice(l.estate, l.beds, l.price, l.id)
      .then((d) => { if (alive) setFairPrice({ id: l.id, data: d }); })
      .catch(() => { if (alive) setFairPrice({ id: l.id, data: null }); });
    return () => { alive = false; };
  }, [id, payload.id, payload.l]);

  /* ---------------- lightbox keyboard nav (Esc / arrows) ---------------- */
  useEffect(() => {
    if (lightbox === null || !listing) return;
    const total = listing.photos.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && total > 0) setLightbox((i) => ((i ?? 0) + 1) % total);
      if (e.key === "ArrowLeft" && total > 0) setLightbox((i) => ((i ?? 0) - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, listing]);

  /* ---------------- TikTok embed moved to <TikTokStage> (staged loader, bottom of file) ---------------- */
  // Thumbnail-first: static thumb + tap-to-play; the oEmbed iframe mounts only when the card is
  // in viewport AND the browser is idle AND !lowData (auto) — or on an explicit tap. One iframe max.
  // A 404/failed oEmbed on tap renders "Source removed" but keeps estate + road context.

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
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
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
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-kline bg-surface p-10 text-center">
          <HomeIcon className="mx-auto h-9 w-9 text-kline" aria-hidden />
          <p className="mt-3 font-display text-[16px] font-extrabold text-body">
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
      ? { cls: "bg-verified-soft text-ok", dot: "bg-verified pulse-dot", label: "Available" }
      : l.status === "Reserved"
        ? { cls: "bg-pending-soft text-warn-strong", dot: "bg-pending", label: "Reserved" }
        : { cls: "bg-kbg text-kmuted", dot: "bg-kmuted", label: l.status };

  const initials = l.poster.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase();
  const walkMin = Math.max(1, Math.round(l.distanceToRoadM / 70));

  return (
    <div className={cn("mx-auto max-w-[1440px] px-4 py-6", l.status === "Available" && "pb-36 md:pb-6")}>
      {/* print-only spec sheet (browser print / save-as-PDF) */}
      <div className="hidden print:block print:text-black" aria-hidden>
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <p className="font-display text-lg font-extrabold">KEJA HALISI — Real House Verified</p>
          <p className="text-[10px] font-bold">keja-halisi.co.ke • {new Date().toLocaleDateString("en-KE")}</p>
        </div>
        <h1 className="mt-3 text-base font-extrabold">
          {l.beds} • {l.estate} — KES {l.price.toLocaleString()}/mo
        </h1>
        <p className="mt-1 text-[11px]">
          {l.road ?? l.estate} • {l.subCounty} • {l.borough} • {l.distanceToRoadM}m to road ({walkMin} min walk)
        </p>
        <p className="mt-2 text-[11px]">
          Deposit {kes(l.deposit)} • {l.sizeSqm ? `${l.sizeSqm}sqm • ` : ""}{l.floor ?? "—"} • Amenities: {l.amenities.join(", ") || "not declared"}
        </p>
        <p className="mt-2 text-[11px]">
          Listed by {l.poster.tiktokHandle} ({l.poster.role}, {l.poster.verificationStatus}) • Rating {l.poster.rating}★ • TikTok: {l.tiktokUrl}
        </p>
        <p className="mt-3 border-t border-black pt-2 text-[10px] font-bold">
          HAKUNA KULIPA KABLA YA KUONA NYUMBA — no viewing fee before viewing. Exact house number &amp; landlord phone are protected until contact.
        </p>
      </div>

      <button
        onClick={back}
        className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12.5px] font-extrabold text-body hover:bg-kbg print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.4fr_0.8fr] print:mt-0 print:block">
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

            {/* embed area — staged loader (TikTokStage): thumb → armed → live | removed */}
            <TikTokStage key={l.id} listing={l} />

            {/* muted note + photo gallery — real photos when the poster completed evidence, placeholders otherwise */}
            <p className="mt-2.5 text-center text-[9.5px] font-semibold text-white/45">
              {lowData ? "Low-data mode • autoplay disabled • tap to play in production" : "Autoplay muted • captions burned in • vertical evidence"}
            </p>
            <div className="mt-3">
              {l.photos.length > 0 ? (
                <>
                  {/* main photo */}
                  <button
                    type="button"
                    onClick={() => setLightbox(0)}
                    className="group relative block w-full overflow-hidden rounded-xl ring-1 ring-white/15 transition-all hover:ring-2 hover:ring-tiktok-cyan/60"
                    aria-label="Open photo gallery"
                  >
                    <img
                      src={l.photos[0]}
                      alt={`${l.title} — ${l.estate} main photo`}
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] sm:h-52"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" aria-hidden />
                    <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-extrabold text-white/90 backdrop-blur-sm">
                      <Images className="h-3 w-3 text-tiktok-cyan" /> {l.photos.length} PHOTOS • TAP TO ZOOM
                    </span>
                    <span className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <ZoomIn className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  {/* thumbs */}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {l.photos.slice(0, 3).map((p, i) => (
                      <button
                        key={`${p}-${i}`}
                        type="button"
                        onClick={() => setLightbox(i)}
                        className="group relative h-16 overflow-hidden rounded-xl ring-1 ring-white/15 transition-all hover:ring-2 hover:ring-tiktok-cyan/60"
                        aria-label={`Open photo ${i + 1} of ${l.photos.length}`}
                      >
                        <img
                          src={p}
                          alt={`${l.title} ${l.estate} photo ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {["p1", "p2", "p3"].map((p, i) => (
                    <div
                      key={`${p}-${i}`}
                      className="grid h-16 place-items-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 text-[10px] font-extrabold text-white/70 ring-1 ring-white/15"
                      aria-label={`Photo ${i + 1}`}
                    >
                      Photo {i + 1}
                    </div>
                  ))}
                </div>
              )}
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
                  className="flex items-center gap-2 rounded-xl border border-verified/30 bg-surface px-2.5 py-2.5"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-verified">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <span className="truncate text-[11px] font-extrabold text-ok-strong">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-bold text-ok">
              <BadgeCheck className="h-3.5 w-3.5" /> Evidence checklist • 5 required before publish
            </p>
          </section>

          {/* 3b. Keja history ledger (append-only audit trail) */}
          <TrustTimeline listing={l} />

          {/* 4. Similar kejas rail */}
          {similar.length > 0 && (
            <section aria-label="Similar kejas">
              <h2 className="font-display text-[15px] font-extrabold text-body">
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
          {/* 0. Keja Score — glanceable trust ring + explainable breakdown */}
          <TrustScoreWidget listing={l} fairPrice={fairPrice.id === l.id ? fairPrice.data : null} />

          {/* 1. price panel */}
          <section className="rounded-3xl border border-kline bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-2xl font-extrabold tabular-nums text-body">
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
              {l.sizeSqm ? ` • KES ${Math.round(l.price / l.sizeSqm)}/sqm` : ""}
            </p>

            {/* share / print / save quick actions */}
            <div className="mt-3 flex items-center gap-2 print:hidden">
              <button
                onClick={() => setShareOpen(true)}
                className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-full border border-kline py-2 text-[11px] font-extrabold text-body transition-colors hover:bg-kbg"
                aria-label="Share listing"
              >
                <Share2 className="h-3.5 w-3.5 text-trust" /> Share
              </button>
              <button
                onClick={() => window.print()}
                className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-full border border-kline py-2 text-[11px] font-extrabold text-body transition-colors hover:bg-kbg"
                aria-label="Print listing sheet"
              >
                <Printer className="h-3.5 w-3.5 text-trust" /> Print
              </button>
              <button
                onClick={() => {
                  toggleSaved(l.id);
                  toast("success", saved.includes(l.id) ? "Removed from your shortlist" : "Saved to your kejas • Heart filled");
                }}
                className={cn(
                  "touch-target flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2 text-[11px] font-extrabold transition-colors",
                  saved.includes(l.id) ? "border-tiktok-pink/40 bg-tiktok-pink/10 text-tiktok-pink" : "border-kline text-body hover:bg-kbg"
                )}
                aria-label={saved.includes(l.id) ? "Remove from saved" : "Save keja"}
              >
                <Heart className={cn("h-3.5 w-3.5", saved.includes(l.id) ? "fill-tiktok-pink text-tiktok-pink" : "text-tiktok-pink")} />
                {saved.includes(l.id) ? "Saved" : "Save"}
              </button>
            </div>

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
              className="w-full card-lift rounded-3xl border border-kline bg-surface p-4 text-left"
              aria-label={`Open agent profile ${l.poster.tiktokHandle}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-trust to-verified font-display text-[13px] font-extrabold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-display text-[13.5px] font-extrabold text-body">
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
                  recordInteraction(l, "call"); // learning loop (D): call intent on this link
                  toast("success", "Number copied • Lead logged • Haptic vibrate");
                  setContactOpen(true);
                }}
                className="touch-target flex items-center justify-center gap-1.5 rounded-full bg-safaricom text-[12.5px] font-extrabold text-white shadow-[0_8px_20px_rgba(0,177,64,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" /> Call Agent
              </button>
              <button
                onClick={() => {
                  recordInteraction(l, "call"); // learning loop (D): WhatsApp = call intent on this link
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
            <button
              onClick={() => setViewingOpen(true)}
              className="touch-target flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-trust bg-trust-soft py-3 text-[12.5px] font-extrabold text-trust transition-all hover:bg-trust hover:text-white"
            >
              <CalendarCheck className="h-4 w-4" /> Book viewing • free
            </button>
          </section>

          {/* 5. specs grid */}
          <section className="rounded-3xl border border-kline bg-surface p-4" aria-label="Unit specs">
            <div className="grid grid-cols-3 gap-2.5">
              {specs.map((s) => (
                <div key={s.label} className="rounded-2xl bg-kbg p-2.5 text-center">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-kmuted">{s.label}</p>
                  <p className="mt-0.5 truncate font-display text-[12px] font-extrabold text-body">{s.value}</p>
                </div>
              ))}
            </div>

            {/* 6. amenities chips */}
            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-kline pt-3.5" aria-label="Amenities">
              {l.amenities.length === 0 ? (
                <span className="text-[11px] font-semibold text-kmuted">Amenities not declared — ask on call</span>
              ) : (
                l.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-verified-soft px-2.5 py-1.5 text-[10.5px] font-extrabold text-ok-strong">
                    <Check className="h-3 w-3" /> {a}
                  </span>
                ))
              )}
            </div>
          </section>

          {/* 5. fair-price radar (anti-bait) — shares the listing-level fetch */}
          <FairPriceWidget listing={l} shared={fairPrice.id === l.id ? fairPrice.data : null} />

          {/* 5b. move-in cost estimator (budget trust tool) */}
          <MoveInCost listing={l} />

          {/* 6. location */}
          <section className="rounded-3xl border border-kline bg-surface p-4" aria-label="Location">
            <p className="flex items-start gap-1.5 text-[12px] font-bold leading-relaxed text-body">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trust" />
              {l.estate}, near {l.road || "main road"} - {l.distanceToRoadM}m to road - {walkMin} min walk - Matatu 2 min
            </p>
            <div className="keja-map relative mt-3 h-24 overflow-hidden rounded-2xl" role="img" aria-label={`Map pin for ${l.estate}`}>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bounce-pin grid h-8 w-8 place-items-center rounded-full bg-trust text-white ring-2 ring-white shadow-lg">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
              </span>
              <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[8.5px] font-extrabold tracking-wider text-body">
                {l.subCounty.toUpperCase()} • DEMO LAYER
              </span>
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-kmuted">
              <CloudSun className="h-3.5 w-3.5 text-gold" /> {l.weather.temp}°C • Windy
            </p>
          </section>

          {/* 8. rate-after-call trust loop */}
          {leadLogged && (
            <section className="pop rounded-3xl border border-gold/40 bg-gold/10 p-4" aria-label="Rate after viewing">
              <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-warn">
                <Star className="h-4 w-4 fill-gold text-gold" /> Rate after viewing?
              </p>
              <p className="mt-1 text-[11.5px] font-semibold text-warn/90">
                Was this keja real? Rate {l.poster.tiktokHandle} — shows on their agent card.
              </p>
              <button
                onClick={() => setRateOpen(true)}
                className="touch-target mt-2.5 w-full rounded-full bg-gold py-2.5 text-[12px] font-extrabold text-body transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                ⭐ Rate {l.poster.tiktokHandle}
              </button>
            </section>
          )}

          {/* 9. report */}
          <button
            onClick={() => setReportOpen(true)}
            className="touch-target flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-scam py-3 text-[12.5px] font-extrabold text-scam transition-colors hover:bg-scam hover:text-white print:hidden"
          >
            <Flag className="h-4 w-4" /> 🚩 Report Scam / Fake
          </button>
        </aside>
      </div>

      {/* mobile sticky call bar — above bottom nav (wireframe File C) */}
      {l.status === "Available" && (
        <div
          className="fixed inset-x-0 bottom-[68px] z-40 flex gap-2 border-t border-kline bg-surface/95 p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
          role="navigation"
          aria-label="Quick contact"
        >
          <button
            onClick={() => setContactOpen(true)}
            className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-full bg-verified py-2.5 text-[12.5px] font-extrabold text-white active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" /> Call
          </button>
          <button
            onClick={() => setContactOpen(true)}
            className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-full bg-wa py-2.5 text-[12.5px] font-extrabold text-white active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
        </div>
      )}

      {/* modals + rating sheet */}
      <ReportModal
        listing={l}
        open={reportOpen}
        onClose={closeReport}
        onReported={(r) => {
          bumpActivity({ reports: 1 });
          logReport({ listingId: l.id, estate: l.estate, reason: r.reason, autoHidden: r.autoHidden });
        }}
      />
      <ContactModal
        listing={l}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        onLeadLogged={(action) => {
          setLeadLogged(true);
          bumpActivity({ leads: 1 });
          notify(
            "success",
            action === "call" ? "Lead logged — call connected" : "Lead logged — WhatsApp",
            `${l.estate} • ${l.beds} • agent ${l.poster.tiktokHandle} contacted. Rate after viewing!`
          );
          // simulated agent reply (production: Africa's Talking delivery report → push)
          const replies = [
            `Karibu! Hiyo ${l.beds} iko available — come see it anytime`,
            `Sawa, niko jobo around. Can we do the viewing today?`,
            `Yes the house is ready — water iko and gate keeper anajua mimi`,
            `Pole kwa delay — nitakuwa estate after 5pm, viewing iko free`,
          ];
          const delay = 6000 + Math.floor(Math.random() * 4000);
          window.setTimeout(() => {
            notify(
              "info",
              `${l.poster.tiktokHandle} replied • SMS (simulated)`,
              replies[Math.floor(Math.random() * replies.length)]
            );
          }, delay);
        }}
      />
      <RatingSheet
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        agentHandle={l.poster.tiktokHandle}
        agentId={l.poster.id}
        estateHint={l.estate}
      />
      <ViewingModal listing={l} open={viewingOpen} onClose={() => setViewingOpen(false)} />
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${l.beds} • ${l.estate} • KES ${l.price.toLocaleString()}/mo`}
        text={`${l.beds} • ${l.estate} • KES ${l.price.toLocaleString()}/mo — verified on Keja Halisi`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* ================= photo lightbox ================= */}
      {lightbox !== null && l.photos.length > 0 && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-black/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightbox + 1} of ${l.photos.length} — ${l.title}`}
          onClick={() => setLightbox(null)}
        >
          {/* top bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-white" onClick={(e) => e.stopPropagation()}>
            <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.14em] text-white/70">
              <Images className="h-3.5 w-3.5 text-tiktok-cyan" />
              {l.title} • {l.estate}
            </p>
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold tabular-nums">
                {lightbox + 1} / {l.photos.length}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="touch-target grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* stage */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {l.photos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightbox((lightbox - 1 + l.photos.length) % l.photos.length)}
                className="touch-target absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/25"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <img
              key={l.photos[lightbox]}
              src={l.photos[lightbox]}
              alt={`${l.title} — ${l.estate} photo ${lightbox + 1}`}
              className="pop max-h-full max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
              loading="lazy"
              decoding="async"
            />
            {l.photos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightbox((lightbox + 1) % l.photos.length)}
                className="touch-target absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/25"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* thumb strip */}
          <div className="flex justify-center gap-2 px-4 pb-5" onClick={(e) => e.stopPropagation()}>
            {l.photos.map((p, i) => (
              <button
                key={`${p}-lb-${i}`}
                type="button"
                onClick={() => setLightbox(i)}
                className={cn(
                  "h-12 w-20 overflow-hidden rounded-lg transition-all",
                  i === lightbox ? "ring-2 ring-tiktok-cyan scale-105" : "opacity-50 ring-1 ring-white/20 hover:opacity-90"
                )}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === lightbox}
              >
                <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>

          <p className="pb-5 text-center text-[10px] font-semibold text-white/40">
            Esc to close • ← → to navigate • photos supplement the TikTok walkthrough — hakuna kulipa
          </p>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   TikTokStage — staged embed loader (spec B+E, thumbnail-first)
   ----------------------------------------------------------------
   thumb     default. Static thumbnail (oEmbed thumb via 1h TTL cache,
             styled keja-building fallback when the fetch fails or low-data)
             + big "Tap to play" button (44px+). NO iframe.
   armed     IntersectionObserver says in-viewport + requestIdleCallback
             (800ms timeout fallback) fired + !lowData — waiting for the
             cached oEmbed call to settle before mounting the iframe.
   resolving transient after a tap — shimmer skeleton while the cached
             oEmbed call settles.
   live      oEmbed html iframe (sandboxed, lazy) — exactly ONE iframe ever
             mounted; QA dev chip "1 iframe • thumbnail-first" shown.
   removed   oEmbed returned null on a TAP (404/failed) — red-outline
             "Source removed • estate + road context kept" + estate/road chips.

   low-data: NEVER auto-loads; tap-to-play only (tapOverride). Toggling
   low-data on without a tap reverts a live iframe back to the thumb stage.
   IntersectionObserver unsupported → tap-to-play only.
   ================================================================ */
function TikTokStage({ listing: l }: { listing: ListingDTO }) {
  const { lowData } = useKeja();
  const [asyncOembed, setAsyncOembed] = useState<OembedData>(null);
  const [asyncState, setAsyncState] = useState<"idle" | "ok" | "failed">("idle");
  const [stage, setStage] = useState<EmbedStage>("thumb");
  const [tapOverride, setTapOverride] = useState(false); // explicit renter opt-in (low-data path)
  const [inView, setInView] = useState(false);
  const [idle, setIdle] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // low-data never renders a live iframe unless the renter explicitly tapped play
  const effStage: EmbedStage = lowData && !tapOverride && stage === "live" ? "thumb" : stage;

  /* persisted LINKS (resolved server-side at create time) win — no fetch, no state sync */
  const persistedOembed: OembedData =
    l.thumbnailLink || l.embedHtmlLink
      ? {
          thumb: l.thumbnailLink,
          author: l.authorLink?.match(/@([\w.\-]+)/)?.[1] ?? null,
          html: l.embedHtmlLink,
        }
      : null;
  const oembed: OembedData = persistedOembed ?? asyncOembed;
  const oembedState: "idle" | "ok" | "failed" = persistedOembed ? "ok" : asyncState;

  /* async resolve via our own /api/retrieval/resolve (server-side oEmbed→tikwm chain, TTL-cached)
     — only for listings stored WITHOUT persisted link fields (e.g. legacy rows). */
  useEffect(() => {
    if (persistedOembed) return; // derivation covers this — no fetch needed
    if (!l.tiktokUrl) return;
    if (lowData && stage !== "resolving") return;
    let alive = true;
    cached(`oembed:${l.tiktokUrl}`, TTL_OEMBED, async () => {
      try {
        const r = await fetch(`/api/retrieval/resolve?url=${encodeURIComponent(l.tiktokUrl)}`);
        if (!r.ok) return null;
        const d = (await r.json()) as {
          ok: boolean;
          linkObject?: { thumbnailLink: string | null; authorUrl: string | null; oembedHtmlLink: string | null };
        };
        if (!d.ok || !d.linkObject) return null;
        return {
          thumb: d.linkObject.thumbnailLink,
          author: d.linkObject.authorUrl?.match(/@([\w.\-]+)/)?.[1] ?? null,
          html: d.linkObject.oembedHtmlLink,
        };
      } catch {
        return null; // offline — caller falls back to the styled thumb
      }
    }, null).then((d) => {
      if (!alive) return;
      setAsyncOembed(d);
      setAsyncState(d ? "ok" : "failed");
    });
    return () => { alive = false; };
  }, [persistedOembed, l.tiktokUrl, lowData, stage]);

  /* in-viewport gate — unsupported observer → tap-to-play only */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "120px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* browser-idle gate — requestIdleCallback, 800ms setTimeout fallback */
  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    let h: number;
    if (typeof w.requestIdleCallback === "function") {
      h = w.requestIdleCallback(() => setIdle(true), { timeout: 1200 });
    } else {
      h = window.setTimeout(() => setIdle(true), 800);
    }
    return () => {
      if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(h);
      else window.clearTimeout(h);
    };
  }, []);

  /* auto-promotion: viewport + idle + !lowData + oEmbed html → ONE iframe (never on low-data) */
  useEffect(() => {
    if (lowData || tapOverride) return;
    if (stage !== "thumb" && stage !== "armed") return;
    if (!inView || !idle) return;
    const t = window.setTimeout(() => {
      if (oembedState === "ok" && oembed?.html) setStage("live");
      else if (oembedState === "idle") setStage("armed"); // oEmbed still resolving
      else if (stage === "armed") setStage("thumb"); // failed → styled fallback stays (never auto-removed)
    }, 0);
    return () => window.clearTimeout(t);
  }, [stage, lowData, tapOverride, inView, idle, oembedState, oembed]);

  /* tap resolution: oEmbed html → live; null/failed on a TAP → "Source removed" (context kept) */
  useEffect(() => {
    if (stage !== "resolving") return;
    if (oembedState === "idle") return; // fetch still in flight
    const t = window.setTimeout(() => {
      setStage(oembed?.html ? "live" : "removed");
    }, 0);
    return () => window.clearTimeout(t);
  }, [stage, oembedState, oembed]);

  const tapPlay = () => {
    if (!l.tiktokUrl || stage === "live" || stage === "resolving") return;
    setTapOverride(true);
    setStage("resolving");
  };

  /* practical sandbox hardening of the oEmbed iframe at string level (no new deps) */
  const liveHtml = useMemo(() => {
    if (!oembed?.html) return "";
    const h = oembed.html;
    if (h.includes("<iframe")) {
      return h.replace(
        "<iframe",
        '<iframe sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"',
      );
    }
    return h;
  }, [oembed?.html]);

  const showThumb = !!oembed?.thumb && (!lowData || tapOverride) && effStage !== "live" && effStage !== "removed";
  const authorLine =
    oembed?.author && showThumb ? `oEmbed OK • ${oembed.author}` : `${l.beds} walkthrough • ${l.estate}`;

  return (
    <div
      ref={boxRef}
      data-embed-stage={effStage}
      className={cn(
        "relative mx-auto mt-3.5 flex max-h-[480px] w-full max-w-[270px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-black/40 keja-building",
        effStage === "resolving" && "shimmer",
        effStage === "removed" && "ring-2 ring-scam"
      )}
      style={{ aspectRatio: "9 / 16" }}
    >
      {/* static thumbnail layer — never an iframe */}
      {showThumb && oembed?.thumb ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${oembed.thumb})` }}
          aria-hidden
        />
      ) : null}

      {effStage === "live" ? (
        /* the ONE iframe — oEmbed html, sandboxed + lazy, stretched to the 9:16 container */
        <div
          className="absolute inset-0 [&_blockquote]:h-full [&_blockquote]:w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
          dangerouslySetInnerHTML={{ __html: liveHtml }}
          title="TikTok walkthrough — muted"
        />
      ) : effStage === "removed" ? (
        <div className="relative z-10 grid place-items-center px-4 py-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-scam/20 ring-1 ring-scam/70">
            <Link2Off className="h-6 w-6 text-[#ff6b6b]" aria-hidden />
          </span>
          <p className="mt-3 font-display text-[13px] font-extrabold text-white">Source removed</p>
          <p className="mt-1 text-[10px] font-semibold leading-relaxed text-white/60">
            Source removed • estate + road context kept
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded-full bg-trust px-2.5 py-1 text-[10px] font-extrabold text-white">{l.estate}</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white ring-1 ring-white/25">
              {l.road || "main road"}
            </span>
          </div>
        </div>
      ) : effStage === "resolving" ? (
        <div className="relative z-10 grid place-items-center px-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
            <Play className="h-6 w-6 fill-white text-white" />
          </span>
          <p className="mt-3 text-[11px] font-extrabold text-white/85">Resolving TikTok link…</p>
        </div>
      ) : (
        /* thumb / armed — big tap-to-play overlay (whole media area is the 44px+ target) */
        <button
          type="button"
          onClick={tapPlay}
          className="absolute inset-0 z-10 grid min-h-[44px] w-full cursor-pointer place-items-center px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-tiktok-cyan"
          aria-label={`Tap to play TikTok walkthrough — ${l.title} • ${l.estate}`}
        >
          <span className="grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30 transition-transform hover:scale-110">
              <Play className="h-6 w-6 fill-white text-white" />
            </span>
            <p className="mt-3 line-clamp-2 font-display text-[13px] font-extrabold">
              {l.title} • {l.poster.tiktokHandle}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-white/60">{authorLine}</p>
            <span className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] font-extrabold text-ink shadow-lg">
              <Play className="h-3.5 w-3.5 fill-ink text-ink" /> Tap to play TikTok
            </span>
          </span>
        </button>
      )}

      {/* corner pills — preserved from Phase-1 (pointer-events-none keeps the full-area tap) */}
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold text-white/80 backdrop-blur-sm">
        TikTok embed • simulated (legal oEmbed iframe in production)
      </span>
      <span className="pointer-events-none absolute right-2.5 top-2.5 z-20 rounded-full bg-tiktok-pink px-2 py-0.5 text-[9px] font-extrabold">
        {l.freshH <= 24 ? "Fresh" : "Catalog"}
      </span>
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-20 flex flex-col items-start gap-1">
        {lowData && (
          <span className="inline-flex items-center gap-1 rounded-full bg-safaricom px-2 py-0.5 text-[9px] font-extrabold text-white">
            <ZapOff className="h-2.5 w-2.5" /> Low-data • autoplay off
          </span>
        )}
        {/* QA dev chip — proves exactly one thumbnail-first iframe is mounted */}
        {effStage === "live" && (
          <span className="rounded-full bg-black/65 px-2 py-0.5 text-[8.5px] font-bold text-tiktok-cyan backdrop-blur-sm">
            1 iframe • thumbnail-first
          </span>
        )}
      </div>
    </div>
  );
}
