"use client";
// KEJA HALISI — Agent Trust Leaderboard ("Nairobi trust leaderboard")
// Ranks verified agents by a composite trust score: community rating, live
// upvotes from this device, listings, response speed and verification tier.
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Trophy, Medal, Crown, BadgeCheck, Star, Zap, Building2,
  ChevronRight, ArrowUp, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { fetchAgents } from "../api";
import { VerificationBadge } from "../badges";
import type { AgentDTO } from "@/lib/types";

type Row = {
  agent: AgentDTO;
  score: number;
  parts: { rating: number; listings: number; speed: number; tier: number; upvotes: number };
};

const TIER_BONUS: Record<string, number> = { gold: 30, verified: 20, caretaker: 14, pending: 0, rejected: -40 };

function computeRows(agents: AgentDTO[], upvotes: Record<string, true>): Row[] {
  return agents
    .filter((a) => a.verificationStatus !== "rejected")
    .map((agent) => {
      const ratingPts = Math.round(agent.rating * 10);          // 4.9★ → 49
      const listingPts = agent.listingsCount * 2;               // active agents
      const speedPts = Math.max(0, 20 - agent.responseTime);    // fast responders
      const tierPts = TIER_BONUS[agent.verificationStatus] ?? 0;
      const upvotePts = (upvotes[agent.id] ? 1 : 0) * 8;        // this-device community vote
      return {
        agent,
        parts: { rating: ratingPts, listings: listingPts, speed: speedPts, tier: tierPts, upvotes: upvotePts },
        score: ratingPts + listingPts + speedPts + tierPts + upvotePts,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export default function AgentsView() {
  const { back, navigate, activity, toggleUpvote } = useKeja();
  const t = useT();
  const [agents, setAgents] = useState<AgentDTO[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<"all" | "verified" | "gold" | "caretaker">("all");
  const [sort, setSort] = useState<"score" | "rating" | "speed" | "listings">("score");

  useEffect(() => {
    let alive = true;
    fetchAgents()
      .then((rows) => { if (alive) setAgents(rows); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    if (!agents) return [];
    let list = agents;
    if (filter === "verified") list = agents.filter((a) => a.verificationStatus === "verified" || a.verificationStatus === "gold");
    if (filter === "gold") list = agents.filter((a) => a.verificationStatus === "gold");
    if (filter === "caretaker") list = agents.filter((a) => a.verificationStatus === "caretaker");
    const scored = computeRows(list, activity.upvotes ?? {});
    if (sort === "rating") scored.sort((a, b) => b.agent.rating - a.agent.rating);
    if (sort === "speed") scored.sort((a, b) => a.agent.responseTime - b.agent.responseTime);
    if (sort === "listings") scored.sort((a, b) => b.agent.listingsCount - a.agent.listingsCount);
    return scored;
  }, [agents, filter, sort, activity.upvotes]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  /* ---------------- loading / error ---------------- */
  if (failed) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-10 text-center">
        <ShieldAlert className="mx-auto h-9 w-9 text-scam" />
        <p className="mt-3 font-display text-[15px] font-extrabold text-body">Leaderboard failed to load</p>
        <button onClick={() => { setFailed(false); setAgents(null); }} className="touch-target mt-4 rounded-full bg-trust px-5 py-2.5 text-[12.5px] font-extrabold text-white">
          Retry
        </button>
      </div>
    );
  }
  if (!agents) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-3 px-4 py-6">
        <div className="h-10 w-72 rounded-2xl shimmer" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-3xl shimmer" />)}
        </div>
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <button
        onClick={back}
        className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12.5px] font-extrabold text-body hover:bg-kbg"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="mt-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3.5 py-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-warn-strong">
          <Trophy className="h-4 w-4" /> {t("podium")}
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-body sm:text-3xl">{t("agentsTitle")}</h1>
        <p className="mt-1.5 max-w-xl text-[12.5px] font-semibold leading-relaxed text-kmuted">{t("agentsSub")}</p>
      </header>

      {/* filters + sort */}
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Leaderboard filters">
        {([
          { id: "all", label: "All" },
          { id: "verified", label: "Verified" },
          { id: "gold", label: "Gold" },
          { id: "caretaker", label: "Caretakers" },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "min-h-11 rounded-full px-4 py-2.5 text-[12px] font-extrabold transition-colors",
              filter === f.id ? "bg-ink text-white" : "bg-surface text-body/70 ring-1 ring-kline hover:bg-kbg"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-kline sm:block" aria-hidden />
        {([
          { id: "score", label: t("trustScore") },
          { id: "rating", label: "Rating" },
          { id: "speed", label: "Fastest" },
          { id: "listings", label: "Most listings" },
        ] as const).map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            aria-pressed={sort === s.id}
            className={cn(
              "min-h-11 rounded-full px-4 py-2.5 text-[11.5px] font-extrabold transition-colors",
              sort === s.id ? "bg-trust-soft text-trust ring-1 ring-trust" : "text-kmuted ring-1 ring-kline hover:text-body"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ============================ PODIUM ============================ */}
      {rows.length >= 1 && (
        <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Top 3 agents">
          {podium.map((r, i) => {
            const place = ["1st", "2nd", "3rd"][i];
            const MedalIcon = [Crown, Medal, Medal][i];
            const cls = [
              "border-gold/50 bg-gradient-to-b from-gold/10 to-surface shadow-[0_10px_30px_rgba(194,120,3,0.15)] sm:-translate-y-2",
              "border-kline bg-surface",
              "border-kline bg-surface",
            ][i];
            const medalCls = ["fill-gold text-gold", "text-kmuted", "text-[#b08d57]"][i];
            return (
              <article key={r.agent.id} className={cn("pop relative rounded-3xl border p-4", cls)} style={{ animationDelay: `${i * 60}ms` }}>
                <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-kbg px-2 py-0.5 text-[9.5px] font-extrabold text-kmuted">
                  <MedalIcon className={cn("h-3.5 w-3.5", medalCls)} /> {place}
                </span>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-trust to-verified font-display text-[15px] font-extrabold text-white">
                    {r.agent.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[13.5px] font-extrabold text-body">{r.agent.tiktokHandle}</p>
                    <div className="mt-1"><VerificationBadge status={r.agent.verificationStatus} role={r.agent.role} /></div>
                  </div>
                </div>
                <p className="mt-3 font-display text-3xl font-extrabold text-body">
                  {r.score}<span className="ml-1 text-[10px] font-extrabold uppercase tracking-wider text-kmuted">{t("trustScore")}</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold text-kmuted">
                  <span className="inline-flex items-center gap-1 rounded-full bg-kbg px-2 py-1"><Star className="h-3 w-3 fill-gold text-gold" /> {r.agent.rating}★</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-kbg px-2 py-1"><Building2 className="h-3 w-3 text-trust" /> {r.agent.listingsCount}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-kbg px-2 py-1"><Zap className="h-3 w-3 text-verified" /> ~{r.agent.responseTime}min</span>
                </div>
                <button
                  onClick={() => navigate("agent", { handle: r.agent.tiktokHandle })}
                  className="touch-target mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[11.5px] font-extrabold text-white"
                >
                  {t("viewProfile")} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </article>
            );
          })}
        </section>
      )}

      {/* ============================ TABLE ============================ */}
      {rest.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-kline bg-surface" aria-label="Agent rankings">
          {rest.map((r, i) => {
            const rank = i + 4;
            const upvoted = Boolean(activity.upvotes?.[r.agent.id]);
            return (
              <div
                key={r.agent.id}
                className="flex flex-wrap items-center gap-3 border-b border-kline px-4 py-3.5 transition-colors last:border-0 hover:bg-kbg"
              >
                <span className="w-8 shrink-0 text-center font-display text-[13px] font-extrabold text-kmuted">#{rank}</span>
                <button
                  onClick={() => navigate("agent", { handle: r.agent.tiktokHandle })}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-trust to-verified text-[12px] font-extrabold text-white">
                    {r.agent.tiktokHandle.replace("@", "").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-[13px] font-extrabold text-body hover:text-trust">
                      {r.agent.tiktokHandle} <ChevronRight className="h-3 w-3 shrink-0 text-kmuted" />
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-kmuted">
                      <span className="inline-flex items-center gap-1"><Star className="h-2.5 w-2.5 fill-gold text-gold" /> {r.agent.rating}★</span>
                      <span className="inline-flex items-center gap-1"><Building2 className="h-2.5 w-2.5 text-trust" /> {r.agent.listingsCount} listings</span>
                      <span className="inline-flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-verified" /> ~{r.agent.responseTime}min</span>
                    </span>
                  </span>
                </button>
                <div className="hidden sm:block"><VerificationBadge status={r.agent.verificationStatus} role={r.agent.role} /></div>
                <button
                  onClick={() => toggleUpvote(r.agent.id)}
                  aria-pressed={upvoted}
                  aria-label={`Upvote ${r.agent.tiktokHandle} as legit`}
                  className={cn(
                    "touch-target inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10.5px] font-extrabold transition-colors",
                    upvoted ? "border-verified bg-verified text-white" : "border-kline text-kmuted hover:border-verified hover:text-ok"
                  )}
                >
                  <ArrowUp className="h-3 w-3" /> {upvoted ? "Vouched" : "Vouch"}
                </button>
                <span className="ml-auto w-14 shrink-0 text-right font-display text-[15px] font-extrabold text-body">
                  {r.score}
                  <span className="sr-only"> {t("trustScore")}</span>
                </span>
              </div>
            );
          })}
        </section>
      )}

      {/* methodology */}
      <section className="mt-5 rounded-3xl border border-kline bg-surface p-5" aria-label="Scoring methodology">
        <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
          <BadgeCheck className="h-4 w-4 text-verified" /> How the trust score works
        </p>
        <div className="mt-3 grid gap-2 text-[11.5px] font-semibold text-kmuted sm:grid-cols-2">
          <p>• Community rating ×10 — stars earned from real renters after viewings</p>
          <p>• +2 per active listing — consistent, available inventory</p>
          <p>• Response speed bonus — replies in minutes, not days</p>
          <p>• Verification tier — Gold +30 • Verified +20 • Caretaker mandate +14</p>
          <p>• +8 community vouch from this device ("▲ legit")</p>
          <p>• Unverified posters and rejected agents never rank</p>
        </div>
        <button
          onClick={() => { navigate("verify"); toast("info", "Want on the leaderboard? Get verified first"); }}
          className="touch-target mt-4 inline-flex items-center gap-2 rounded-full bg-verified px-5 py-2.5 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <BadgeCheck className="h-4 w-4" /> Get verified — join the board
        </button>
      </section>

      {rows.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-kline bg-surface p-8 text-center text-[13px] font-semibold text-kmuted">
          No agents match this filter yet.
        </p>
      )}
    </div>
  );
}
