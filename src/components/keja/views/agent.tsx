"use client";
// KEJA HALISI — AgentView: public agent profile @handle
import { useEffect, useState } from "react";
import {
  CircleCheck,
  Clock,
  Circle,
  Star,
  Store,
  SearchX,
  ArrowLeft,
  ArrowBigUp,
  BadgeCheck,
  MapPin,
  Vault,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { fetchAgentProfile, type TenantReview, type RatingSummary } from "../api";
import { VerificationBadge } from "../badges";
import { ListingCard, ListingCardSkeleton } from "../listing-card";
import { RatingSheet } from "../rating";
import type { AgentDTO, ListingDTO } from "@/lib/types";

interface ProfileData {
  agent: AgentDTO;
  listings: ListingDTO[];
  verifications: { docType: string; status: string }[];
  reviews: TenantReview[];
  ratingSummary: RatingSummary;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-0.5", className)} aria-label={`${n} star rating`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3 w-3", i < n ? "fill-gold text-gold" : "text-kline")} />
      ))}
    </span>
  );
}

export default function AgentView() {
  const { params, back, navigate, activity, toggleUpvote } = useKeja();
  const handle = params.handle || "@keja_kile";
  const [rateOpen, setRateOpen] = useState(false);

  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState(false);
  const [loadedHandle, setLoadedHandle] = useState<string | null>(null);
  // derived loading — true until the fetch for the *current* handle resolves
  const loading = loadedHandle !== handle;

  useEffect(() => {
    let alive = true;
    fetchAgentProfile(handle)
      .then((res) => {
        if (!alive) return;
        setData(res);
        setError(false);
        setLoadedHandle(handle);
      })
      .catch(() => {
        if (!alive) return;
        setData(null);
        setError(true);
        setLoadedHandle(handle);
      });
    return () => {
      alive = false;
    };
  }, [handle]);

  /* ---------- loading skeleton ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6" aria-busy>
        <div className="h-36 rounded-3xl shimmer" />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-16 w-16 rounded-2xl shimmer" />
          <div className="space-y-2">
            <div className="h-5 w-44 rounded shimmer" />
            <div className="h-3.5 w-64 rounded shimmer" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="h-20 rounded-2xl shimmer" />
            <div className="h-24 rounded-2xl shimmer" />
            <div className="h-40 rounded-2xl shimmer" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ListingCardSkeleton />
            <ListingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- error empty state ---------- */
  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="mx-auto max-w-md rounded-3xl border border-kline bg-card p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-scam-soft text-scam">
            <SearchX className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-extrabold text-body">Agent profile not found</h2>
          <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-kmuted">
            No agent registered as <span className="font-extrabold text-body">{handle}</span>. The handle may have
            changed or the agent is still pending verification.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={back}
              className="touch-target inline-flex items-center gap-2 rounded-full border border-kline bg-surface px-5 py-2.5 text-[12px] font-extrabold text-body hover:bg-kbg"
            >
              <ArrowLeft className="h-4 w-4" /> Go back
            </button>
            <button
              type="button"
              onClick={() => {
                navigate("home");
                toast("info", "Back to verified catalog");
              }}
              className="touch-target inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12px] font-extrabold text-white hover:shadow-md"
            >
              Discover kejas
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- data ---------- */
  const { agent, listings, verifications, reviews, ratingSummary } = data;
  const initials = agent.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase();

  // trust feedback loop — community "legit" upvotes (demo base + local vote)
  const upvoted = Boolean(activity.upvotes[agent.id]);
  const legitBase = 24 + (agent.tiktokHandle.length % 9);

  // renter's own rating for this agent (persisted locally, demo)
  const myRating = JSON.parse(
    (typeof window !== "undefined" && localStorage.getItem(`keja-rating-${agent.id}`)) || "null"
  ) as { stars: number; comment: string } | null;

  // verification timeline — status per docType (verified / pending / missing)
  const findV = (match: string) =>
    verifications.find((v) => v.docType.toLowerCase().includes(match));

  const timeline: { label: string; sub: string; status: string | null }[] = [
    { label: "Phone OTP", sub: "Truecaller age check • SMS code", status: (findV("otp") ?? findV("phone"))?.status ?? null },
    { label: "ID selfie holding ID", sub: "Encrypted in vault • never public", status: findV("id")?.status ?? null },
    { label: "Referrals 2 agents", sub: "Peer agents vouched", status: findV("referral")?.status ?? null },
  ];
  if (agent.role === "Caretaker") {
    timeline.push({ label: "Mandate letter", sub: "Owner-signed • vault copy", status: findV("mandate")?.status ?? null });
  }
  if (agent.role === "Developer") {
    timeline.push({ label: "Title deed", sub: "Title / lease + company reg", status: findV("title")?.status ?? null });
  }

  const vaultId = `KV-${agent.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* ============ COVER ============ */}
      <header>
        <div className="h-36 rounded-3xl bg-gradient-to-r from-tiktok via-trust/80 to-verified/80" role="img" aria-label={`${agent.tiktokHandle} profile cover`} />
        <div className="-mt-10 px-1 sm:px-4">
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-kline bg-card p-4 pt-5 shadow-[0_10px_30px_rgba(17,25,40,0.08)]">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink font-display text-lg font-extrabold text-white ring-4 ring-white"
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-display text-xl font-extrabold text-body">{agent.tiktokHandle}</h2>
                <VerificationBadge status={agent.verificationStatus} role={agent.role} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] font-semibold text-kmuted">
                <BadgeCheck className="h-3.5 w-3.5 text-verified" />
                {agent.verifiedSince
                  ? `Verified since ${fmtDate(agent.verifiedSince)}`
                  : "Under review — not verified yet"}
                <span aria-hidden>•</span> Rating {agent.rating}★
                <span aria-hidden>•</span> Reports {agent.reportsCount}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const before = Boolean(upvoted);
                  toggleUpvote(agent.id);
                  toast("success", before ? "Upvote removed" : "This agent is legit • Upvoted • Trust score +1");
                }}
                className={`touch-target inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11.5px] font-extrabold transition-colors ${
                  upvoted ? "border-verified bg-verified-soft text-ok-strong" : "border-kline bg-surface text-body hover:bg-kbg"
                }`}
              >
                <ArrowBigUp className={`h-4 w-4 ${upvoted ? "fill-verified text-verified" : "text-kmuted"}`} />
                {legitBase + (upvoted ? 1 : 0)} legit
              </button>
              <button
                onClick={() => setRateOpen(true)}
                className="touch-target inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-2 text-[11.5px] font-extrabold text-body transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Star className="h-3.5 w-3.5 fill-ink" /> Rate agent
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN GRID ============ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ---------- LEFT ---------- */}
        <div className="space-y-4">
          {/* stats 3-up */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Listings", value: String(agent.listingsCount) },
              { label: "Response", value: `~${agent.responseTime} min` },
              { label: "Rating", value: `${agent.rating}★` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-kline bg-card p-3.5 text-center">
                <p className="font-display text-lg font-extrabold text-body">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-kmuted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* bio */}
          <div className="rounded-2xl border border-kline bg-card p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Bio Sheng</p>
            <p className="mt-1.5 text-[12.5px] font-semibold italic leading-relaxed text-body">
              &ldquo;{agent.bio || "Napenda kuweka wazi keja halisi — hakuna kulipa kabla ya kuona nyumba."}&rdquo;
            </p>
          </div>

          {/* verification timeline */}
          <div className="rounded-2xl border border-kline bg-card p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
              Verification timeline
            </p>
            <ol className="mt-3 space-y-3">
              {timeline.map((t) => {
                const verified = t.status === "verified";
                const pending = t.status === "pending";
                return (
                  <li key={t.label} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full",
                        verified && "bg-verified text-white",
                        pending && "bg-pending-soft text-pending ring-1 ring-pending/30",
                        !verified && !pending && "bg-kbg text-kmuted"
                      )}
                      role="img"
                      aria-label={verified ? "verified" : pending ? "pending" : "missing"}
                    >
                      {verified ? (
                        <CircleCheck className="h-3.5 w-3.5" />
                      ) : pending ? (
                        <Clock className="h-3 w-3 pulse-dot" />
                      ) : (
                        <Circle className="h-2.5 w-2.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-[12px] font-extrabold", verified ? "text-body" : "text-body/70")}>
                        {t.label}
                        {verified && <span className="ml-1.5 text-[10px] font-extrabold text-verified">✓</span>}
                        {pending && <span className="ml-1.5 text-[10px] font-extrabold text-pending">pending</span>}
                        {!verified && !pending && (
                          <span className="ml-1.5 text-[10px] font-bold text-kmuted">missing</span>
                        )}
                      </p>
                      <p className="text-[10.5px] font-semibold text-kmuted">{t.sub}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* caretaker mandate panel */}
          {agent.role === "Caretaker" && (
            <div className="rounded-2xl border border-trust/25 bg-trust-soft p-4" role="note">
              <p className="flex items-center gap-2 text-[12px] font-extrabold text-trust">
                <Store className="h-4 w-4 shrink-0" />
                Caretaker badge • Mandate letter verified
              </p>
              <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-trust">
                Owner: (vault) • Estates: {agent.mandateEstates?.length ? agent.mandateEstates.join(", ") : "—"} •
                Expiry {agent.mandateExpiry ? fmtDate(agent.mandateExpiry) : "—"} • Private vault ID {vaultId}
              </p>
            </div>
          )}
        </div>

        {/* ---------- RIGHT ---------- */}
        <div className="space-y-4">
          <h3 className="font-display text-[15px] font-extrabold text-body">
            All listings • {listings.length} verified kejas
          </h3>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-kline bg-kbg/50 p-6 text-center">
              <MapPin className="mx-auto h-5 w-5 text-kmuted" />
              <p className="mt-2 text-[12px] font-bold text-body">Hakuna listing kwa sasa</p>
              <p className="text-[11px] font-semibold text-kmuted">This agent has no live listings yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {/* tenants say — DB-backed post-viewing reviews */}
          <div className="rounded-2xl border border-kline bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
                Tenants say • {ratingSummary.count} reviews
              </p>
              {ratingSummary.count > 0 && (
                <span className="rounded-full bg-verified-soft px-2 py-0.5 text-[10px] font-extrabold text-ok-strong">
                  {Math.round((reviews.filter((r) => r.verifiedStay).length / reviews.length) * 100)}% verified stays
                </span>
              )}
            </div>

            {/* rating summary — big avg + distribution bars */}
            {ratingSummary.count > 0 && (
              <div className="mt-3 flex items-center gap-4 rounded-2xl bg-kbg p-3.5">
                <div className="shrink-0 text-center">
                  <p className="font-display text-3xl font-extrabold leading-none text-body">{ratingSummary.avg}</p>
                  <Stars n={Math.round(ratingSummary.avg)} className="mt-1.5 justify-center" />
                  <p className="mt-1 text-[9.5px] font-bold text-kmuted">{ratingSummary.count} ratings</p>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const c = ratingSummary.dist[s - 1] ?? 0;
                    const pct = ratingSummary.count ? Math.round((c / ratingSummary.count) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-right text-[9.5px] font-extrabold text-kmuted">{s}★</span>
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-kline">
                          <div
                            className={cn("h-full rounded-full", s >= 4 ? "bg-verified" : s === 3 ? "bg-gold" : "bg-scam")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-[9.5px] font-bold tabular-nums text-kmuted">{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {myRating && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5">
                <Stars n={myRating.stars} />
                <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-body">
                  {myRating.comment || "Asante — rated after viewing"}
                </p>
                <span className="shrink-0 text-[10px] font-extrabold text-warn">YOUR RATING</span>
              </div>
            )}

            <ul className="mt-1 divide-y divide-kline">
              {reviews.map((r) => (
                <li key={r.id} className="flex gap-3 py-3 first:pt-3 last:pb-0">
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl font-display text-[10.5px] font-extrabold",
                      r.verifiedStay ? "bg-verified-soft text-ok-strong ring-1 ring-verified/30" : "bg-kbg text-kmuted"
                    )}
                    aria-hidden
                  >
                    {r.authorHandle.replace("@", "").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Stars n={r.stars} />
                      {r.verifiedStay && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-verified-soft px-1.5 py-0.5 text-[9px] font-extrabold text-ok-strong">
                          <CircleCheck className="h-2.5 w-2.5" /> VERIFIED STAY
                        </span>
                      )}
                      <span className="ml-auto text-[9.5px] font-semibold text-kmuted">{fmtDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold leading-relaxed text-body">{r.text}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-trust">{r.authorHandle}</p>
                  </div>
                </li>
              ))}
              {reviews.length === 0 && (
                <li className="py-3 text-center text-[11.5px] font-semibold text-kmuted">
                  No tenant reviews yet — be the first to rate after your viewing.
                </li>
              )}
            </ul>
          </div>

          {/* vault note */}
          <div className="flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-white" role="note">
            <Vault className="h-4 w-4 shrink-0 text-tiktok-cyan" />
            <p className="text-[11px] font-semibold leading-relaxed">
              Owner contact + door number stay in the private vault — released only after contact via masked phone.
            </p>
          </div>
        </div>
      </div>

      <RatingSheet
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        agentHandle={agent.tiktokHandle}
        agentId={agent.id}
        estateHint={listings[0]?.estate}
      />
    </div>
  );
}
