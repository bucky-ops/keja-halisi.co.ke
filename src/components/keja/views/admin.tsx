"use client";
// KEJA HALISI — AdminView: trust console (verification queue, reports, AI flags, audit, cron)
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck, Bot, Clock, Flag, Inbox, Play, ScrollText, ShieldCheck,
  Terminal, UserRound, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { kes, maskPhone, timeAgo } from "@/lib/nairobi";
import { toast, useKeja } from "@/lib/store";
import { Download } from "lucide-react";
import { fetchAdminAnalytics, fetchAdminQueue, reviewAgent, reviewListing, runCron, type AdminAnalytics } from "@/components/keja/api";
import { Sparkline } from "../sparkline";
import type { AgentDTO, AiFlag } from "@/lib/types";

type Queue = Awaited<ReturnType<typeof fetchAdminQueue>>;
type PendingAgent = AgentDTO & { _verifications?: { docType: string; status: string }[] };
type Tab = "agents" | "listings" | "reports" | "flagged" | "audit";

const AGENT_REJECT_REASONS = ["Fake docs", "Duplicate handle", "Fee complaint"];
const LISTING_REJECT_REASONS = ["Bait price", "Fake location", "Reposted video"];

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

function flagPillCls(sev: string) {
  if (sev === "red") return "bg-scam-soft text-danger-strong";
  if (sev === "amber") return "bg-pending-soft text-warn-strong";
  return "bg-trust-soft text-trust";
}

function FlagPill({ f }: { f: AiFlag }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[9.5px] font-extrabold", flagPillCls(f.severity))}>{f.label}</span>;
}

function DocChip({ docType, status }: { docType: string; status: string }) {
  const ok = status === "verified";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
        ok ? "bg-verified-soft text-ok" : status === "rejected" ? "bg-scam-soft text-danger-strong" : "bg-pending-soft text-warn-strong"
      )}
    >
      {ok ? <BadgeCheck className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {docType} {ok ? "✓" : status}
    </span>
  );
}

function Avatar({ handle }: { handle: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-trust to-verified text-[10.5px] font-extrabold text-white">
      {handle.replace("@", "").slice(0, 2).toUpperCase()}
    </span>
  );
}

/* Reject inline select — used for agents + listings */
function RejectSelect({
  reasons,
  busy,
  onConfirm,
  onCancel,
}: {
  reasons: string[];
  busy: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(reasons[0]);
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-scam-soft p-2">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Reject reason"
        className="touch-target rounded-full border border-scam/30 bg-surface px-3 text-[11.5px] font-bold text-danger-strong outline-none"
      >
        {reasons.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        onClick={() => onConfirm(reason)}
        disabled={busy}
        className="touch-target rounded-full bg-scam px-3.5 text-[11.5px] font-extrabold text-white disabled:opacity-50"
      >
        Confirm reject
      </button>
      <button onClick={onCancel} aria-label="Cancel reject" className="touch-target grid place-items-center rounded-full hover:bg-scam/10">
        <X className="h-3.5 w-3.5 text-danger-strong" />
      </button>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-kline bg-card p-3.5">
      <div className="h-9 w-9 shrink-0 rounded-xl shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 rounded shimmer" />
        <div className="h-3 w-24 rounded shimmer" />
      </div>
      <div className="h-8 w-20 rounded-full shimmer" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: typeof ShieldCheck; title: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-kline p-8 text-center">
      <Icon className="mx-auto h-6 w-6 text-kmuted" />
      <p className="mt-2 text-[12.5px] font-bold text-body">{title}</p>
      <p className="text-[11.5px] text-kmuted">{sub}</p>
    </div>
  );
}

export default function AdminView() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("agents");
  const [rejecting, setRejecting] = useState<{ kind: "agent" | "listing"; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cronBusy, setCronBusy] = useState<string | null>(null);
  const { notify } = useKeja();

  // CSV export — moderation data leaves the browser as a local download (privacy: masked fields only)
  const exportCsv = () => {
    if (!queue) return;
    let rows: string[][] = [];
    let name = "keja-export";
    if (tab === "agents") {
      name = "keja-agents";
      rows = [
        ["handle", "role", "status", "phone_masked", "rating", "listings", "reports"],
        ...queue.pendingAgents.map((a) => [
          a.tiktokHandle, a.role, a.verificationStatus, maskPhone(a.phone),
          String(a.rating), String(a.listingsCount ?? 0), String(a.reportsCount ?? 0),
        ]),
      ];
    } else if (tab === "listings") {
      name = "keja-listings";
      const listings = [...queue.flaggedListings, ...queue.pendingListings];
      rows = [
        ["id", "estate", "sub_county", "beds", "price_kes", "status", "publish_state", "fee", "reports"],
        ...listings.map((l) => [
          l.id, l.estate, l.subCounty, l.beds, String(l.price), l.status, l.publishState,
          l.fee ? "fee" : "none", String(l.reportsCount ?? 0),
        ]),
      ];
    } else if (tab === "reports") {
      name = "keja-reports";
      rows = [
        ["id", "estate", "reason", "created_at"],
        ...queue.reports.map((r) => [r.id, r.listing?.estate ?? "", r.reason, r.createdAt]),
      ];
    } else {
      toast("info", "CSV export available for Agents / Listings / Reports tabs");
      return;
    }
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", `Exported ${rows.length - 1} rows • ${name}.csv`);
    notify("success", "Moderation CSV exported", `${rows.length - 1} rows from the ${tab} queue downloaded — masked fields only.`);
  };

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setQueue(await fetchAdminQueue());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    fetchAdminAnalytics().then(setAnalytics).catch(() => {}); // trend row is additive — never blocks the queue
  }, [load]);

  const approveAgent = async (id: string) => {
    setBusy(true);
    try {
      await reviewAgent(id, "verified");
      toast("success", "Approved • Listing live • Agent gets push");
      setQueue(null);
      await load();
    } catch {
      toast("error", "Approve failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const rejectAgent = async (id: string, reason: string) => {
    setBusy(true);
    try {
      await reviewAgent(id, "rejected", reason);
      toast("warning", "Rejected • Reason sent to agent");
      setRejecting(null);
      setQueue(null);
      await load();
    } catch {
      toast("error", "Reject failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const approveListing = async (id: string) => {
    setBusy(true);
    try {
      await reviewListing(id, "approved");
      toast("success", "Listing approved • live in green catalog");
      setQueue(null);
      await load();
    } catch {
      toast("error", "Approve failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const rejectListing = async (id: string, reason: string) => {
    setBusy(true);
    try {
      await reviewListing(id, "rejected", reason);
      toast("warning", "Rejected • Agent notified with reason");
      setRejecting(null);
      setQueue(null);
      await load();
    } catch {
      toast("error", "Reject failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const cron = async (job: "expire-listings" | "nudge-availability") => {
    setCronBusy(job);
    try {
      const r = await runCron(job);
      if (job === "expire-listings") toast("success", `Expired ${Number(r.expired ?? 0)} listings`);
      else toast("info", `Nudged ${Number(r.nudged ?? 0)} agents — YES/NO SMS`);
      await load();
    } catch {
      toast("error", "Cron run failed");
    } finally {
      setCronBusy(null);
    }
  };

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "agents", label: "Agents pending", n: queue?.pendingAgents.length ?? 0 },
    { id: "listings", label: "Listings pending", n: queue?.pendingListings.length ?? 0 },
    { id: "reports", label: "Reports", n: queue?.reports.length ?? 0 },
    { id: "flagged", label: "AI Flagged", n: queue?.flaggedListings.length ?? 0 },
    { id: "audit", label: "Audit log", n: queue?.audits.length ?? 0 },
  ];

  // queue response spreads _verifications into agent rows (private vault stays server-side)
  const pendingAgents = (queue?.pendingAgents ?? []) as PendingAgent[];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-extrabold text-body">Admin trust console</h1>
          <p className="mt-0.5 text-[12px] text-kmuted">Verification queue • reports • AI flags • append-only audit</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-verified-soft px-3 py-1 text-[10.5px] font-extrabold text-ok">
          <ShieldCheck className="h-3.5 w-3.5" /> No viewing fee before viewing — enforced
        </span>
      </div>

      {/* cron panel */}
      <section className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-kline bg-card p-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
            <Terminal className="h-4 w-4 text-verified" /> Cron panel
          </p>
          <p className="mt-0.5 text-[11.5px] text-kmuted">Daily expiry sweep + 72h availability nudges — Africa&apos;s Talking SMS (mock)</p>
        </div>
        <button
          onClick={() => void cron("expire-listings")}
          disabled={cronBusy !== null}
          className="touch-target rounded-full bg-ink px-4 font-extrabold text-[11.5px] text-white disabled:opacity-50"
        >
          {cronBusy === "expire-listings" ? "Running..." : "Run expire-listings"}
        </button>
        <button
          onClick={() => void cron("nudge-availability")}
          disabled={cronBusy !== null}
          className="touch-target rounded-full bg-trust px-4 font-extrabold text-[11.5px] text-white disabled:opacity-50"
        >
          {cronBusy === "nudge-availability" ? "Running..." : "Run nudge-availability"}
        </button>
      </section>

      {/* trust trend — 14-day sparklines (listings / reports / leads) */}
      {analytics && (
        <section className="mt-3 rounded-3xl border border-kline bg-card p-4" aria-label="Trust trend">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
              <Bot className="h-4 w-4 text-trust" /> Trust trend • last 14 days
            </p>
            <p className="text-[10px] font-semibold text-kmuted">
              {analytics.days[0]} → {analytics.days[analytics.days.length - 1]} • vs previous 14 days
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Sparkline
              data={analytics.listings}
              color="text-verified"
              fillFrom="#0E9F6E"
              fillTo="#0E9F6E"
              label="New listings"
              total={analytics.totals.listings}
              delta={analytics.deltas.listings}
            />
            <Sparkline
              data={analytics.reports}
              color="text-scam"
              fillFrom="#E02424"
              fillTo="#E02424"
              label="Reports filed"
              total={analytics.totals.reports}
              delta={analytics.deltas.reports}
            />
            <Sparkline
              data={analytics.leads}
              color="text-trust"
              fillFrom="#1976D2"
              fillTo="#1976D2"
              label="Leads (masked)"
              total={analytics.totals.leads}
              delta={analytics.deltas.leads}
            />
          </div>
        </section>
      )}

      {/* tabs with counts */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-hide pb-0.5" role="tablist" aria-label="Admin queues">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "touch-target flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-extrabold transition-colors",
                tab === t.id ? "border-ink bg-ink text-white" : "border-kline bg-card text-kmuted hover:text-body"
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[10px]", tab === t.id ? "bg-white/20" : "bg-kbg")}>{t.n}</span>
            </button>
          ))}
        </div>
        <button
          onClick={exportCsv}
          disabled={!queue}
          title="Download current queue as CSV (masked fields only)"
          className="touch-target inline-flex shrink-0 items-center gap-1.5 rounded-full border border-trust/40 bg-trust/10 px-3.5 text-[12px] font-extrabold text-trust hover:bg-trust/20 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      <div className="mt-4">
        {/* failed state */}
        {failed && (
          <div className="rounded-3xl border border-kline bg-card p-8 text-center">
            <p className="font-display text-[15px] font-extrabold text-body">Queue failed to load</p>
            <button onClick={() => void load()} className="touch-target mt-3 rounded-full bg-trust px-5 font-extrabold text-[12.5px] text-white">
              Retry
            </button>
          </div>
        )}

        {/* loading skeletons */}
        {!queue && !failed && (
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => <RowSkeleton key={i} />)}
          </div>
        )}

        {/* ================= AGENTS PENDING ================= */}
        {queue && tab === "agents" && (
          <div className="space-y-2.5">
            {/* desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-kline bg-card md:block">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-kbg text-[10.5px] uppercase tracking-wide text-kmuted">
                  <tr>
                    <th className="px-4 py-3 font-extrabold">Agent</th>
                    <th className="px-4 py-3 font-extrabold">Verification docs</th>
                    <th className="px-4 py-3 font-extrabold">ID preview</th>
                    <th className="px-4 py-3 text-right font-extrabold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAgents.map((a) => {
                    const docs = a._verifications ?? [];
                    return (
                      <tr key={a.id} className="border-t border-kline align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar handle={a.tiktokHandle} />
                            <div>
                              <p className="font-extrabold text-body">{a.tiktokHandle}</p>
                              <p className="text-[10.5px] text-kmuted">{a.role} • {maskPhone(a.phone)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            {docs.length > 0 ? (
                              docs.map((v) => <DocChip key={v.docType} docType={v.docType} status={v.status} />)
                            ) : (
                              <span className="text-[10.5px] text-kmuted">no docs submitted</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toast("info", "ID docs are private-vault only • masked preview")}
                            className="touch-target rounded-xl border-2 border-dashed border-kline px-3 text-[10.5px] font-bold text-kmuted hover:border-trust hover:text-trust"
                          >
                            ID preview • private vault 🔒
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {rejecting?.kind === "agent" && rejecting.id === a.id ? (
                              <RejectSelect
                                reasons={AGENT_REJECT_REASONS}
                                busy={busy}
                                onConfirm={(r) => void rejectAgent(a.id, r)}
                                onCancel={() => setRejecting(null)}
                              />
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => void approveAgent(a.id)}
                                  disabled={busy}
                                  className="touch-target rounded-full bg-verified px-4 text-[11.5px] font-extrabold text-white disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejecting({ kind: "agent", id: a.id })}
                                  className="touch-target rounded-full bg-scam px-4 text-[11.5px] font-extrabold text-white"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="space-y-2.5 md:hidden">
              {pendingAgents.map((a) => {
                const docs = a._verifications ?? [];
                return (
                  <div key={a.id} className="rounded-2xl border border-kline bg-card p-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar handle={a.tiktokHandle} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-extrabold text-body">{a.tiktokHandle}</p>
                        <p className="text-[10.5px] text-kmuted">{a.role} • {maskPhone(a.phone)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {docs.length > 0 ? docs.map((v) => <DocChip key={v.docType} docType={v.docType} status={v.status} />) : <span className="text-[10.5px] text-kmuted">no docs submitted</span>}
                    </div>
                    <button
                      onClick={() => toast("info", "ID docs are private-vault only • masked preview")}
                      className="mt-2 w-full rounded-xl border-2 border-dashed border-kline py-2 text-[10.5px] font-bold text-kmuted"
                    >
                      ID preview • private vault 🔒
                    </button>
                    {rejecting?.kind === "agent" && rejecting.id === a.id ? (
                      <div className="mt-2">
                        <RejectSelect
                          reasons={AGENT_REJECT_REASONS}
                          busy={busy}
                          onConfirm={(r) => void rejectAgent(a.id, r)}
                          onCancel={() => setRejecting(null)}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => void approveAgent(a.id)}
                          disabled={busy}
                          className="touch-target rounded-full bg-verified text-[11.5px] font-extrabold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejecting({ kind: "agent", id: a.id })}
                          className="touch-target rounded-full bg-scam text-[11.5px] font-extrabold text-white"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {pendingAgents.length === 0 && (
              <EmptyState icon={UserRound} title="Agent queue clear" sub="No pending verifications — new signups appear here." />
            )}
          </div>
        )}

        {/* ================= LISTINGS PENDING ================= */}
        {queue && tab === "listings" && (
          <div className="space-y-2.5">
            {queue.pendingListings.map((l) => (
              <div key={l.id} className="flex flex-col gap-3 rounded-2xl border border-kline bg-card p-3.5 sm:flex-row sm:items-center">
                <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-xl keja-building">
                  <Play className="h-4 w-4 text-white fill-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold text-body">
                    {kes(l.price)} <span className="text-[11px] font-semibold text-kmuted">/mo • {l.beds}</span>
                  </p>
                  <p className="truncate text-[11.5px] text-body/80">{l.title}</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-kmuted">
                    {l.estate} • {l.subCounty} • {l.poster.tiktokHandle}
                  </p>
                  {l.aiFlags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {l.aiFlags.map((f) => <FlagPill key={f.type} f={f} />)}
                    </div>
                  )}
                </div>
                {rejecting?.kind === "listing" && rejecting.id === l.id ? (
                  <RejectSelect
                    reasons={LISTING_REJECT_REASONS}
                    busy={busy}
                    onConfirm={(r) => void rejectListing(l.id, r)}
                    onCancel={() => setRejecting(null)}
                  />
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => void approveListing(l.id)}
                      disabled={busy}
                      className="touch-target rounded-full bg-verified px-4 text-[11.5px] font-extrabold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejecting({ kind: "listing", id: l.id })}
                      className="touch-target rounded-full bg-scam px-4 text-[11.5px] font-extrabold text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {queue.pendingListings.length === 0 && (
              <EmptyState icon={BadgeCheck} title="Listings queue clear" sub="All submitted listings reviewed — new ones land here." />
            )}
          </div>
        )}

        {/* ================= REPORTS ================= */}
        {queue && tab === "reports" && (
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-scam-soft border border-scam/25 px-4 py-3 text-[12px] font-bold text-danger-strong">
              3 reports auto-hide listing + agent review.
            </div>
            {queue.reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-kline bg-card px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-scam-soft text-scam">
                  <Flag className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-extrabold text-body">
                    {r.reason} • {r.listing.estate || "—"} • {timeAgo(hoursSince(r.createdAt))}
                  </p>
                  {r.details && <p className="truncate text-[11px] text-kmuted">{r.details}</p>}
                </div>
                <button
                  onClick={() => setTab("listings")}
                  className="touch-target rounded-full bg-scam px-4 text-[11px] font-extrabold text-white transition-transform active:scale-95"
                >
                  Review
                </button>
              </div>
            ))}
            {queue.reports.length === 0 && <EmptyState icon={Flag} title="No open reports" sub="User reports appear here the moment they land." />}
          </div>
        )}

        {/* ================= AI FLAGGED ================= */}
        {queue && tab === "flagged" && (
          <div className="space-y-2.5">
            {queue.flaggedListings.map((l) => (
              <div key={l.id} className="flex flex-col gap-3 rounded-2xl border border-kline bg-card p-3.5 sm:flex-row sm:items-center">
                <div className="w-full sm:w-auto">
                  <div className="relative h-20 w-full sm:h-20 sm:w-20 shrink-0 place-items-center rounded-xl keja-building grid">
                    <Play className="h-4 w-4 text-white fill-white" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 py-0.5 text-[8px] font-bold text-white">▶️ Auto mute</span>
                  </div>
                  <p className="mt-1 hidden text-center text-[8.5px] font-semibold text-kmuted sm:block">Hover play • TikTok video</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold text-body">
                    {kes(l.price)} <span className="text-[11px] font-semibold text-kmuted">/mo • {l.beds}</span>
                  </p>
                  <p className="truncate text-[11.5px] text-body/80">{l.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-kmuted">
                    {l.estate} • {l.subCounty} • {l.reportsCount} report{l.reportsCount === 1 ? "" : "s"}
                  </p>
                  {l.aiFlags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {l.aiFlags.map((f) => <FlagPill key={f.type} f={f} />)}
                    </div>
                  )}
                </div>
                {rejecting?.kind === "listing" && rejecting.id === l.id ? (
                  <RejectSelect
                    reasons={LISTING_REJECT_REASONS}
                    busy={busy}
                    onConfirm={(r) => void rejectListing(l.id, r)}
                    onCancel={() => setRejecting(null)}
                  />
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => void approveListing(l.id)}
                      disabled={busy}
                      className="touch-target rounded-full bg-verified px-4 text-[11.5px] font-extrabold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejecting({ kind: "listing", id: l.id })}
                      className="touch-target rounded-full bg-scam px-4 text-[11.5px] font-extrabold text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {queue.flaggedListings.length === 0 && (
              <EmptyState icon={Bot} title="Nothing AI-flagged" sub="Repost, fee-signal and bait-price flags will queue here." />
            )}
          </div>
        )}

        {/* ================= AUDIT LOG ================= */}
        {queue && tab === "audit" && (
          <div className="rounded-2xl border border-kline bg-card p-4">
            <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
              <ScrollText className="h-4 w-4 text-trust" /> audit_events — append-only • no update/delete
            </p>
            <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto keja-scroll">
              {queue.audits.map((e) => (
                <li key={e.id} className="rounded-lg bg-kbg px-3 py-2 font-mono text-[11px] text-body/85">
                  [{new Date(e.timestamp).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}] {e.action} • {e.object}{" "}
                  {e.objectId ? e.objectId.slice(0, 8) : "—"}
                </li>
              ))}
            </ul>
            {queue.audits.length === 0 && <EmptyState icon={Inbox} title="Audit empty" sub="Every admin action writes an immutable row here." />}
          </div>
        )}
      </div>
    </div>
  );
}
