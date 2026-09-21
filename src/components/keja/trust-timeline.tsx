"use client";
// KEJA HALISI — TrustTimeline: public transparency ledger for a listing.
// Renders the append-only audit trail (submitted → AI scan → admin review → edits)
// so renters can see the keja's history before they trust it.
import { useEffect, useState } from "react";
import {
  BadgeCheck, Bot, Camera, ClipboardList, FileWarning, Flag, Landmark,
  PencilLine, RefreshCcw, ScrollText, ShieldCheck, Star, UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/nairobi";
import type { ListingDTO } from "@/lib/types";

interface TimelineEvent {
  id: string;
  actor: string | null;
  action: string;
  timestamp: string;
}

const ACTION_META: Record<string, { label: string; icon: typeof ScrollText; tone: string; line: string }> = {
  "listing.submitted": { label: "Submitted with evidence checklist", icon: ClipboardList, tone: "bg-trust-soft text-trust", line: "bg-trust" },
  "listing.approved": { label: "Approved into the green catalog", icon: BadgeCheck, tone: "bg-verified-soft text-ok-strong", line: "bg-verified" },
  "listing.rejected": { label: "Rejected by moderation", icon: FileWarning, tone: "bg-scam-soft text-danger-strong", line: "bg-scam" },
  "listing.auto_hidden": { label: "Auto-hidden after 3 community reports", icon: ShieldCheck, tone: "bg-scam-soft text-danger-strong", line: "bg-scam" },
  "listing.price_updated": { label: "Price updated by the poster", icon: PencilLine, tone: "bg-pending-soft text-warn-strong", line: "bg-pending" },
  "listing.relisted": { label: "Relisted — 7-day freshness window reset", icon: RefreshCcw, tone: "bg-pending-soft text-warn-strong", line: "bg-pending" },
  "fee_signal.detected": { label: "AI scan — fee signal detected", icon: Bot, tone: "bg-scam-soft text-danger-strong", line: "bg-scam" },
  "ai.caption_parsed": { label: "AI scan — caption parsed & cross-checked", icon: Bot, tone: "bg-trust-soft text-trust", line: "bg-trust" },
  "report.submitted": { label: "Community report filed", icon: Flag, tone: "bg-pending-soft text-warn-strong", line: "bg-pending" },
  "evidence_checklist.incomplete": { label: "Evidence checklist incomplete at submit", icon: Camera, tone: "bg-pending-soft text-warn-strong", line: "bg-pending" },
};

const FALLBACK = { label: "Trust event recorded", icon: ScrollText, tone: "bg-kbg text-body", line: "bg-kmuted" };

const ACTOR_CLS: Record<string, string> = {
  admin: "bg-ink text-white",
  ai: "bg-tiktok text-white",
  system: "bg-kbg text-body",
  user: "bg-trust-soft text-trust",
  poster: "bg-trust-soft text-trust",
};

export function TrustTimeline({ listing }: { listing: ListingDTO }) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setEvents(null);
    setFailed(false);
    fetch(`/api/listings/${listing.id}/timeline`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("timeline unavailable"))))
      .then((rows: TimelineEvent[]) => { if (alive) setEvents(rows); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [listing.id]);

  // silent collapse — the ledger must never break the page
  if (failed || (events !== null && events.length === 0)) return null;

  return (
    <section className="rounded-2xl border border-kline bg-surface p-4" aria-label="Trust timeline" aria-busy={events === null}>
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
          <Landmark className="h-4 w-4 text-trust" /> Keja history ledger
        </p>
        <span className="rounded-full bg-kbg px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-kmuted">
          append-only
        </span>
      </header>
      <p className="mt-1 text-[10.5px] font-semibold text-kmuted">
        Every trust event on this listing — nothing can be edited or deleted, ever.
      </p>

      {events === null ? (
        <div className="mt-3 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded shimmer" />
                <div className="h-2.5 w-1/3 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ol className="relative mt-3.5 space-y-3.5 pl-1">
          {/* vertical connector */}
          <span className="absolute bottom-2 left-[15px] top-2 w-0.5 rounded bg-kline" aria-hidden />
          {events.map((e, i) => {
            const meta = ACTION_META[e.action] ?? FALLBACK;
            const Icon = meta.icon;
            const latest = i === 0;
            return (
              <li key={e.id} className="relative flex items-start gap-3">
                <span
                  className={cn(
                    "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-4 ring-surface",
                    meta.tone,
                    latest && "pop"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {latest && <span className="pulse-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-trust ring-2 ring-surface" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[11.5px] font-extrabold leading-snug text-body">{meta.label}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px] font-semibold text-kmuted">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide", ACTOR_CLS[e.actor ?? ""] ?? "bg-kbg text-kmuted")}>
                      <UserRound className="h-2.5 w-2.5" /> {e.actor ?? "system"}
                    </span>
                    <span>{timeAgo((Date.now() - new Date(e.timestamp).getTime()) / 3_600_000)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-3 flex items-center gap-1.5 border-t border-kline pt-2.5 text-[9px] font-bold text-kmuted/70">
        <Star className="h-3 w-3 text-gold" /> Full audit trail: {listing.estate} • listing {listing.id.slice(0, 8)} • wallet + reviews excluded (privacy)
      </p>
    </section>
  );
}
