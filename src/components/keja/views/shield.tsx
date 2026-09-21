"use client";
// KEJA HALISI — Scam Shield: check any agent handle / phone number before you trust it.
// Explainable verdict from catalog evidence + per-verdict action checklist + lookup history.
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX, Search, Phone,
  AtSign, CircleCheck, TriangleAlert, Star, ListChecks, History, Trash2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { useT } from "@/lib/i18n";

interface ShieldResult {
  query: string;
  kind: "handle" | "phone";
  verdict: "safe" | "check" | "danger" | "unknown";
  headline: string;
  notes: string[];
  steps: string[];
  signals: { feeListings: number; activeListings: number; reports: number; reviewCount: number; avgStars: number };
  agent?: {
    handle: string; role: string; status: string; rating: number; listingsCount: number;
    responseTime: number; phoneMasked: string; verifiedSince: string | null;
  };
  checkedAt: string;
}

interface LookupEntry { q: string; verdict: ShieldResult["verdict"]; at: number; handle?: string }

const VERDICT_STYLE: Record<ShieldResult["verdict"], {
  ring: string; bg: string; text: string; chip: string; label: string;
}> = {
  safe:    { ring: "border-verified/40", bg: "bg-verified-soft", text: "text-ok-strong", chip: "bg-verified text-white", label: "GREEN — VERIFIED SIGNALS" },
  check:   { ring: "border-gold/50",    bg: "bg-gold/10",       text: "text-warn-strong", chip: "bg-gold text-body", label: "YELLOW — MIXED SIGNALS" },
  danger:  { ring: "border-scam/50",    bg: "bg-scam-soft",     text: "text-scam", chip: "bg-scam text-white", label: "RED — SCAM SIGNALS" },
  unknown: { ring: "border-kline",      bg: "bg-kbg",           text: "text-kmuted", chip: "bg-ink text-white", label: "NOT IN CATALOG" },
};

function VerdictIcon({ verdict, className }: { verdict: ShieldResult["verdict"]; className?: string }) {
  const cls = cn("h-6 w-6", className);
  return verdict === "safe" ? <ShieldCheck className={cls} /> :
    verdict === "check" ? <ShieldAlert className={cls} /> :
    verdict === "danger" ? <ShieldX className={cls} /> :
    <ShieldQuestion className={cls} />;
}

export default function ShieldView() {
  const t = useT();
  const navigate = useKeja((s) => s.navigate);
  const notify = useKeja((s) => s.notify);
  const initialQuery = useKeja((s) => s.params.q);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ShieldResult | null>(null);
  const [history, setHistory] = useState<LookupEntry[]>([]);

  // device-local lookup history — persisted so the weekly digest can count shield checks
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("keja-shield-history") || "[]") as LookupEntry[];
      if (Array.isArray(raw)) setHistory(raw.slice(0, 6));
    } catch {
      /* fresh device */
    }
  }, []);

  const persistHistory = (entries: LookupEntry[]) => {
    try {
      localStorage.setItem("keja-shield-history", JSON.stringify(entries.slice(0, 6)));
    } catch {
      /* private mode */
    }
  };

  // deep link entry (?shield=@handle / QR poster / palette) → auto-run once
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (initialQuery && !autoRanRef.current) {
      autoRanRef.current = true;
      window.setTimeout(() => void run(initialQuery), 0);
    }
  }, [initialQuery]);

  const run = async (raw?: string) => {
    const q = (raw ?? query).trim();
    if (!q || busy) return;
    setQuery(q);
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/trust/check?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("check failed");
      const data: ShieldResult = await res.json();
      setResult(data);
      setHistory((h) => {
        const next = [
          { q, verdict: data.verdict, at: Date.now(), handle: data.agent?.handle },
          ...h.filter((e) => e.q !== q),
        ].slice(0, 6);
        persistHistory(next);
        return next;
      });
      if (data.verdict === "danger") {
        notify("warning", "Scam Shield — red verdict", `${data.agent?.handle ?? q} carries multiple scam signals. Keep your M-Pesa closed.`);
      } else if (data.verdict === "safe") {
        notify("success", "Scam Shield — green verdict", `${data.agent?.handle ?? q} is verified and clean on every tracked signal.`);
      }
    } catch {
      toast("error", "Shield check failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const vs = result ? VERDICT_STYLE[result.verdict] : null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {/* ============ HEADER ============ */}
      <button
        onClick={() => navigate("home")}
        className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-3.5 py-2 text-[12px] font-extrabold text-body transition-colors hover:bg-kbg"
      >
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back
      </button>

      <header className="relative mt-4 overflow-hidden rounded-3xl bg-ink p-5 text-white sm:p-7" aria-label="Scam Shield intro">
        <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-trust/25 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-verified/20 blur-2xl" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-tiktok-cyan ring-1 ring-white/20">
            <ShieldCheck className="h-3.5 w-3.5" /> SCAM SHIELD • FREE FOREVER
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            Check before you trust.
          </h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] font-semibold leading-relaxed text-white/70">
            Paste a TikTok handle or the phone number an "agent" sent you. We score it against the
            verified catalog: ID checks, viewing-fee signals, community reports and tenant reviews.
          </p>
        </div>
      </header>

      {/* ============ SEARCH CARD ============ */}
      <section className="mt-4 rounded-3xl border border-kline bg-surface p-4 shadow-[0_10px_30px_rgba(17,25,40,0.06)] sm:p-5" aria-label="Shield lookup">
        <form
          onSubmit={(e) => { e.preventDefault(); run(); }}
          className="flex flex-col gap-2 sm:flex-row"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-kmuted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 60))}
              placeholder="@keja_kile or 0712 345 001"
              inputMode="text"
              aria-label="Agent TikTok handle or phone number"
              className="h-12 w-full rounded-2xl border border-kline bg-kbg pl-10 pr-3 text-[13.5px] font-bold text-body placeholder:font-semibold placeholder:text-kmuted/70 focus:outline-none focus:ring-2 focus:ring-trust/40"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || busy}
            className="touch-target inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-6 font-display text-[13px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
          >
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ShieldCheck className="h-4 w-4" />}
            {busy ? "Scanning…" : "Run shield check"}
          </button>
        </form>

        {/* try chips — demo shortcuts across verdict bands */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-kmuted">Try:</span>
          {[
            { q: "@keja_kile", hint: "verified pro" },
            { q: "@roy_homes", hint: "one community report" },
            { q: "@pending_agent_ke", hint: "fee demands + reports" },
            { q: "+254712345010", hint: "same agent by number" },
            { q: "@mkuu_wa_keja", hint: "not on Keja" },
          ].map((c) => (
            <button
              key={c.q}
              onClick={() => run(c.q)}
              disabled={busy}
              className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-kbg px-3 py-1.5 text-[10.5px] font-extrabold text-body transition-colors hover:border-trust/40 hover:text-trust disabled:opacity-50"
            >
              {c.q.startsWith("@") ? <AtSign className="h-3 w-3 text-trust" /> : <Phone className="h-3 w-3 text-trust" />}
              {c.q} <span className="font-semibold text-kmuted">• {c.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ============ VERDICT ============ */}
      {busy && (
        <section className="mt-4 rounded-3xl border border-kline bg-surface p-5" aria-live="polite">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded-full shimmer" />
              <div className="h-3 w-2/3 rounded-full shimmer" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded-full shimmer" />
            <div className="h-3 w-5/6 rounded-full shimmer" />
          </div>
        </section>
      )}

      {result && vs && !busy && (
        <section
          className={cn("card-in mt-4 overflow-hidden rounded-3xl border bg-surface shadow-[0_10px_30px_rgba(17,25,40,0.06)]", vs.ring)}
          aria-live="polite"
          aria-label={`Shield verdict for ${result.query}`}
        >
          {/* verdict banner */}
          <div className={cn("relative flex items-center gap-4 p-5", vs.bg)} key={result.checkedAt}>
            <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg", vs.chip)}>
              <VerdictIcon verdict={result.verdict} className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[10px] font-extrabold uppercase tracking-[0.14em]", vs.text)}>{vs.label}</p>
              <h2 className="mt-0.5 font-display text-lg font-extrabold leading-snug text-body sm:text-xl">
                {result.agent ? result.agent.handle : result.query}
                {result.agent && (
                  <span className="ml-2 rounded-full bg-surface px-2 py-0.5 align-middle text-[9.5px] font-extrabold uppercase tracking-wider text-kmuted ring-1 ring-kline">
                    {result.agent.role} • {result.agent.status}
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-[12px] font-semibold text-body/80">{result.headline}</p>
            </div>
          </div>

          {/* agent meta row */}
          {result.agent && (
            <div className="flex flex-wrap items-center gap-2 border-t border-kline px-5 py-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-kbg px-2.5 py-1 text-[10px] font-extrabold text-body">
                <Star className="h-3 w-3 fill-gold text-gold" /> {result.agent.rating}★
              </span>
              <span className="rounded-full bg-kbg px-2.5 py-1 text-[10px] font-extrabold text-body">
                {result.agent.listingsCount} listings
              </span>
              <span className="rounded-full bg-kbg px-2.5 py-1 text-[10px] font-extrabold text-body">
                ~{result.agent.responseTime}min response
              </span>
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-extrabold text-white" title="Vault-masked phone">
                <Phone className="mr-1 inline h-2.5 w-2.5" />
                {result.agent.phoneMasked}
              </span>
              <button
                onClick={() => navigate("agent", { handle: result.agent!.handle })}
                className="touch-target ml-auto inline-flex items-center gap-1 rounded-full bg-trust-soft px-3 py-1.5 text-[10px] font-extrabold text-trust transition-colors hover:bg-trust hover:text-white"
              >
                Open profile <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="grid gap-4 p-5 pt-4 lg:grid-cols-[1.15fr_0.85fr]">
            {/* evidence */}
            <div>
              <h3 className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
                <ListChecks className="h-3.5 w-3.5" /> Evidence ({result.notes.length})
              </h3>
              <ul className="mt-2 space-y-1.5">
                {result.notes.map((n, i) => {
                  const negative = /red flag|REJECTED|reports|pending|average|mixed|signal/i.test(n);
                  return (
                    <li key={i} className="flex items-start gap-2 rounded-xl bg-kbg px-3 py-2">
                      {negative
                        ? <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn-strong" />
                        : <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verified" />}
                      <span className="text-[12px] font-semibold leading-relaxed text-body">{n}</span>
                    </li>
                  );
                })}
                {result.notes.length === 0 && (
                  <li className="rounded-xl bg-kbg px-3 py-2 text-[12px] font-semibold text-kmuted">
                    No catalog evidence either way.
                  </li>
                )}
              </ul>

              {/* signals mini-grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Fee listings", v: result.signals.feeListings, warn: result.signals.feeListings > 0 },
                  { label: "Live listings", v: result.signals.activeListings, warn: false },
                  { label: "Reports", v: result.signals.reports, warn: result.signals.reports > 0 },
                  { label: "Avg stars", v: result.signals.reviewCount ? `${result.signals.avgStars}★` : "—", warn: result.signals.reviewCount >= 2 && result.signals.avgStars < 4 },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded-2xl px-3 py-2.5 text-center", s.warn ? "bg-scam-soft" : "bg-verified-soft")}>
                    <p className={cn("font-display text-lg font-extrabold tabular-nums", s.warn ? "text-scam" : "text-ok-strong")}>{s.v}</p>
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-kmuted">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* next steps */}
            <div className="rounded-2xl border border-trust/25 bg-trust-soft p-4">
              <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-trust">
                Do this next
              </h3>
              <ol className="mt-2 space-y-2">
                {result.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-trust font-display text-[10px] font-extrabold text-white">{i + 1}</span>
                    <span className="text-[12px] font-semibold leading-relaxed text-body">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-[10.5px] font-bold leading-relaxed text-kmuted">
                Hakuna kulipa kabla ya kuona nyumba. A shield verdict is catalog evidence —
                not a guarantee. Your final check is the viewing itself.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ============ LOOKUP HISTORY (device-local) ============ */}
      {history.length > 0 && (
        <section className="mt-4 rounded-3xl border border-kline bg-surface p-4" aria-label="Your recent shield lookups">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
              <History className="h-3.5 w-3.5" /> Recent checks — private to this device
            </h3>
            <button
              onClick={() => {
                setHistory([]);
                try {
                  localStorage.removeItem("keja-shield-history");
                } catch {
                  /* ignore */
                }
              }}
              className="touch-target inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-kmuted transition-colors hover:bg-kbg hover:text-scam"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {history.map((e) => (
              <li key={e.q}>
                <button
                  onClick={() => run(e.q)}
                  className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-kbg px-3 py-1.5 text-[10.5px] font-extrabold text-body transition-colors hover:bg-surface"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      e.verdict === "safe" ? "bg-verified" : e.verdict === "check" ? "bg-gold" : e.verdict === "danger" ? "bg-scam" : "bg-kmuted"
                    )}
                    aria-hidden
                  />
                  {e.q}
                  <span className="font-semibold text-kmuted">{e.handle ? "• profile" : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============ CROSS-LINKS ============ */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="More trust tools">
        <button
          onClick={() => navigate("quiz")}
          className="touch-target group flex items-center gap-3 rounded-3xl bg-tiktok p-4 text-left text-white transition-transform hover:scale-[1.01]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <ShieldCheck className="h-5 w-5 text-tiktok-cyan" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14px] font-extrabold">{t("quizRadarTitle")} — 60s</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-white/70">{t("quizRadarSub")}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => navigate("verify")}
          className="touch-target group flex items-center gap-3 rounded-3xl border border-verified/30 bg-verified-soft p-4 text-left transition-transform hover:scale-[1.01]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-verified text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14px] font-extrabold text-body">{t("navVerify")}</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-kmuted">OTP + ID + evidence — join the green catalog</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-verified transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>
    </div>
  );
}
