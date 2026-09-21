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
  BadgeCheck,
  MapPin,
  Vault,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { fetchAgentProfile } from "../api";
import { VerificationBadge } from "../badges";
import { ListingCard, ListingCardSkeleton } from "../listing-card";
import type { AgentDTO, ListingDTO } from "@/lib/types";

interface ProfileData {
  agent: AgentDTO;
  listings: ListingDTO[];
  verifications: { docType: string; status: string }[];
}

const DEMO_REVIEWS = [
  { text: "Keja ilikuwa real", stars: "5★", handle: "@mary" },
  { text: "No viewing fee, legit", stars: "5★", handle: "@john" },
  { text: "Alinipatia keja same day", stars: "4.8★", handle: "@wanjiku" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function AgentView() {
  const { params, back, navigate } = useKeja();
  const handle = params.handle || "@keja_kile";

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
          <h2 className="mt-4 font-display text-lg font-extrabold text-ink">Agent profile not found</h2>
          <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-kmuted">
            No agent registered as <span className="font-extrabold text-ink">{handle}</span>. The handle may have
            changed or the agent is still pending verification.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={back}
              className="touch-target inline-flex items-center gap-2 rounded-full border border-kline bg-white px-5 py-2.5 text-[12px] font-extrabold text-ink hover:bg-kbg"
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
  const { agent, listings, verifications } = data;
  const initials = agent.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase();

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
        <div className="-mt-8 px-1 sm:px-4">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink font-display text-lg font-extrabold text-white ring-4 ring-white"
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-display text-xl font-extrabold text-ink">{agent.tiktokHandle}</h2>
                <VerificationBadge status={agent.verificationStatus} role={agent.role} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] font-semibold text-kmuted">
                <BadgeCheck className="h-3.5 w-3.5 text-verified" />
                {agent.verifiedSince
                  ? `Verified since ${fmtDate(agent.verifiedSince)}`
                  : "Under review — not verified yet"}
                <span aria-hidden>•</span> Response {agent.rating}★
                <span aria-hidden>•</span> Reports {agent.reportsCount}
              </p>
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
                <p className="font-display text-lg font-extrabold text-ink">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-kmuted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* bio */}
          <div className="rounded-2xl border border-kline bg-card p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Bio Sheng</p>
            <p className="mt-1.5 text-[12.5px] font-semibold italic leading-relaxed text-ink">
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
                      <p className={cn("text-[12px] font-extrabold", verified ? "text-ink" : "text-ink/70")}>
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
              <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-[#145ca8]">
                Owner: (vault) • Estates: {agent.mandateEstates?.length ? agent.mandateEstates.join(", ") : "—"} •
                Expiry {agent.mandateExpiry ? fmtDate(agent.mandateExpiry) : "—"} • Private vault ID {vaultId}
              </p>
            </div>
          )}
        </div>

        {/* ---------- RIGHT ---------- */}
        <div className="space-y-4">
          <h3 className="font-display text-[15px] font-extrabold text-ink">
            All listings • {listings.length} verified kejas
          </h3>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-kline bg-kbg/50 p-6 text-center">
              <MapPin className="mx-auto h-5 w-5 text-kmuted" />
              <p className="mt-2 text-[12px] font-bold text-ink">Hakuna listing kwa sasa</p>
              <p className="text-[11px] font-semibold text-kmuted">This agent has no live listings yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {/* reviews */}
          <div className="rounded-2xl border border-kline bg-card p-4">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Reviews</p>
            <ul className="mt-3 divide-y divide-kline">
              {DEMO_REVIEWS.map((r) => (
                <li key={r.handle} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex shrink-0 items-center gap-0.5" aria-label={`${r.stars} rating`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.round(parseFloat(r.stars)) ? "fill-gold text-gold" : "text-kline"
                        )}
                      />
                    ))}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink">{r.text}</p>
                  <span className="shrink-0 text-[10.5px] font-extrabold text-trust">{r.stars}</span>
                  <span className="shrink-0 text-[10.5px] font-bold text-kmuted">• {r.handle}</span>
                </li>
              ))}
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
    </div>
  );
}
