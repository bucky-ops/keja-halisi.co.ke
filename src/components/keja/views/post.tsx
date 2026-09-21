"use client";
// KEJA HALISI — PostView: 4-step posting wizard with enforcement
// 1 TikTok link + AI parse → 2 Estate/Rent/Road → 3 Evidence + ownership → 4 Review + publish rules
import { useRef, useState } from "react";
import {
  Link2,
  Play,
  Loader2,
  Check,
  Clock,
  Flag,
  TriangleAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ClipboardList,
  MapPin,
  Store,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import {
  BOROUGHS,
  BOROUGH_INFO,
  BEDS_OPTIONS,
  AMENITY_OPTIONS,
  EVIDENCE_ITEMS,
  kes,
} from "@/lib/nairobi";
import { parseCaption, submitListing } from "../api";
import { EvidenceChecklist, Confetti } from "../evidence";
import type { Role } from "@/lib/nairobi";

type ParseState = "empty" | "invalid" | "loading" | "valid";

const OWNERSHIP_OPTIONS = ["Agency mandate", "Owner ID + utility bill", "Title deed or lease"] as const;

const PUBLISH_RULES = [
  "No viewing fee before viewing — Hakuna Kulipa Kabla Ya Kuona Nyumba",
  "Public UI shows estate + road, not exact house number",
  "Unverified listings stay out of the green catalog",
  "Listings re-check availability before expiry — 7-day window",
  "3 reports = auto-hide + admin review",
];

const STEP_LABELS = ["TikTok link", "Location & rent", "Evidence", "Review"];

const inputCls =
  "touch-target w-full rounded-xl border border-kline bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-body outline-none placeholder:font-medium placeholder:text-kmuted/60 focus:border-trust focus:ring-4 focus:ring-trust/10";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-kmuted">{label}</span>
        {hint && <span className="text-[10px] font-bold text-pending">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export default function PostView() {
  const { session, navigate, notify } = useKeja();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // step 1
  const [url, setUrl] = useState("");
  const [parseState, setParseState] = useState<ParseState>("empty");
  const [shake, setShake] = useState(false);
  const [parsed, setParsed] = useState({ price: 0, beds: "Bedsitter", estate: "", road: "" });
  const parseSeq = useRef(0);

  // step 2
  const [borough, setBorough] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [estate, setEstate] = useState("");
  const [rent, setRent] = useState(0);
  const [road, setRoad] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [fee, setFee] = useState(false);

  // step 3
  const [role, setRole] = useState<Role>("Agent");
  const [ownership, setOwnership] = useState<string>(OWNERSHIP_OPTIONS[0]);
  const [evidence, setEvidence] = useState<boolean[]>(EVIDENCE_ITEMS.map(() => false));

  // step 4
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; publishState: string; flagLabels: string[] } | null>(null);
  const [party, setParty] = useState(false);

  const evidenceCount = evidence.filter(Boolean).length;

  const bumpShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  /* ---------- step 1: validate + AI parse ---------- */
  const onUrlChange = (v: string) => {
    setUrl(v);
    if (result) setResult(null);
    const trimmed = v.trim();
    if (!trimmed) {
      setParseState("empty");
      return;
    }
    if (!trimmed.includes("tiktok.com") || !trimmed.includes("/video/")) {
      setParseState("invalid");
      bumpShake();
      return;
    }
    void runParse(trimmed);
  };

  const runParse = async (link: string) => {
    const seq = ++parseSeq.current;
    setParseState("loading");
    try {
      const [res] = await Promise.all([
        parseCaption(link),
        new Promise((r) => setTimeout(r, 700)), // shimmer minimum
      ]);
      if (seq !== parseSeq.current) return;
      if (!res.valid) throw new Error("invalid");
      setParsed({ price: res.price, beds: res.beds, estate: res.estate, road: res.road });
      setParseState("valid");
      toast("success", "Link verified ✓ • AI extracted price, beds, location");
    } catch {
      if (seq !== parseSeq.current) return;
      setParseState("invalid");
      toast("error", "AI could not read this TikTok caption — try another link");
    }
  };

  const tiktokHandleFromUrl = () => {
    const m = url.match(/@([\w.]+)/);
    return m ? `@${m[1]}` : "@keja_poster";
  };

  /* ---------- step transitions ---------- */
  const goStep2 = () => {
    if (parseState !== "valid") return;
    setRent((r) => r || parsed.price || 0);
    setEstate((e) => e || parsed.estate);
    setRoad((r) => r || parsed.road);
    setStep(2);
  };

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const estateSuggestions = () => {
    const info = BOROUGH_INFO.find((b) => b.name === borough);
    return info ? info.estates.split("•").map((s) => s.trim()) : [];
  };

  const posterHandle = session.verified && session.phone
    ? `@keja_${session.phone.replace(/\D/g, "").slice(-4)}`
    : "@demo_poster";

  const handleSubmitListing = async () => {
    if (evidenceCount < 5) {
      toast("error", "All 5 evidence clips required before publish");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitListing({
        tiktokUrl: url.trim(),
        title: `${parsed.beds} • ${estate} • ${road || estate}`,
        estate,
        subCounty,
        borough,
        road,
        price: rent,
        deposit: rent,
        beds: parsed.beds,
        amenities,
        fee,
        ownership,
        role,
        evidence: [...EVIDENCE_ITEMS],
        posterHandle,
      });
      setResult({
        id: res.id,
        publishState: res.publishState,
        flagLabels: res.aiFlags?.map((f) => f.label) ?? [],
      });
      setParty(true);
      setTimeout(() => setParty(false), 3200);
      toast("success", "Listing submitted • verification review started • not publicly live yet");
      notify(
        "info",
        "Listing submitted for review",
        `${estate} • ${parsed.beds} • KES ${rent.toLocaleString("en-KE")} — AI moderation + evidence check in progress.`
      );
    } catch {
      toast("error", "Submit failed — check the form and retry");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setUrl("");
    setParseState("empty");
    setParsed({ price: 0, beds: "Bedsitter", estate: "", road: "" });
    setBorough("");
    setSubCounty("");
    setEstate("");
    setRent(0);
    setRoad("");
    setAmenities([]);
    setFee(false);
    setOwnership(OWNERSHIP_OPTIONS[0]);
    setEvidence(EVIDENCE_ITEMS.map(() => false));
    setResult(null);
    toast("info", "Fresh listing wizard ready");
  };

  /* ---------- stepper header ---------- */
  const renderStepper = () => {
    const pct = (step / 4) * 100;
    return (
      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-kline" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
          <div className="h-full rounded-full bg-trust transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-3 flex flex-wrap gap-2">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <li key={label}>
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-extrabold",
                    done && "border-verified/30 bg-verified-soft text-ok",
                    active && "border-ink bg-ink text-white",
                    !done && !active && "border-kline bg-surface text-kmuted"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full text-[9.5px]",
                      done ? "bg-verified text-white" : active ? "bg-white/20" : "bg-kbg"
                    )}
                  >
                    {done ? <Check className="h-2.5 w-2.5" /> : n}
                  </span>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {party && <Confetti />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold text-body sm:text-2xl">Post a Keja</h2>
        {!session.verified && (
          <p className="inline-flex items-center gap-2 rounded-full border border-pending/30 bg-pending-soft px-3.5 py-2 text-[11px] font-extrabold text-warn-strong" role="note">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            Posting as demo poster (unverified) — out of green catalog until verified
            <button
              type="button"
              onClick={() => navigate("verify")}
              className="touch-target rounded-full bg-ink px-2.5 py-1 text-[10px] font-extrabold text-white"
            >
              Verify now
            </button>
          </p>
        )}
      </div>

      {renderStepper()}

      {/* ============ STEP 1 — TIKTOK LINK + AI PARSE ============ */}
      {step === 1 && (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]" aria-label="TikTok link">
          <div className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
              <Link2 className="h-4 w-4 text-trust" />
              TikTok video link
            </p>
            <div className={cn("mt-4", shake && "shake")}>
              <input
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://www.tiktok.com/@keja/video/..."
                inputMode="url"
                aria-label="TikTok video link"
                aria-invalid={parseState === "invalid"}
                className={cn(
                  inputCls,
                  parseState === "invalid" && "border-scam focus:border-scam focus:ring-scam/10"
                )}
              />
              {parseState === "invalid" && (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-[11.5px] font-extrabold text-danger-strong">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Invalid TikTok link — must be tiktok.com/@handle/video/...
                </p>
              )}
            </div>

            {/* parse result */}
            {parseState === "loading" && (
              <div className="mt-4 space-y-2.5 rounded-2xl border border-kline bg-kbg/60 p-4" aria-busy>
                <p className="flex items-center gap-2 text-[12px] font-extrabold text-trust">
                  <Sparkles className="h-4 w-4" /> AI reading caption…
                </p>
                <div className="h-9 w-full rounded-xl shimmer" />
                <div className="h-9 w-2/3 rounded-xl shimmer" />
              </div>
            )}

            {parseState === "valid" && (
              <div className="mt-4 rounded-2xl border border-verified/25 bg-verified-soft p-4" role="status">
                <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-ok">
                  <Check className="h-4 w-4" /> Link verified ✓ • AI extracted:
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Price KES">
                    <input
                      type="number"
                      min={3000}
                      value={parsed.price || ""}
                      onChange={(e) => setParsed((p) => ({ ...p, price: Number(e.target.value) }))}
                      aria-label="Price in KES"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Beds">
                    <select
                      value={parsed.beds}
                      onChange={(e) => setParsed((p) => ({ ...p, beds: e.target.value }))}
                      aria-label="Beds"
                      className={inputCls}
                    >
                      {BEDS_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Estate">
                    <input
                      value={parsed.estate}
                      onChange={(e) => setParsed((p) => ({ ...p, estate: e.target.value }))}
                      aria-label="Estate"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Road">
                    <input
                      value={parsed.road}
                      onChange={(e) => setParsed((p) => ({ ...p, road: e.target.value }))}
                      aria-label="Road"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <p className="mt-3 text-[10.5px] font-semibold text-ok-strong">
                  Gemini Vision mock — extract Price Beds Location hashtag
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={goStep2}
                disabled={parseState !== "valid"}
                className={cn(
                  "touch-target inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-extrabold transition-all",
                  parseState === "valid"
                    ? "bg-ink text-white hover:shadow-md active:scale-[0.98]"
                    : "cursor-not-allowed bg-kbg text-kmuted disabled:opacity-40"
                )}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* embed preview */}
          <aside className="rounded-3xl border border-kline bg-card p-5">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Embed preview</p>
            <div className="relative mt-3 grid h-56 place-items-center overflow-hidden rounded-2xl bg-ink">
              {parseState === "valid" || parseState === "loading" ? (
                <>
                  <span className="absolute left-0 top-0 h-full w-1 bg-tiktok-pink" aria-hidden />
                  <span className="absolute right-0 top-0 h-full w-1 bg-tiktok-cyan" aria-hidden />
                  {parseState === "loading" ? (
                    <div className="h-12 w-12 rounded-full shimmer" aria-label="Loading preview" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm">
                      <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                    </span>
                  )}
                  <p className="absolute bottom-3 left-3 right-3 text-[11px] font-bold text-white/80">
                    {parseState === "loading" ? "Fetching embed…" : "Video preview playing muted"}
                  </p>
                  <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[9.5px] font-extrabold text-white/90">
                    {tiktokHandleFromUrl()}
                  </span>
                </>
              ) : (
                <div className="px-6 text-center">
                  <Play className="mx-auto h-8 w-8 text-white/30" />
                  <p className="mt-2 text-[11.5px] font-bold text-white/50">Paste link to preview</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-[10.5px] font-semibold leading-relaxed text-kmuted">
              Vertical TikTok embed • caption drives AI extraction • evidence video doubles as proof of viewing.
            </p>
          </aside>
        </section>
      )}

      {/* ============ STEP 2 — ESTATE / RENT / ROAD ============ */}
      {step === 2 && (
        <section className="mt-6 max-w-3xl" aria-label="Location and rent">
          <div className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
              <MapPin className="h-4 w-4 text-trust" />
              Estate, rent & road
            </p>

            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <Field label="Borough">
                <select
                  value={borough}
                  onChange={(e) => {
                    setBorough(e.target.value);
                    setSubCounty("");
                  }}
                  aria-label="Borough"
                  className={inputCls}
                >
                  <option value="">Select borough…</option>
                  {Object.keys(BOROUGHS).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>

              <Field label="Sub-county">
                <select
                  value={subCounty}
                  onChange={(e) => setSubCounty(e.target.value)}
                  disabled={!borough}
                  aria-label="Sub-county"
                  className={cn(inputCls, !borough && "cursor-not-allowed opacity-50")}
                >
                  <option value="">Select sub-county…</option>
                  {(BOROUGHS[borough] ?? []).map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </Field>

              <Field label="Estate">
                <input
                  value={estate}
                  onChange={(e) => setEstate(e.target.value)}
                  list="estate-suggestions"
                  placeholder="e.g. Umoja"
                  aria-label="Estate"
                  className={inputCls}
                />
                <datalist id="estate-suggestions">
                  {estateSuggestions().map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>

              <Field label="Rent KES" hint="min 3,000">
                <input
                  type="number"
                  min={3000}
                  value={rent || ""}
                  onChange={(e) => setRent(Math.max(0, Number(e.target.value)))}
                  aria-label="Rent in KES"
                  className={inputCls}
                />
              </Field>

              <Field label="Deposit KES" hint="auto = 1 month rent">
                <input
                  value={rent ? kes(rent) : ""}
                  readOnly
                  aria-label="Deposit auto-calculated"
                  className={cn(inputCls, "cursor-default bg-kbg/60 text-kmuted")}
                />
              </Field>

              <Field label="Road: exact number hidden">
                <input
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  placeholder="e.g. Mumias South Road"
                  aria-label="Road"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* amenities */}
            <fieldset className="mt-4">
              <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-kmuted">
                Amenities
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITY_OPTIONS.map((a) => {
                  const on = amenities.includes(a);
                  return (
                    <label
                      key={a}
                      className={cn(
                        "touch-target flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-colors",
                        on ? "border-trust/40 bg-trust-soft text-trust" : "border-kline bg-surface text-body hover:border-trust/30"
                      )}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggleAmenity(a)} className="accent-[#1976d2]" />
                      {on && <Check className="h-3 w-3" />}
                      {a}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* fee signal */}
            <label
              className={cn(
                "touch-target mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl border p-4",
                fee ? "border-scam/40 bg-scam-soft" : "border-kline bg-kbg/50"
              )}
            >
              <input type="checkbox" checked={fee} onChange={(e) => setFee(e.target.checked)} className="mt-0.5 accent-[#e02424]" />
              <span className="text-[12px] font-bold text-body">
                Listing has viewing-fee signal (captions like &ldquo;registration fee&rdquo;)
              </span>
            </label>
            {fee && (
              <div className="mt-2.5 rounded-xl border border-scam/30 bg-scam-soft px-3.5 py-3" role="alert">
                <p className="flex items-center gap-2 text-[12px] font-extrabold text-danger-strong">
                  <Flag className="h-4 w-4 shrink-0" />
                  Viewing-fee signal will trigger red warning + No-Fee filter hides this listing
                </p>
              </div>
            )}

            {/* dark privacy notice */}
            <div className="mt-4 rounded-2xl bg-ink px-4 py-3.5 text-white" role="note">
              <p className="flex items-start gap-2 text-[12px] font-bold leading-relaxed">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-tiktok-cyan" />
                Public UI shows estate + road, not exact house number • Private vault stores door number • Phone masked
                until contact.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12px] font-bold text-body hover:bg-kbg"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Link
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!borough || !subCounty || !estate.trim() || rent < 3000}
                className={cn(
                  "touch-target inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-extrabold transition-all",
                  borough && subCounty && estate.trim() && rent >= 3000
                    ? "bg-ink text-white hover:shadow-md active:scale-[0.98]"
                    : "cursor-not-allowed bg-kbg text-kmuted disabled:opacity-40"
                )}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ STEP 3 — EVIDENCE + OWNERSHIP ============ */}
      {step === 3 && (
        <section className="mt-6 max-w-2xl" aria-label="Evidence and ownership">
          <div className="space-y-4">
            {/* posting role (drives caretaker mandate enforcement) */}
            <fieldset>
              <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-kmuted">
                Posting as role
              </legend>
              <div className="flex flex-wrap gap-2">
                {("Agent Owner Developer Caretaker" as const).split(" ").map((r) => {
                  const on = role === r;
                  return (
                    <label
                      key={r}
                      className={cn(
                        "touch-target flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition-colors",
                        on ? "border-ink bg-ink text-white" : "border-kline bg-surface text-body hover:border-trust/40"
                      )}
                    >
                      <input type="radio" name="post-role" checked={on} onChange={() => setRole(r as Role)} className="sr-only" />
                      {on && <Check className="h-3 w-3" />}
                      {r}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <Field label="Ownership / authority">
              <select value={ownership} onChange={(e) => setOwnership(e.target.value)} aria-label="Ownership or authority" className={inputCls}>
                {OWNERSHIP_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>

            <EvidenceChecklist checked={evidence} onChange={setEvidence} />

            {evidenceCount < 5 && (
              <p role="alert" className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-danger-strong">
                <TriangleAlert className="h-3.5 w-3.5" />
                All 5 evidence clips required before publish — {evidenceCount}/5 captured
              </p>
            )}

            {/* verification summary */}
            <div className="rounded-2xl border border-verified/25 bg-verified-soft p-4" role="status">
              <p className="text-[12px] font-extrabold text-ok">Verification summary</p>
              <ul className="mt-2 space-y-1.5 text-[11.5px] font-bold text-ok-strong">
                <li className="flex items-center gap-2">
                  {session.verified ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-verified" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 shrink-0 text-pending" />
                  )}
                  Phone OTP {session.verified ? "✓ (from session)" : "— not verified yet (demo note)"}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-verified" /> ID selfie uploaded ✓
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-verified" /> Referrals ✓
                </li>
              </ul>
            </div>

            {/* caretaker mandate */}
            {role === "Caretaker" && (
              <div className="rounded-2xl border border-pending/30 bg-pending-soft p-4" role="note">
                <p className="flex items-center gap-2 text-[12px] font-extrabold text-warn-strong">
                  <Store className="h-4 w-4 shrink-0" />
                  Caretaker mandate active
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-warn-strong/90">
                  You can only post for estates in your owner mandate • Mandate letter checked against the permissions
                  table • Posting outside mandate auto-rejects the listing.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12px] font-bold text-body hover:bg-kbg"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Location
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[13px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md"
              >
                Review <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ STEP 4 — REVIEW + PUBLISH RULES ============ */}
      {step === 4 && (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]" aria-label="Review and publish">
          <div className="space-y-4">
            {/* publishing rules */}
            <div className="rounded-2xl bg-kbg p-4" role="note" aria-label="Publishing rules">
              <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-body">
                <ShieldCheck className="h-4 w-4 text-verified" />
                Publishing rules panel
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[11.5px] font-semibold leading-relaxed text-body/75">
                {PUBLISH_RULES.map((rule) => (
                  <li key={rule}>• {rule}</li>
                ))}
              </ul>
            </div>

            {/* review summary */}
            <div className="rounded-3xl border border-kline bg-card p-5">
              <p className="font-display text-[13.5px] font-extrabold text-body">Review summary</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px]">
                {[
                  ["Role", role],
                  ["Borough", borough],
                  ["Sub-county", subCounty],
                  ["Estate", estate],
                  ["Road", `${road || "—"} (number hidden)`],
                  ["Rent", rent ? kes(rent) : "—"],
                  ["Beds", parsed.beds],
                  ["Evidence", `${evidenceCount}/5`],
                  ["Fee signal", fee ? "yes" : "no"],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-[10px] font-extrabold uppercase tracking-wide text-kmuted">{k}</dt>
                    <dd className="truncate font-bold text-body">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            {result ? (
              <div className="rounded-3xl border border-verified/25 bg-verified-soft p-5" role="status">
                <p className="flex items-center gap-2 text-[13px] font-extrabold text-ok">
                  <Check className="h-4.5 w-4.5" />
                  Listing submitted • Pending verification ({result.publishState}) • Evidence checklist OK
                </p>
                <p className="mt-2 text-[11.5px] font-semibold leading-relaxed text-ok-strong">
                  AI flags: {result.flagLabels.length > 0 ? result.flagLabels.join(" • ") : "none"}
                </p>
                <p className="mt-1 text-[10.5px] font-semibold text-kmuted">Reference: {result.id}</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate("admin")}
                    className="touch-target inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md"
                  >
                    <ClipboardList className="h-4 w-4" /> View admin queue
                  </button>
                  <button
                    type="button"
                    onClick={resetWizard}
                    className="touch-target inline-flex items-center gap-2 rounded-full border border-kline bg-surface px-5 py-2.5 text-[12px] font-extrabold text-body hover:bg-kbg"
                  >
                    <RotateCcw className="h-4 w-4" /> Post another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-kline bg-card p-5">
                  <p className="font-display text-[13.5px] font-extrabold text-body">Ready to submit</p>
                  <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-kmuted">
                    Poster: <span className="font-bold text-body">{posterHandle}</span> • goes to pending_review queue —
                    not publicly live until an admin approves.
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmitListing}
                    disabled={evidenceCount < 5 || submitting}
                    className={cn(
                      "touch-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-verified px-6 py-3.5 text-[13px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md",
                      (evidenceCount < 5 || submitting) && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Submit • Publish rules enforced
                  </button>
                  {evidenceCount < 5 && (
                    <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-[11px] font-extrabold text-danger-strong">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      All 5 evidence clips required before publish
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="touch-target mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-trust hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to evidence
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
