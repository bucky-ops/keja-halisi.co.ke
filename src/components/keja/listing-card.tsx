"use client";
// KEJA HALISI — Listing card with ALL states
// default / hover lift / skeleton shimmer / expired-taken grayed / reported red border
import { Heart, MapPin, TriangleAlert, Play, BadgeCheck, Clock, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { kes } from "@/lib/nairobi";
import { useKeja, toast } from "@/lib/store";
import type { ListingDTO } from "@/lib/types";
import { FreshBadge, FeeWarningBadge, NoFeeBadge, VerifiedBadge, GoldBadge, CaretakerBadge, PendingBadge } from "./badges";

interface ListingCardProps {
  listing: ListingDTO;
  compact?: boolean;
  onOpen?: (listing: ListingDTO) => void;
  onCall?: (listing: ListingDTO) => void;
}

export function ListingCard({ listing: l, compact = false, onOpen, onCall }: ListingCardProps) {
  const { saved, toggleSaved, navigate, compare, toggleCompare } = useKeja();
  const isSaved = saved.includes(l.id);
  const inCompare = compare.includes(l.id);
  const expired = l.status === "Expired";
  const taken = l.status === "Taken";
  const reported = l.reportsCount >= 2;
  const grayed = expired || taken;

  const open = () => (onOpen ? onOpen(l) : navigate("listing", { listingId: l.id }));

  const save = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(l.id);
    toast("success", isSaved ? "Removed from your shortlist" : "Saved to your kejas • Heart filled");
  };

  const call = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCall) onCall(l);
    else toast("info", "Call • Number copied • Lead logged • Phone masked until contact");
  };

  return (
    <article
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && open()}
      className={cn(
        "group cursor-pointer rounded-3xl bg-card border border-kline shadow-[0_7px_22px_rgba(17,25,40,0.05)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,25,40,0.12)] focus-visible:outline-2 focus-visible:outline-trust",
        reported && "border-2 border-scam",
        grayed && "opacity-60 saturate-50"
      )}
    >
      {/* cover */}
      <div className={cn("relative keja-building", compact ? "h-28" : "h-40 sm:h-44")}>
        {/* faux TikTok play */}
        <div className="absolute inset-0 grid place-items-center">
          <span className="h-11 w-11 grid place-items-center rounded-full bg-surface/20 backdrop-blur-sm border border-white/30 transition-transform group-hover:scale-110">
            <Play className="h-4.5 w-4.5 text-white fill-white ml-0.5" />
          </span>
        </div>
        {/* badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[calc(100%-112px)]">
          {l.poster.verificationStatus === "gold" ? (
            <GoldBadge label="Gold" className="bg-surface/90" />
          ) : l.poster.verificationStatus === "caretaker" ? (
            <CaretakerBadge className="bg-surface/90" />
          ) : l.poster.verificationStatus === "verified" ? (
            <VerifiedBadge className="bg-surface/90" />
          ) : (
            <PendingBadge className="bg-surface/90" />
          )}
          <FreshBadge hours={l.freshH} />
          {!l.fee ? <NoFeeBadge className="bg-surface/90" /> : null}
        </div>
        {l.fee ? <FeeWarningBadge className="absolute bottom-2.5 right-2.5" /> : null}
        {/* heart */}
        <button
          onClick={save}
          aria-label={isSaved ? "Remove from saved" : "Save keja"}
          className="touch-target absolute top-2 right-2 grid place-items-center rounded-full bg-black/25 backdrop-blur-sm border border-white/25 hover:scale-110 transition-transform"
        >
          <Heart className={cn("h-4 w-4 text-white transition-all", isSaved && "fill-tiktok-pink text-tiktok-pink scale-110")} />
        </button>
        {/* compare toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(l.id);
            toast(
              "info",
              inCompare ? "Removed from compare tray" : `Added to compare tray • ${Math.min(compare.length + 1, 3)}/3`
            );
          }}
          aria-pressed={inCompare}
          aria-label={inCompare ? "Remove from compare" : "Add to compare"}
          title={inCompare ? "Remove from compare" : "Compare side-by-side (max 3)"}
          className={cn(
            "touch-target absolute top-2 right-14 grid h-11 w-11 place-items-center rounded-full border backdrop-blur-sm transition-all hover:scale-110",
            inCompare ? "border-trust bg-trust text-white" : "border-white/25 bg-black/25 text-white"
          )}
        >
          <Scale className="h-4 w-4" />
        </button>
        {/* estate chip */}
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-trust text-white px-2.5 py-1 text-[10.5px] font-extrabold">
          {l.estate}
        </span>
        {/* taken overlay */}
        {(expired || taken) && (
          <span className="absolute inset-x-0 bottom-10 mx-auto w-fit rounded-full bg-surface text-body px-3 py-1 text-[11px] font-extrabold shadow">
            {taken ? "Taken • no longer available" : "Expired • re-check pending"}
          </span>
        )}
      </div>

      {/* body */}
      <div className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("font-display font-bold text-body leading-tight", compact ? "text-[12.5px]" : "text-[14px]")}>
              {kes(l.price)}
              <span className="text-kmuted font-sans font-medium text-[11px]"> /mo</span>
            </p>
            <p className={cn("mt-0.5 truncate text-[11.5px] text-body/80 font-semibold", compact && "text-[10.5px]")}>{l.title}</p>
          </div>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-kmuted truncate">
          <MapPin className="h-3 w-3 shrink-0 text-trust" />
          {l.road ?? l.estate} • {l.subCounty} • {l.borough}
        </p>

        {/* meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px]">
          <span className="rounded-full bg-kbg px-2 py-0.5 font-semibold text-body/70">{l.beds}</span>
          <span className="rounded-full bg-kbg px-2 py-0.5 font-semibold text-body/70">~{l.responseTime}min resp</span>
          <span className="rounded-full bg-kbg px-2 py-0.5 font-semibold text-body/70">{l.distanceToRoadM}m to road</span>
          <span className="rounded-full bg-trust-soft px-2 py-0.5 font-semibold text-trust">{l.weather.temp}°C</span>
        </div>

        {reported && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-scam-soft px-2.5 py-1.5 text-[10.5px] font-bold text-danger-strong">
            <TriangleAlert className="h-3.5 w-3.5" /> Reported {l.reportsCount}x — hidden after 3 reports
          </p>
        )}

        {/* footer: agent + actions */}
        {!compact && (
          <div className="mt-3 flex items-center gap-2 border-t border-kline pt-3">
            <span className="h-7 w-7 shrink-0 grid place-items-center rounded-lg bg-gradient-to-br from-trust to-verified text-white text-[10px] font-extrabold">
              {l.poster.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-[11px] font-bold text-body">
                {l.poster.tiktokHandle}
                {l.poster.verificationStatus === "verified" && <BadgeCheck className="h-3 w-3 text-verified shrink-0" />}
                {l.poster.verificationStatus === "gold" && <span aria-hidden>👑</span>}
              </p>
              <p className="text-[9.5px] font-semibold text-verified">{l.poster.role} • {l.poster.rating}★</p>
            </div>
            <button
              onClick={call}
              className="touch-target rounded-full bg-verified px-3.5 py-2 text-[11px] font-extrabold text-white transition-transform active:scale-95 hover:shadow-md"
            >
              Call
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); open(); }}
              className="touch-target rounded-full bg-ink px-3.5 py-2 text-[11px] font-extrabold text-white transition-transform active:scale-95 hover:shadow-md"
            >
              View
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-3xl bg-card border border-kline overflow-hidden">
      <div className="h-40 shimmer" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-24 rounded shimmer" />
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-2/3 rounded shimmer" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 rounded-full shimmer" />
          <div className="h-5 w-16 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}

/** Mini card for horizontal rails / similar kejas */
export function MiniListingCard({ listing: l, onOpen }: { listing: ListingDTO; onOpen?: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-44 shrink-0 rounded-2xl bg-card border border-kline overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-24 keja-building grid place-items-center">
        <Play className="h-4 w-4 text-white fill-white" />
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-surface/90 px-2 py-0.5 text-[9.5px] font-extrabold text-body">
          {kes(l.price)}
        </span>
        {l.freshH <= 24 && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-ink/80 text-white px-1.5 py-0.5 text-[9px] font-bold">
            {l.freshH < 1 ? "<1" : Math.round(l.freshH)}h
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[11px] font-bold text-body">{l.estate} • {l.beds}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[9.5px] text-kmuted">
          <Clock className="h-2.5 w-2.5" /> ~{l.responseTime}min • {l.distanceToRoadM}m to road
        </p>
      </div>
    </button>
  );
}
