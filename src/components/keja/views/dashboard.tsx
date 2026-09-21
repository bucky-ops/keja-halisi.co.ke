"use client";
// KEJA HALISI — DashboardView: Developer / Owner / Caretaker console
// Sidebar tabs + role switcher. Developer = live data (@syokimau_developer).
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, Building2, CreditCard, Crown, KeyRound, Phone, Plus, RefreshCw,
  Smartphone, Users, Wallet, X, type LucideIcon, Tag, Check, Home as HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { kes, timeAgo } from "@/lib/nairobi";
import { toast, useKeja } from "@/lib/store";
import { fetchDeveloperDashboard, fetchListings, toggleUnit, updateListingPrice, toggleListingStatus, relistListing } from "@/components/keja/api";
import { GoldBadge, PendingBadge, VerifiedBadge } from "@/components/keja/badges";
import type { UnitDTO, ListingDTO } from "@/lib/types";

type DashData = Awaited<ReturnType<typeof fetchDeveloperDashboard>>;
type Role = "Developer" | "Owner" | "Caretaker";
type Tab = "projects" | "units" | "leads" | "payments" | "subscription";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "projects", label: "My Projects", icon: Building2 },
  { id: "units", label: "Units", icon: KeyRound },
  { id: "leads", label: "Leads", icon: Users },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

const DEMO_INVOICES = [{ receipt: "KH-2026-1247", date: "15 May 2026", plan: "Pro", amount: 999 }];

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

/* ---------------- Owner poster tools: manage your live listings ---------------- */
function OwnerListings() {
  const { navigate } = useKeja();
  const [rows, setRows] = useState<ListingDTO[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const OWNER_HANDLE = "@east_hub"; // demo owner persona (direct landlord, no commission)

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const all = await fetchListings({ limit: 60 });
      setRows(all.filter((l) => l.poster.tiktokHandle === OWNER_HANDLE));
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePrice = async (l: ListingDTO) => {
    const p = Number(draft);
    if (!Number.isFinite(p) || p < 1000) {
      toast("warning", "Enter a valid rent (min KES 1,000)");
      return;
    }
    setBusy(l.id);
    try {
      await updateListingPrice(l.id, p);
      setRows((prev) => (prev ?? []).map((r) => (r.id === l.id ? { ...r, price: Math.round(p) } : r)));
      setEditId(null);
      toast("success", `Price updated — KES ${p.toLocaleString()} • audit trail saved`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const flipStatus = async (l: ListingDTO) => {
    const next = l.status === "Available" ? "Taken" : "Available";
    setBusy(l.id);
    try {
      await toggleListingStatus(l.id, next);
      setRows((prev) => (prev ?? []).map((r) => (r.id === l.id ? { ...r, status: next as ListingDTO["status"] } : r)));
      toast(next === "Taken" ? "warning" : "success", next === "Taken" ? "Marked Taken — hides from fresh search" : "Back on the market — relisted");
    } catch {
      toast("error", "Status toggle failed");
    } finally {
      setBusy(null);
    }
  };

  const relist = async (l: ListingDTO) => {
    setBusy(l.id);
    try {
      await relistListing(l.id);
      setRows((prev) => (prev ?? []).map((r) => (r.id === l.id ? { ...r, status: "Available", freshH: 0 } : r)));
      toast("success", "Relisted • expiry extended 7 days • SMS nudge reset");
    } catch {
      toast("error", "Relist failed");
    } finally {
      setBusy(null);
    }
  };

  if (failed) {
    return (
      <p className="mt-3 rounded-2xl border border-kline bg-card p-4 text-[12px] font-semibold text-kmuted">
        Could not load your listings — check the API and retry.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2.5">
      {(rows ?? []).map((l) => {
        const hoursLeft = Math.round((new Date(l.expiresAt).getTime() - Date.now()) / 3_600_000);
        const expiringSoon = hoursLeft < 48;
        return (
          <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-kline bg-card p-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-trust to-verified text-white">
              <HomeIcon className="h-5 w-5" />
            </span>
            <button onClick={() => navigate("listing", { listingId: l.id })} className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-extrabold text-body hover:text-trust">{l.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-kmuted">
                {l.beds} • {l.estate} • {l.views} views
                {expiringSoon ? <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-pending-soft px-1.5 py-0.5 text-[9px] font-extrabold text-warn-strong"><RefreshCw className="h-2.5 w-2.5" /> expires {hoursLeft <= 0 ? "now" : `${hoursLeft}h`}</span> : null}
              </p>
            </button>

            {/* inline price edit */}
            {editId === l.id ? (
              <span className="flex items-center gap-1.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  inputMode="numeric"
                  autoFocus
                  aria-label="New rent price"
                  className="w-24 rounded-xl border border-kline px-2.5 py-2 text-[12px] font-bold text-body outline-none focus:border-trust focus:ring-4 focus:ring-trust/10"
                />
                <button
                  onClick={() => void savePrice(l)}
                  disabled={busy === l.id}
                  className="touch-target grid h-9 w-9 place-items-center rounded-full bg-verified text-white disabled:opacity-50"
                  aria-label="Save price"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="touch-target grid h-9 w-9 place-items-center rounded-full border border-kline text-kmuted"
                  aria-label="Cancel price edit"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ) : (
              <button
                onClick={() => { setEditId(l.id); setDraft(String(l.price)); }}
                className="touch-target inline-flex items-center gap-1.5 rounded-full bg-kbg px-3 py-2 text-[12px] font-extrabold text-body transition-colors hover:bg-ink hover:text-white"
                aria-label={`Edit price, current KES ${l.price.toLocaleString()}`}
              >
                <Tag className="h-3.5 w-3.5 text-trust" /> KES {l.price.toLocaleString()}
              </button>
            )}

            <span className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold",
              l.status === "Available" ? "bg-verified-soft text-ok" : l.status === "Reserved" ? "bg-pending-soft text-warn-strong" : "bg-black/10 text-kmuted"
            )}>
              {l.status}
            </span>

            <button
              onClick={() => void flipStatus(l)}
              disabled={busy === l.id}
              className="touch-target rounded-full border border-kline px-3.5 py-2 text-[11px] font-extrabold text-body transition-colors hover:bg-kbg disabled:opacity-50"
            >
              {l.status === "Available" ? "Mark taken" : "Mark available"}
            </button>
            {(expiringSoon || l.status === "Taken") && (
              <button
                onClick={() => void relist(l)}
                disabled={busy === l.id}
                className="touch-target inline-flex items-center gap-1.5 rounded-full bg-trust-soft px-3.5 py-2 text-[11px] font-extrabold text-trust transition-colors hover:bg-trust hover:text-white disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Relist 7d
              </button>
            )}
          </div>
        );
      })}
      {rows !== null && rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-kline bg-card p-5 text-center text-[12.5px] font-semibold text-kmuted">
          No live listings for {OWNER_HANDLE} yet — post your first keja.
        </p>
      )}
      {rows === null && <div className="h-16 rounded-2xl shimmer" />}
    </div>
  );
}

function expiryChip(u: UnitDTO, now: number | null) {
  if (!u.expiresAt || now === null) return null;
  const h = Math.ceil((new Date(u.expiresAt).getTime() - now) / 3_600_000);
  return (
    <span
      className={cn(
        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold",
        h <= 0 ? "bg-pending-soft text-warn-strong" : "bg-trust-soft text-trust"
      )}
    >
      <RefreshCw className="h-2.5 w-2.5" />
      {h <= 0 ? "Expiry due • Re-check enabled" : `Expiry in ${h}h • Re-check enabled`}
    </span>
  );
}

function statusPill(status: string) {
  const taken = status === "Taken";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold",
        taken ? "bg-black/10 text-kmuted" : "bg-verified-soft text-ok"
      )}
    >
      {status}
    </span>
  );
}

export default function DashboardView() {
  const { navigate } = useKeja();
  const [data, setData] = useState<DashData | null>(null);
  const [failed, setFailed] = useState(false);
  const [role, setRole] = useState<Role>("Developer");
  const [tab, setTab] = useState<Tab>("units");
  const [now, setNow] = useState<number | null>(null);
  const [confirmUnit, setConfirmUnit] = useState<{ unit: UnitDTO; next: string } | null>(null);
  const [busyUnit, setBusyUnit] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", units: "" });
  const [extraProjects, setExtraProjects] = useState<{ name: string; location: string; totalUnits: number }[]>([]);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setData(await fetchDeveloperDashboard("@syokimau_developer"));
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // expiry countdown ticks every 60s
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dev = data?.developer;
  const projectName = dev?.projects[0]?.name ?? "Syokimau Heights";

  const doToggle = async () => {
    if (!confirmUnit) return;
    setBusyUnit(true);
    const { unit, next } = confirmUnit;
    try {
      await toggleUnit(unit.id, next);
      setData((prev) =>
        prev
          ? {
              ...prev,
              developer: {
                ...prev.developer,
                units: prev.developer.units.map((u) => (u.id === unit.id ? { ...u, status: next } : u)),
              },
            }
          : prev
      );
      if (next === "Taken") toast("warning", "Listing marked Taken • Auto nudge in 2 days?");
      else toast("success", "Unit available again • leads notified");
      setConfirmUnit(null);
    } catch {
      toast("error", "Could not update unit — try again");
    } finally {
      setBusyUnit(false);
    }
  };

  const addProject = () => {
    if (!form.name.trim() || !form.location.trim()) {
      toast("warning", "Project name and location are required");
      return;
    }
    setExtraProjects((p) => [
      ...p,
      { name: form.name.trim(), location: form.location.trim(), totalUnits: Number(form.units) || 0 },
    ]);
    setForm({ name: "", location: "", units: "" });
    setAddOpen(false);
    toast("success", "Project added (demo)");
  };

  /* ---------- loading / error ---------- */
  if (failed) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="rounded-3xl border border-kline bg-card p-8 text-center">
          <p className="font-display text-[15px] font-extrabold text-body">Dashboard failed to load</p>
          <p className="mt-1 text-[12px] text-kmuted">Check the API and retry — developer @syokimau_developer not found.</p>
          <button onClick={() => void load()} className="touch-target mt-4 rounded-full bg-trust px-5 font-extrabold text-[12.5px] text-white">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[14rem_1fr]">
          <aside className="hidden space-y-3 lg:block">
            <div className="h-44 rounded-3xl shimmer" />
            <div className="h-56 rounded-3xl shimmer" />
          </aside>
          <div className="space-y-4">
            <div className="h-10 w-72 rounded-2xl shimmer" />
            <div className="h-14 rounded-2xl shimmer" />
            <div className="h-80 rounded-3xl shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* header + role switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-extrabold text-body">Owner &amp; Developer dashboard</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-kmuted">
            @syokimau_developer <GoldBadge label="Gold" /> {dev?.companyName ?? "Syokimau Heights Ltd"}
          </p>
        </div>
        <div className="inline-flex rounded-full border border-kline bg-card p-1" role="tablist" aria-label="Dashboard role">
          {(["Developer", "Owner", "Caretaker"] as Role[]).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={cn(
                "touch-target rounded-full px-4 text-[12px] font-extrabold transition-colors",
                role === r ? "bg-ink text-white" : "text-kmuted hover:text-body"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ================= OWNER ROLE ================= */}
      {role === "Owner" && (
        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-kline bg-card p-6">
              <h2 className="font-display text-[16px] font-extrabold text-body">Owner: Single unit flow</h2>
              <p className="mt-1 text-[12.5px] text-kmuted">
                Post your own keja without commission. Phone stays masked until a lead is logged.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["Add property", "Evidence video", "Availability", "Leads"].map((s, i) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="rounded-full bg-trust-soft px-3 py-1.5 text-[11.5px] font-extrabold text-trust">{s}</span>
                    {i < 3 && <ArrowRight className="h-3.5 w-3.5 text-kmuted" aria-hidden />}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-1.5 text-[12px] text-body/80">
                <li>• Shoot the 5-point evidence video: outside, gate, inside, water running, window view.</li>
                <li>• Price + deposit must match your caption — AI bait-price checks run on submit.</li>
                <li>• Listing re-checks every 72h — reply YES/NO SMS to keep it live.</li>
              </ul>
              <button
                onClick={() => navigate("post")}
                className="touch-target mt-5 rounded-full bg-verified px-5 font-extrabold text-[12.5px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Add your keja — start posting
              </button>
            </div>

            {/* poster tools — manage live listings */}
            <div className="rounded-3xl border border-kline bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-[16px] font-extrabold text-body">Your live listings</h2>
                <span className="rounded-full bg-kbg px-3 py-1 text-[10.5px] font-extrabold text-kmuted">demo persona @east_hub</span>
              </div>
              <p className="mt-1 text-[12.5px] text-kmuted">
                Edit rent inline, mark Taken the moment it lets, or relist before the 72h re-check lapses.
              </p>
              <OwnerListings />
            </div>
          </div>
          <div className="rounded-3xl bg-tiktok p-5 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55">Owner messaging</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">
              Leads show masked (07** *** xxx) until you log the call. No viewing fee before viewing — asking for one is a ban.
            </p>
            <button
              onClick={() => navigate("payments")}
              className="touch-target mt-4 w-full rounded-full bg-surface font-extrabold text-[12px] text-body"
            >
              Manage wallet &amp; payouts
            </button>
          </div>
        </section>
      )}

      {/* ================= CARETAKER ROLE ================= */}
      {role === "Caretaker" && (
        <section className="mt-5 space-y-4">
          <div className="rounded-3xl border border-kline bg-card p-6">
            <h2 className="font-display text-[16px] font-extrabold text-body">Estate-limited dashboard</h2>
            <p className="mt-1 text-[12.5px] text-kmuted">You can only manage units inside your owner mandate — nothing else.</p>

            {/* desktop table */}
            <div className="mt-4 hidden overflow-hidden rounded-2xl border border-kline md:block">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-kbg text-[10.5px] uppercase tracking-wide text-kmuted">
                  <tr>
                    <th className="px-4 py-3 font-extrabold">Caretaker</th>
                    <th className="px-4 py-3 font-extrabold">Estates permitted</th>
                    <th className="px-4 py-3 font-extrabold">Mandate</th>
                    <th className="px-4 py-3 font-extrabold">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-kline">
                    <td className="px-4 py-3 font-bold text-body">James Mwangi</td>
                    <td className="px-4 py-3 text-body/80">Kileleshwa, Lavington</td>
                    <td className="px-4 py-3"><VerifiedBadge /></td>
                    <td className="px-4 py-3 font-mono text-[11.5px]">2026-03-01</td>
                  </tr>
                  <tr className="border-t border-kline">
                    <td className="px-4 py-3 font-bold text-body">Faith A.</td>
                    <td className="px-4 py-3 text-body/80">Syokimau only</td>
                    <td className="px-4 py-3"><PendingBadge /></td>
                    <td className="px-4 py-3 font-mono text-[11.5px]">2025-12-12</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="mt-4 space-y-2 md:hidden">
              {[
                { name: "James Mwangi", estates: "Kileleshwa, Lavington", ok: true, expiry: "2026-03-01" },
                { name: "Faith A.", estates: "Syokimau only", ok: false, expiry: "2025-12-12" },
              ].map((c) => (
                <div key={c.name} className="rounded-2xl border border-kline p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-extrabold text-body">{c.name}</p>
                    {c.ok ? <VerifiedBadge /> : <PendingBadge />}
                  </div>
                  <p className="mt-1 text-[11.5px] text-kmuted">Estates: {c.estates} • Mandate expires {c.expiry}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-xl bg-trust-soft px-3.5 py-2.5 text-[11.5px] font-semibold text-trust">
              Minimum privilege by role — cannot list outside mandate.
            </p>
          </div>
        </section>
      )}

      {/* ================= DEVELOPER (default) ================= */}
      {role === "Developer" && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[14rem_1fr]">
          {/* sidebar */}
          <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide lg:flex-col" aria-label="Dashboard sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id}
                  className={cn(
                    "touch-target flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 text-[12.5px] font-extrabold transition-colors",
                    tab === t.id ? "bg-ink text-white" : "bg-card text-kmuted hover:bg-kbg hover:text-body border border-kline"
                  )}
                >
                  <t.icon className="h-4 w-4 shrink-0" />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* subscription card */}
            <div className="mt-4 hidden rounded-3xl border border-kline bg-card p-4 lg:block">
              <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-kmuted">
                <CreditCard className="h-3.5 w-3.5" /> Subscription
              </p>
              <p className="mt-2 text-[12.5px] font-bold leading-relaxed text-body">
                Pro — KES 999/mo • 20 listings • Gold badge • Top search
              </p>
              <button
                onClick={() => navigate("payments")}
                className="touch-target mt-3 w-full rounded-full bg-mpesa font-extrabold text-[12px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Pay with M-Pesa
              </button>
            </div>
          </aside>

          {/* main */}
          <div className="min-w-0">
            {/* ---------- MY PROJECTS ---------- */}
            {tab === "projects" && (
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-[16px] font-extrabold text-body">My Projects</h2>
                  <button
                    onClick={() => setAddOpen((v) => !v)}
                    className="touch-target flex items-center gap-1.5 rounded-full bg-ink px-4 font-extrabold text-[12px] text-white"
                  >
                    {addOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} Add Project
                  </button>
                </div>

                {addOpen && (
                  <div className="mt-3 rounded-2xl border border-kline bg-card p-4">
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Project name — e.g. Syokimau Phase 2"
                        aria-label="Project name"
                        className="rounded-xl border border-kline px-3 py-2.5 text-[12.5px] outline-none focus:border-trust focus:ring-4 focus:ring-trust/10"
                      />
                      <input
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Location — estate • road"
                        aria-label="Project location"
                        className="rounded-xl border border-kline px-3 py-2.5 text-[12.5px] outline-none focus:border-trust focus:ring-4 focus:ring-trust/10"
                      />
                      <input
                        value={form.units}
                        onChange={(e) => setForm({ ...form, units: e.target.value })}
                        placeholder="Units count"
                        inputMode="numeric"
                        aria-label="Units count"
                        className="rounded-xl border border-kline px-3 py-2.5 text-[12.5px] outline-none focus:border-trust focus:ring-4 focus:ring-trust/10"
                      />
                    </div>
                    <button
                      onClick={addProject}
                      className="touch-target mt-3 rounded-full bg-verified px-5 font-extrabold text-[12px] text-white"
                    >
                      Save project
                    </button>
                  </div>
                )}

                <div className="mt-3 space-y-2.5">
                  {(dev?.projects ?? []).map((p) => (
                    <div key={p.name} className="flex flex-wrap items-center gap-3 rounded-2xl border border-kline bg-card p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-trust to-verified text-white">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-extrabold text-body">
                          {p.name} • {p.location} • {p.totalUnits} units
                        </p>
                        <p className="mt-0.5 text-[11px] text-kmuted">{dev?.companyName} • units managed below in Units tab</p>
                      </div>
                      <GoldBadge label="Gold Developer" />
                      <VerifiedBadge label="Proof verified" />
                    </div>
                  ))}
                  {extraProjects.map((p) => (
                    <div key={p.name} className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-kline bg-card p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-kbg text-body">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-extrabold text-body">
                          {p.name} • {p.location} • {p.totalUnits} units
                        </p>
                        <p className="mt-0.5 text-[11px] text-kmuted">Added (demo) • pending title / lease proof upload</p>
                      </div>
                      <PendingBadge label="Proof pending" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ---------- UNITS ---------- */}
            {tab === "units" && (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-[16px] font-extrabold text-body">Units • {projectName}</h2>
                  <span className="flex items-center gap-1.5 rounded-full bg-trust-soft px-3 py-1 text-[10.5px] font-extrabold text-trust md:hidden">
                    <Smartphone className="h-3 w-3" /> Swipe to mark taken on mobile
                  </span>
                </div>

                <div className="mt-3">
                  {/* desktop table */}
                  <div className="hidden overflow-hidden rounded-2xl border border-kline bg-card md:block">
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="bg-kbg text-[10.5px] uppercase tracking-wide text-kmuted">
                        <tr>
                          <th className="px-4 py-3 font-extrabold">Unit</th>
                          <th className="px-4 py-3 font-extrabold">Beds</th>
                          <th className="px-4 py-3 font-extrabold">Price</th>
                          <th className="px-4 py-3 font-extrabold">Status</th>
                          <th className="px-4 py-3 text-right font-extrabold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dev?.units ?? []).map((u) => (
                          <tr key={u.id} className="border-t border-kline">
                            <td className="px-4 py-3">
                              <p className="font-display font-extrabold text-body">{u.code}</p>
                              {expiryChip(u, now)}
                            </td>
                            <td className="px-4 py-3 text-body/80">{u.beds}</td>
                            <td className="px-4 py-3 font-bold text-body">{kes(u.price)}</td>
                            <td className="px-4 py-3">{statusPill(u.status)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setConfirmUnit({ unit: u, next: u.status === "Available" ? "Taken" : "Available" })}
                                className="touch-target rounded-full border border-kline px-4 text-[11.5px] font-extrabold text-body hover:bg-kbg"
                              >
                                Toggle
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* mobile cards */}
                  <div className="space-y-2 md:hidden">
                    {(dev?.units ?? []).map((u) => (
                      <div key={u.id} className="rounded-2xl border border-kline bg-card p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display text-[14px] font-extrabold text-body">
                            {u.code} <span className="text-[11px] font-semibold text-kmuted">• {u.beds}</span>
                          </p>
                          {statusPill(u.status)}
                        </div>
                        <p className="mt-1 text-[12px] font-bold text-body">{kes(u.price)}<span className="font-medium text-kmuted"> /mo</span></p>
                        {expiryChip(u, now) && <div className="mt-1">{expiryChip(u, now)}</div>}
                        <button
                          onClick={() => setConfirmUnit({ unit: u, next: u.status === "Available" ? "Taken" : "Available" })}
                          className="touch-target mt-2 w-full rounded-full border border-kline text-[12px] font-extrabold text-body hover:bg-kbg"
                        >
                          Toggle availability
                        </button>
                      </div>
                    ))}
                  </div>

                  {(dev?.units ?? []).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-kline p-8 text-center">
                      <KeyRound className="mx-auto h-6 w-6 text-kmuted" />
                      <p className="mt-2 text-[12.5px] font-bold text-body">No units yet</p>
                      <p className="text-[11.5px] text-kmuted">Add a project, then units appear here for availability toggling.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ---------- LEADS ---------- */}
            {tab === "leads" && (
              <section>
                <h2 className="font-display text-[16px] font-extrabold text-body">Leads • Who called • Phone masked</h2>
                <div className="mt-3 space-y-2">
                  {(data.leads ?? []).map((l) => (
                    <div key={l.id} className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-kline bg-card px-4 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-trust-soft text-trust">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-extrabold text-body">
                          {l.phoneMasked} <span className="font-semibold text-kmuted">• {timeAgo(hoursSince(l.createdAt))}</span>
                        </p>
                        <p className="truncate text-[11px] text-kmuted">{l.listing?.estate ?? "—"} • {l.listing?.title ?? "lead"}</p>
                      </div>
                      <button
                        onClick={() => toast("success", "Number copied • Lead logged • Haptic vibrate")}
                        className="touch-target rounded-full bg-verified px-4 text-[11.5px] font-extrabold text-white transition-transform active:scale-95"
                      >
                        Call
                      </button>
                    </div>
                  ))}
                  {(data.leads ?? []).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-kline p-8 text-center">
                      <Users className="mx-auto h-6 w-6 text-kmuted" />
                      <p className="mt-2 text-[12.5px] font-bold text-body">No leads yet</p>
                      <p className="text-[11.5px] text-kmuted">Leads appear when buyers tap Call on your listings — phone stays masked.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ---------- PAYMENTS ---------- */}
            {tab === "payments" && (
              <section>
                <h2 className="font-display text-[16px] font-extrabold text-body">Payments</h2>
                <div className="mt-3 rounded-3xl bg-tiktok p-5 text-white sm:p-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55">M-Pesa Wallet • Till 123456</p>
                  <p className="mt-2 font-display text-[28px] font-extrabold">KES 12,400</p>
                  <p className="mt-1 text-[12px] text-white/70">Pending KES 2,100 • Paid KES 48,900</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => toast("success", "Payout requested • KES 12,400 to 07** *** 003")}
                      className="touch-target rounded-full bg-surface px-5 font-extrabold text-[12px] text-body transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Payout Request
                    </button>
                    <button
                      onClick={() => setShowInvoices((v) => !v)}
                      className="touch-target rounded-full border border-white/25 px-5 font-extrabold text-[12px] text-white hover:bg-white/10"
                    >
                      Invoices
                    </button>
                  </div>

                  {showInvoices && (
                    <ul className="mt-4 space-y-1.5">
                      {((data.payments ?? []).length > 0
                        ? data.payments.map((p) => ({
                            receipt: p.receipt ?? "—",
                            date: new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }),
                            plan: p.plan ?? p.kind,
                            amount: p.amount,
                          }))
                        : DEMO_INVOICES
                      ).map((inv) => (
                        <li key={inv.receipt} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.07] px-3.5 py-2.5 font-mono text-[11px]">
                          <span>{inv.receipt} • {inv.date}</span>
                          <span className="font-sans font-bold">{inv.plan} {kes(inv.amount)} <span className="text-verified">✓</span></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {/* ---------- SUBSCRIPTION ---------- */}
            {tab === "subscription" && (
              <section>
                <h2 className="font-display text-[16px] font-extrabold text-body">Subscription plans</h2>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  {/* Free */}
                  <div className="rounded-3xl border border-kline bg-card p-5">
                    <p className="font-display text-[14px] font-extrabold text-body">Free</p>
                    <p className="mt-1 font-display text-[24px] font-extrabold text-body">KES 0</p>
                    <ul className="mt-3 space-y-1.5 text-[12px] text-body/80">
                      <li>• 3 listings</li>
                      <li>• Basic badge</li>
                      <li>• Community support</li>
                    </ul>
                    <button disabled className="touch-target mt-4 w-full cursor-not-allowed rounded-full border border-kline font-extrabold text-[12px] text-kmuted">
                      Current
                    </button>
                  </div>

                  {/* Pro */}
                  <div className="relative rounded-3xl border border-kline bg-card p-5 ring-2 ring-trust">
                    <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-[9.5px] font-extrabold text-body shadow">
                      MOST POPULAR
                    </span>
                    <p className="flex items-center gap-1.5 font-display text-[14px] font-extrabold text-body">
                      Pro <Crown className="h-4 w-4 text-gold" aria-hidden />
                    </p>
                    <p className="mt-1 font-display text-[24px] font-extrabold text-body">
                      KES 999 <span className="text-[12px] font-semibold text-kmuted">/month</span>
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[12px] text-body/80">
                      <li>• 20 listings</li>
                      <li>• Gold badge 👑</li>
                      <li>• Top search placement</li>
                      <li>• Analytics</li>
                      <li>• M-Pesa STK</li>
                    </ul>
                    <button
                      onClick={() => navigate("payments")}
                      className="touch-target mt-4 w-full rounded-full bg-mpesa font-extrabold text-[12px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Pay with M-Pesa
                    </button>
                  </div>

                  {/* Enterprise */}
                  <div className="rounded-3xl border border-kline bg-card p-5">
                    <p className="font-display text-[14px] font-extrabold text-body">Enterprise</p>
                    <p className="mt-1 font-display text-[24px] font-extrabold text-body">
                      KES 4,999 <span className="text-[12px] font-semibold text-kmuted">/month</span>
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[12px] text-body/80">
                      <li>• 100 listings</li>
                      <li>• Developer project</li>
                      <li>• API access</li>
                    </ul>
                    <button
                      onClick={() => toast("info", "Enterprise — our team will reach out on WhatsApp (demo)")}
                      className="touch-target mt-4 w-full rounded-full bg-ink font-extrabold text-[12px] text-white"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* unit toggle confirm dialog */}
      {confirmUnit && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setConfirmUnit(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm availability"
        >
          <div className="slide-up w-full max-w-[360px] rounded-3xl bg-surface p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[15px] font-extrabold text-body">Confirm Availability?</h3>
              <button onClick={() => setConfirmUnit(null)} aria-label="Close" className="touch-target grid place-items-center rounded-full hover:bg-kbg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-kmuted">
              Is this keja still available? Leads notified. Unit <span className="font-extrabold text-body">{confirmUnit.unit.code}</span> will be
              marked <span className="font-extrabold text-body">{confirmUnit.next}</span>.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmUnit(null)} className="touch-target flex-1 rounded-full border border-kline font-bold text-[12.5px] hover:bg-kbg">
                Cancel
              </button>
              <button
                onClick={doToggle}
                disabled={busyUnit}
                className={cn(
                  "touch-target flex-1 rounded-full font-extrabold text-[12.5px] text-white disabled:opacity-50",
                  confirmUnit.next === "Taken" ? "bg-scam" : "bg-verified"
                )}
              >
                {busyUnit ? "Updating..." : `Yes, Mark ${confirmUnit.next}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

