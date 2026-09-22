"use client";
// KEJA HALISI — PostView: LIVE DATA INPUT — LINK-ONLY 4-STEP WIZARD
//
// STEP 1  Role selector: Agent | Owner | Developer | Caretaker (+ role doc LINKS)
// STEP 2  TikTok link + auto-parse: oEmbed resolve → thumbnail preview (NO iframe),
//         caption regex parse (price/beds/estate/amenities/fee), bait+repost+fee checks
// STEP 3  Estate + details: estates.json cascading dropdowns, bait-price guard, beds
//         chips, amenities, road cue, lat/lng map-click picker, 3 external photo LINKS,
//         ephemeral distance-to-road + live weather (never stored)
// STEP 4  Evidence checklist (5 mandatory) + publishing rules + trust preview → publish
//
// THE LINK-ONLY LAW: the database only ever receives LINKS (tiktokUrl, thumbnailLink,
// embedHtmlLink, authorLink, photoLinks[], mandateLink) + derived tags. Video/photo
// bytes are NEVER uploaded or stored.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link2,
  Play,
  Loader2,
  Check,
  TriangleAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  MapPin,
  Store,
  Home as HomeIcon,
  Building2,
  KeyRound,
  ShieldCheck,
  CloudSun,
  Footprints,
  ExternalLink,
  ImageIcon,
  FileText,
  Eye,
  EyeOff,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, useKeja } from "@/lib/store";
import { BEDS_OPTIONS, kes } from "@/lib/nairobi";
import {
  createListing,
  fetchEstates,
  fetchListings,
  fetchWeather,
  resolveTikTok,
  type EstatesData,
  type ResolveResponse,
} from "../api";
import { EvidenceChecklist, Confetti } from "../evidence";
import type { ListingDTO, Role } from "@/lib/types";

const EVIDENCE = ["Outside", "Gate", "Inside", "Water running", "Window view"] as const;

const PUBLISH_RULES = [
  "No viewing fee before viewing — ask and you're banned",
  "Public UI shows estate + road only — exact house number stays in the vault",
  "Unverified posters stay out of the green catalog",
  "Availability re-checked before expiry — SMS YES/NO nudge at day 6",
  "3 reports = auto-hide + admin review",
];

const STEP_LABELS = ["Role", "TikTok link", "Estate & details", "Evidence & publish"];

const ROLES: { id: Role; icon: typeof Store; blurb: string; doc?: string; docHint?: string; docKey?: "mandateLink" | "kplcBillLink" | "titleDocLink" }[] = [
  { id: "Agent", icon: Store, blurb: "Listing agent with a TikTok catalog" },
  { id: "Owner", icon: HomeIcon, blurb: "Direct owner — no middleman", doc: "KPLC bill link", docHint: "bill matching your name", docKey: "kplcBillLink" },
  { id: "Developer", icon: Building2, blurb: "Company projects & new units", doc: "Title / Lease doc link", docHint: "proof of ownership", docKey: "titleDocLink" },
  { id: "Caretaker", icon: KeyRound, blurb: "Manages units for the owner", doc: "Mandate letter link", docHint: "signed URL • vault • expires 24h", docKey: "mandateLink" },
];

const inputCls =
  "touch-target w-full rounded-xl border border-kline bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-body outline-none placeholder:font-medium placeholder:text-kmuted/60 focus:border-trust focus:ring-4 focus:ring-trust/10";

/* ---------------- geo helpers (ephemeral — derived, never stored) ---------------- */

const NB_BOX = { minLat: -1.45, maxLat: -1.13, minLng: 36.6, maxLng: 37.04 };

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function walkText(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10}m`;
  return `${(m / 1000).toFixed(1)}km`;
}
function walkMinutes(m: number): number {
  return Math.max(1, Math.round(m / 80)); // ~80 m/min walking
}

type ParseState = "empty" | "invalid" | "loading" | "valid";

interface FeedItem {
  id: string;
  estate: string;
  price: number;
  beds: string;
  thumbnailLink: string | null;
  sourceState: string;
  publishState: string;
  posterHandle: string;
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
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
  const { navigate } = useKeja();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  /* ---------- STEP 1 — role ---------- */
  const [role, setRole] = useState<Role | "">("");
  const [docLink, setDocLink] = useState("");

  /* ---------- STEP 2 — tiktok link + auto-parse ---------- */
  const [url, setUrl] = useState("");
  const [parseState, setParseState] = useState<ParseState>("empty");
  const [shake, setShake] = useState(false);
  const [resolved, setResolved] = useState<ResolveResponse | null>(null);
  const [parsed, setParsed] = useState({ price: 0, beds: "1BR", estate: "", amenities: [] as string[], fee: false });
  const parseSeq = useRef(0);

  /* ---------- STEP 3 — estate + details ---------- */
  const [catalog, setCatalog] = useState<EstatesData | null>(null);
  const [borough, setBorough] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [estate, setEstate] = useState("");
  const [rent, setRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [beds, setBeds] = useState("1BR");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [road, setRoad] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [photoLinks, setPhotoLinks] = useState(["", "", ""]);
  const [weather, setWeather] = useState<{ tempC: number; note: string } | null>(null);

  /* ---------- STEP 4 — evidence + submit ---------- */
  const [evidence, setEvidence] = useState<boolean[]>(EVIDENCE.map(() => false));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; videoId: string; publishState: string; status: string; flags: string[] } | null>(null);
  const [party, setParty] = useState(false);

  /* ---------- live data feed ---------- */
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [mine, setMine] = useState<FeedItem[]>([]);

  const evidenceCount = evidence.filter(Boolean).length;
  const activeEstate = useMemo(
    () => catalog?.estates.find((e) => e.name === estate) ?? null,
    [catalog, estate],
  );

  const bumpShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 420);
  };

  /* ---------- load estates.json catalog + live feed once ---------- */
  useEffect(() => {
    fetchEstates()
      .then(setCatalog)
      .catch(() => toast("error", "Estates catalog failed to load"));
    fetchListings({ limit: 10 })
      .then((rows: ListingDTO[]) =>
        setFeed(
          rows.slice(0, 10).map((l) => ({
            id: l.id,
            estate: l.estate,
            price: l.price,
            beds: l.beds,
            thumbnailLink: l.thumbnailLink,
            sourceState: l.sourceState,
            publishState: l.publishState,
            posterHandle: l.poster.tiktokHandle,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  /* ---------- ephemeral weather (derived, never stored) ---------- */
  useEffect(() => {
    if (!lat || !lng) return setWeather(null);
    const t = setTimeout(() => {
      fetchWeather(lat, lng).then((w) => setWeather(w));
    }, 500);
    return () => clearTimeout(t);
  }, [lat, lng]);

  /* ---------- STEP 2: paste → resolve (LINKS ONLY) ---------- */
  const runResolve = async (link: string) => {
    const seq = ++parseSeq.current;
    setParseState("loading");
    try {
      const [res] = await Promise.all([
        resolveTikTok(link),
        new Promise((r) => setTimeout(r, 600)), // shimmer minimum
      ]);
      if (seq !== parseSeq.current) return;
      setResolved(res);
      setParsed({
        price: res.parsed.price || 0,
        beds: res.parsed.beds || "1BR",
        estate: res.parsed.estate || "",
        amenities: res.parsed.amenities ?? [],
        fee: res.parsed.fee ?? false,
      });
      setParseState("valid");
      toast(
        "success",
        res.ok
          ? `Link resolved ✓ ${res.source === "tikwm" ? "(metadata mirror)" : "(oEmbed)"} — thumbnail + caption tags extracted`
          : "Link saved — source unreachable, keep context tags below",
      );
    } catch (err) {
      if (seq !== parseSeq.current) return;
      setParseState("invalid");
      const msg = (err as Error).message || "";
      toast("error", msg.includes("Invalid") ? "Invalid TikTok link — must be tiktok.com/@handle/video/…" : "Could not resolve this link");
    }
  };

  const onUrlChange = (v: string) => {
    setUrl(v);
    if (result) setResult(null);
    const trimmed = v.trim();
    if (!trimmed) {
      setParseState("empty");
      setResolved(null);
      return;
    }
    if (!/^https?:\/\/(www\.|m\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+/i.test(trimmed)) {
      setParseState("invalid");
      setResolved(null);
      bumpShake();
      return;
    }
    void runResolve(trimmed);
  };

  /* ---------- step transitions ---------- */
  const goStep2 = () => {
    if (!role) return;
    setStep(2);
  };
  const goStep3 = () => {
    if (parseState !== "valid") return;
    // seed step 3 from parse
    setRent((r) => r || parsed.price || 0);
    setDeposit((d) => d || (parsed.price ? parsed.price : 0));
    setBeds(parsed.beds || "1BR");
    if (parsed.estate && catalog?.estates.some((e) => e.name === parsed.estate)) {
      const e = catalog.estates.find((x) => x.name === parsed.estate)!;
      setEstate(e.name);
      setBorough(e.borough);
      setSubCounty(e.subCounty);
      setLat(e.lat);
      setLng(e.lng);
    }
    if (parsed.amenities.length) setAmenities((a) => Array.from(new Set([...a, ...parsed.amenities])));
    setStep(3);
  };

  /* ---------- catalog cascades ---------- */
  const boroughNames = catalog?.boroughs.map((b) => b.name) ?? [];
  const subCountiesForBorough = useMemo(
    () => catalog?.subCounties.filter((s) => s.borough === borough).map((s) => s.name) ?? [],
    [catalog, borough],
  );
  const estatesForSub = useMemo(
    () => catalog?.estates.filter((e) => e.subCounty === subCounty) ?? [],
    [catalog, subCounty],
  );

  const onEstatePick = (name: string) => {
    setEstate(name);
    const e = catalog?.estates.find((x) => x.name === name);
    if (e) {
      setLat(e.lat);
      setLng(e.lng);
      if (!rent && e.avgPrice?.[beds]) setRent(e.avgPrice[beds]);
    }
  };

  const baitCheck = useMemo(() => {
    if (!activeEstate || !rent) return { bait: false, pctOfAvg: 100, label: "" };
    const avg = activeEstate.avgPrice?.[beds] ?? 0;
    if (!avg) return { bait: false, pctOfAvg: 100, label: "" };
    const pct = Math.round((rent / avg) * 100);
    if (pct >= 50) return { bait: false, pctOfAvg: pct, label: "" };
    return {
      bait: true,
      pctOfAvg: pct,
      label: `Bait? ${beds} ${activeEstate.name} ${rent.toLocaleString("en-KE")} — only ${pct}% of estate average (${(avg / 1000).toFixed(0)}k)`,
    };
  }, [activeEstate, rent, beds]);

  /* ---------- map click → lat/lng ---------- */
  const mapRef = useRef<HTMLDivElement>(null);
  const onMapClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top) / rect.height;
    const newLng = NB_BOX.minLng + x * (NB_BOX.maxLng - NB_BOX.minLng);
    const newLat = NB_BOX.maxLat - y * (NB_BOX.maxLat - NB_BOX.minLat);
    setLat(Number(newLat.toFixed(5)));
    setLng(Number(newLng.toFixed(5)));
    // nearest estate suggestion
    let best: { name: string; d: number } | null = null;
    for (const e of catalog?.estates ?? []) {
      const d = haversineM(newLat, newLng, e.lat, e.lng);
      if (!best || d < best.d) best = { name: e.name, d };
    }
    if (best && best.d < 2500 && best.name !== estate) {
      toast("info", `Nearest estate: ${best.name} (${walkText(best.d)}) — tap to adopt coordinates`);
    }
  };

  const proj = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100;

  /* ---------- distance to main road (ephemeral) ---------- */
  const distance = useMemo(() => {
    if (!lat || !lng) return null;
    const roadLat = activeEstate?.mainRoadLat ?? lat;
    const roadLng = activeEstate?.mainRoadLng ?? lng;
    const m = haversineM(lat, lng, roadLat, roadLng);
    return `${walkText(m)} • ${walkMinutes(m)} min walk to ${activeEstate?.mainRoad ?? "main road"}`;
  }, [lat, lng, activeEstate]);

  /* ---------- STEP 4 submit ---------- */
  const roleInfo = ROLES.find((r) => r.id === role);

  const handleSubmit = async () => {
    if (evidenceCount < EVIDENCE.length) {
      toast("error", "All 5 evidence clips required before publish");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createListing({
        tiktokUrl: url.trim(),
        estate,
        subCounty,
        borough,
        price: rent,
        deposit: deposit || rent,
        beds,
        amenities,
        lat,
        lng,
        photoLinks: photoLinks.filter((p) => /^https?:\/\//i.test(p.trim())),
        role,
        mandateLink: role === "Caretaker" ? docLink || undefined : undefined,
        kplcBillLink: role === "Owner" ? docLink || undefined : undefined,
        titleDocLink: role === "Developer" ? docLink || undefined : undefined,
        road,
        evidence: [...EVIDENCE],
      });
      setResult({
        id: res.id,
        videoId: res.videoId,
        publishState: res.publishState,
        status: res.status,
        flags: res.aiFlags?.map((f) => f.label) ?? [],
      });
      setParty(true);
      setTimeout(() => setParty(false), 3200);
      toast("success", "Listing submitted • verification review • not publicly live yet • phone masked until contact");
      setMine((m) => [
        {
          id: res.id,
          estate,
          price: rent,
          beds,
          thumbnailLink: res.thumbnailLink,
          sourceState: res.source,
          publishState: res.publishState,
          posterHandle: resolved?.handle ? `@${resolved.handle}` : "@you",
        },
        ...m,
      ]);
    } catch (err) {
      const payload = (err as { payload?: { detail?: string; repostOf?: string } }).payload;
      const msg = payload?.detail ?? (err as Error).message ?? "Submit failed";
      toast("error", payload?.repostOf ? `${msg}` : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setRole("");
    setDocLink("");
    setUrl("");
    setParseState("empty");
    setResolved(null);
    setParsed({ price: 0, beds: "1BR", estate: "", amenities: [], fee: false });
    setBorough("");
    setSubCounty("");
    setEstate("");
    setRent(0);
    setDeposit(0);
    setBeds("1BR");
    setAmenities([]);
    setRoad("");
    setLat(0);
    setLng(0);
    setPhotoLinks(["", "", ""]);
    setEvidence(EVIDENCE.map(() => false));
    setResult(null);
    toast("info", "Fresh listing wizard ready — links only, as always");
  };

  /* ================= stepper ================= */
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
                    !done && !active && "border-kline bg-surface text-kmuted",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full text-[9.5px]",
                      done ? "bg-verified text-white" : active ? "bg-white/20" : "bg-kbg",
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

  /* ================= live feed card ================= */
  const renderFeedItem = (item: FeedItem, i: number) => (
    <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-kline bg-surface p-2.5">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-kbg">
        {item.thumbnailLink ? (
          <img src={item.thumbnailLink} alt={`${item.beds} in ${item.estate} — TikTok thumbnail link`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[9px] font-extrabold uppercase text-kmuted">{item.estate.slice(0, 6)}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-ink/25">
          <Play className="h-3.5 w-3.5 fill-white text-white" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-extrabold text-body">
          {item.beds} • {item.estate} <span className="font-bold text-ok">{kes(item.price)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-kmuted">
          <span>{item.posterHandle}</span>
          {i === 0 && item.publishState === "pending_review" && (
            <span className="rounded-full bg-pending-soft px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase text-warn-strong">pending review</span>
          )}
          {item.sourceState === "removed" && (
            <span className="rounded-full bg-kbg px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase text-kmuted">source removed</span>
          )}
          {item.sourceState === "tikwm" && (
            <span className="rounded-full bg-verified-soft px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase text-ok">live link</span>
          )}
        </p>
      </div>
    </li>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {party && <Confetti />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-body sm:text-2xl">Post a Keja — live data input</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-bold text-kmuted">
            <Link2 className="h-3.5 w-3.5 text-trust" />
            Links only — the TikTok URL is the media. We never store video or photo bytes.
          </p>
        </div>
        <button type="button" onClick={resetWizard} className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-3.5 py-2 text-[11px] font-extrabold text-body hover:border-trust/40">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {renderStepper()}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ================= MAIN COLUMN ================= */}
        <div className="min-w-0">
          {/* ============ STEP 1 — ROLE SELECTOR ============ */}
          {step === 1 && (
            <section aria-label="Choose your role" className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
              <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                <ShieldCheck className="h-4 w-4 text-trust" /> Who are you posting as?
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setRole(r.id);
                        setDocLink("");
                      }}
                      aria-pressed={active}
                      className={cn(
                        "touch-target flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                        active
                          ? "border-trust bg-trust/5 shadow-[0_0_0_4px_rgba(25,118,210,0.08)]"
                          : "border-kline bg-surface hover:border-trust/40",
                      )}
                    >
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-trust text-white" : "bg-kbg text-kmuted")}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-body">
                          {r.id} {active && <Check className="h-3.5 w-3.5 text-trust" />}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-kmuted">{r.blurb}</span>
                        {r.doc && <span className="mt-1 block text-[10px] font-extrabold text-pending">Requires: {r.doc}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              {role && roleInfo?.docKey && (
                <div className="mt-4 rounded-2xl border border-pending/25 bg-pending-soft/60 p-4">
                  <Field
                    label={roleInfo?.doc ?? "Required document"}
                    hint={
                      <span className="inline-flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> vault link — never public
                      </span>
                    }
                  >
                    <input
                      value={docLink}
                      onChange={(e) => setDocLink(e.target.value)}
                      placeholder="https://vault.keja.co.ke/signed/… (paste the secure doc LINK)"
                      inputMode="url"
                      className={inputCls}
                    />
                  </Field>
                  <p className="mt-2 flex items-start gap-1.5 text-[10.5px] font-semibold text-warn-strong">
                    <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                    {role === "Caretaker"
                      ? "Store ONLY the signed vault URL — it expires in 24h. Upload the letter itself to the private vault, never here."
                      : role === "Owner"
                        ? "Store ONLY the KPLC bill link (vault). It proves the account name matches yours — reviewers check it once."
                        : "Store ONLY the title/lease document link (vault). Reviewers verify ownership once, then it stays sealed."}
                  </p>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={goStep2}
                  disabled={!role}
                  className={cn(
                    "touch-target inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-extrabold transition-all",
                    role ? "bg-ink text-white hover:shadow-md active:scale-[0.98]" : "cursor-not-allowed bg-kbg text-kmuted disabled:opacity-40",
                  )}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* ============ STEP 2 — TIKTOK LINK + AUTO-PARSE (LINK-ONLY) ============ */}
          {step === 2 && (
            <section aria-label="TikTok link" className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
              <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                <Link2 className="h-4 w-4 text-trust" /> Paste the TikTok link — we resolve it live, store the link only
              </p>
              <div className={cn("mt-4", shake && "shake")}>
                <input
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
                  onPaste={() => setTimeout(() => {
                    const v = url.trim();
                    if (/^https?:\/\/(www\.|m\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+/i.test(v)) void runResolve(v);
                  }, 50)}
                  placeholder="https://www.tiktok.com/@kejaagent/video/123456789"
                  inputMode="url"
                  aria-label="TikTok video link"
                  aria-invalid={parseState === "invalid"}
                  className={cn(inputCls, parseState === "invalid" && "border-scam focus:border-scam focus:ring-scam/10")}
                />
                {parseState === "invalid" && (
                  <p role="alert" className="mt-2 flex items-center gap-1.5 text-[11.5px] font-extrabold text-danger-strong">
                    <TriangleAlert className="h-3.5 w-3.5" /> Invalid TikTok link — must be tiktok.com/@handle/video/…
                  </p>
                )}
              </div>

              {parseState === "loading" && (
                <div className="mt-4 space-y-2.5 rounded-2xl border border-kline bg-kbg/60 p-4" aria-busy>
                  <p className="flex items-center gap-2 text-[12px] font-extrabold text-trust">
                    <Loader2 className="h-4 w-4 animate-spin" /> Resolving link via oEmbed…
                  </p>
                  <div className="flex gap-3">
                    <div className="h-24 w-24 shrink-0 rounded-2xl shimmer" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded-lg shimmer" />
                      <div className="h-4 w-1/2 rounded-lg shimmer" />
                      <div className="h-4 w-2/3 rounded-lg shimmer" />
                    </div>
                  </div>
                </div>
              )}

              {parseState === "valid" && resolved && (
                <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                  {/* thumbnail preview with play overlay — NOT an iframe */}
                  <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-kline bg-kbg sm:h-44 sm:w-44">
                    {resolved.thumbnailLink ? (
                      <img
                        src={resolved.thumbnailLink}
                        alt="TikTok video thumbnail (external link — never stored)"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center p-2 text-center">
                        <div>
                          <ImageIcon className="mx-auto h-6 w-6 text-kmuted/50" />
                          <p className="mt-1 text-[9.5px] font-extrabold uppercase leading-tight text-kmuted">
                            thumbnail unavailable<br />link kept anyway
                          </p>
                        </div>
                      </div>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-ink/30">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-lg">
                        <Play className="ml-0.5 h-5 w-5 fill-ink text-ink" />
                      </span>
                    </span>
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-white">
                      preview • not embedded yet
                    </span>
                  </div>

                  {/* parsed + editable */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase",
                        resolved.ok ? "bg-verified-soft text-ok" : "bg-pending-soft text-warn-strong",
                      )}>
                        <Sparkles className="h-3 w-3" />
                        {resolved.ok ? `resolved • ${resolved.source}` : "source removed — context kept"}
                      </span>
                      <span className="rounded-full bg-kbg px-2.5 py-1 text-[10px] font-extrabold text-kmuted">videoId {resolved.videoId.slice(0, 10)}…</span>
                      {resolved.authorLink && (
                        <a href={resolved.authorLink} target="_blank" rel="noreferrer noopener nofollow" className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-trust">
                          @{resolved.handle} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                    {resolved.title && (
                      <p className="mt-2 line-clamp-2 rounded-xl bg-kbg/70 px-3 py-2 text-[11px] font-semibold italic text-body">“{resolved.title}”</p>
                    )}
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Field label="Price KES">
                        <input type="number" min={3000} value={parsed.price || ""} onChange={(e) => setParsed((p) => ({ ...p, price: Number(e.target.value) }))} className={inputCls} aria-label="Price in KES" />
                      </Field>
                      <Field label="Beds">
                        <select value={parsed.beds} onChange={(e) => setParsed((p) => ({ ...p, beds: e.target.value }))} className={inputCls} aria-label="Beds">
                          {BEDS_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </Field>
                      <Field label="Estate hashtag" hint="verify in step 3">
                        <input value={parsed.estate} onChange={(e) => setParsed((p) => ({ ...p, estate: e.target.value }))} placeholder="#kile → Kileleshwa" className={inputCls} aria-label="Estate" />
                      </Field>
                    </div>

                    {/* validation flags */}
                    <div className="mt-3 space-y-1.5">
                      {resolved.checks.bait.bait && (
                        <p className="flex items-start gap-1.5 rounded-xl border border-pending/30 bg-pending-soft px-3 py-2 text-[11px] font-extrabold text-warn-strong">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {resolved.checks.bait.label}
                        </p>
                      )}
                      {resolved.checks.repost.repost && (
                        <p className="flex items-start gap-1.5 rounded-xl border border-scam/30 bg-danger-soft px-3 py-2 text-[11px] font-extrabold text-danger-strong">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {resolved.checks.repost.label}
                        </p>
                      )}
                      {resolved.checks.fee.fee && (
                        <p className="flex items-start gap-1.5 rounded-xl border border-scam/30 bg-danger-soft px-3 py-2 text-[11px] font-extrabold text-danger-strong">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {resolved.checks.fee.label}
                        </p>
                      )}
                      {!resolved.ok && (
                        <p className="flex items-start gap-1.5 rounded-xl border border-kline bg-kbg px-3 py-2 text-[11px] font-semibold text-kmuted">
                          <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          oEmbed can’t see this link from here — the URL + your tags are still saved. If TikTok removes the video later, the listing shows “Source removed” with estate + road context kept.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline px-4 py-2.5 text-[12px] font-extrabold text-body">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={goStep3}
                  disabled={parseState !== "valid"}
                  className={cn(
                    "touch-target inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-extrabold transition-all",
                    parseState === "valid" ? "bg-ink text-white hover:shadow-md active:scale-[0.98]" : "cursor-not-allowed bg-kbg text-kmuted disabled:opacity-40",
                  )}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* ============ STEP 3 — ESTATE + DETAILS (estates.json) ============ */}
          {step === 3 && (
            <section aria-label="Estate and details" className="space-y-5">
              <div className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                  <MapPin className="h-4 w-4 text-trust" /> Location — {catalog?.estates.length ?? 59} estates • 6 boroughs • 17 sub-counties
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Field label="Borough">
                    <select
                      value={borough}
                      onChange={(e) => {
                        setBorough(e.target.value);
                        setSubCounty("");
                        setEstate("");
                      }}
                      className={inputCls}
                    >
                      <option value="">Select borough…</option>
                      {boroughNames.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Sub-county" hint={subCountiesForBorough.length ? `${subCountiesForBorough.length} options` : undefined}>
                    <select
                      value={subCounty}
                      onChange={(e) => {
                        setSubCounty(e.target.value);
                        setEstate("");
                      }}
                      disabled={!borough}
                      className={cn(inputCls, !borough && "opacity-50")}
                    >
                      <option value="">{borough ? "Select sub-county…" : "Pick borough first"}</option>
                      {subCountiesForBorough.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Estate" hint={estate && activeEstate ? activeEstate.priceRange : undefined}>
                    <select value={estate} onChange={(e) => onEstatePick(e.target.value)} disabled={!subCounty} className={cn(inputCls, !subCounty && "opacity-50")}>
                      <option value="">{subCounty ? "Select estate…" : "Pick sub-county first"}</option>
                      {estatesForSub.map((e) => (
                        <option key={e.name} value={e.name}>{e.name} — {e.priceRange}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {activeEstate && (
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-bold text-kmuted">
                    <span>avg {beds}: <b className="text-body">{kes(activeEstate.avgPrice?.[beds] ?? 0)}</b></span>
                    <span>main road: <b className="text-body">{activeEstate.mainRoad}</b></span>
                    <span>alias shorthands welcome (kile → Kileleshwa)</span>
                  </p>
                )}

                {/* rent + deposit + beds */}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Field label="Rent KES / month">
                    <input type="number" min={3000} max={200000} value={rent || ""} onChange={(e) => setRent(Number(e.target.value))} className={cn(inputCls, baitCheck.bait && "border-pending bg-pending-soft/40")} aria-label="Rent per month" />
                  </Field>
                  <Field label="Deposit KES">
                    <input type="number" min={0} value={deposit || ""} onChange={(e) => setDeposit(Number(e.target.value))} placeholder="usually = 1 month" className={inputCls} aria-label="Deposit" />
                  </Field>
                  <Field label="Beds">
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Beds type">
                      {BEDS_OPTIONS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBeds(b)}
                          aria-pressed={beds === b}
                          className={cn(
                            "touch-target rounded-full border px-3.5 py-2 text-[11.5px] font-extrabold transition-all",
                            beds === b ? "border-ink bg-ink text-white" : "border-kline bg-surface text-kmuted hover:border-ink/40",
                          )}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                {rent > 0 && activeEstate && (
                  <p className={cn(
                    "mt-2 flex items-center gap-1.5 text-[11px] font-extrabold",
                    baitCheck.bait ? "text-warn-strong" : "text-ok",
                  )}>
                    {baitCheck.bait ? <TriangleAlert className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {baitCheck.bait ? baitCheck.label : `${beds} ${activeEstate.name} at ${kes(rent)} = ${baitCheck.pctOfAvg}% of estate average ✓`}
                  </p>
                )}

                {/* amenities */}
                <div className="mt-4">
                  <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-kmuted">Amenities</span>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Amenities">
                    {(catalog?.amenities ?? []).filter((a) => a.id !== "no_fee").map((a) => {
                      const on = amenities.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAmenities((prev) => (on ? prev.filter((x) => x !== a.id) : [...prev, a.id]))}
                          aria-pressed={on}
                          className={cn(
                            "touch-target inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11.5px] font-extrabold transition-all",
                            on ? "border-verified bg-verified-soft text-ok" : "border-kline bg-surface text-kmuted hover:border-verified/40",
                          )}
                        >
                          {on && <Check className="h-3 w-3" />}{a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* road cue */}
                <div className="mt-4">
                  <Field label="Road / landmark (public cue)" hint="exact house number NEVER public">
                    <input value={road} onChange={(e) => setRoad(e.target.value)} placeholder='e.g. "Near Oshwal — 350m to Ngong Road"' className={inputCls} aria-label="Road or landmark" />
                  </Field>
                </div>
              </div>

              {/* MAP PICKER + ephemeral derivations */}
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-kline bg-card p-5">
                  <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                    <MapPin className="h-4 w-4 text-trust" /> Tap the map to pin the door — lat/lng only, no address stored
                  </p>
                  <div
                    ref={mapRef}
                    onClick={onMapClick}
                    role="application"
                    aria-label="Nairobi map picker — click to set coordinates"
                    className="relative mt-3 h-64 w-full cursor-crosshair overflow-hidden rounded-2xl border border-kline bg-[#eef3ee] dark:bg-[#1a241c]"
                  >
                    {/* grid */}
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(25,118,210,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(25,118,210,0.12) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                    {/* CBD marker */}
                    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${proj(-1.2864, NB_BOX.minLat, NB_BOX.maxLat)}%`, left: `${proj(36.8172, NB_BOX.minLng, NB_BOX.maxLng)}%` }}>
                      <span className="block rounded-full bg-ink px-2 py-0.5 text-[9px] font-extrabold text-white">CBD</span>
                    </span>
                    {/* estate dots */}
                    {(catalog?.estates ?? []).map((e) => (
                      <span
                        key={e.name}
                        title={e.name}
                        className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-trust/50"
                        style={{ top: `${proj(e.lat, NB_BOX.minLat, NB_BOX.maxLat)}%`, left: `${proj(e.lng, NB_BOX.minLng, NB_BOX.maxLng)}%` }}
                      />
                    ))}
                    {/* main road dot for selected estate */}
                    {activeEstate && (
                      <span
                        className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-trust shadow"
                        style={{ top: `${proj(activeEstate.mainRoadLat, NB_BOX.minLat, NB_BOX.maxLat)}%`, left: `${proj(activeEstate.mainRoadLng, NB_BOX.minLng, NB_BOX.maxLng)}%` }}
                        title={`${activeEstate.mainRoad} (main road)`}
                      />
                    )}
                    {/* user pin */}
                    {lat !== 0 && lng !== 0 && (
                      <span
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                        style={{ top: `${proj(lat, NB_BOX.minLat, NB_BOX.maxLat)}%`, left: `${proj(lng, NB_BOX.minLng, NB_BOX.maxLng)}%` }}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-scam text-white shadow-lg bounce-in">
                          <MapPin className="h-4 w-4" />
                        </span>
                      </span>
                    )}
                    <span className="absolute bottom-1.5 right-2 text-[9px] font-extrabold uppercase text-kmuted/70">nairobi • tap to pin</span>
                  </div>
                  <p className="mt-2 font-mono text-[11px] font-bold text-kmuted">
                    lat {lat.toFixed(5) || "—"} • lng {lng.toFixed(5) || "—"} {!lat && "(tap map or pick estate)"}
                  </p>
                </div>

                <div className="rounded-3xl border border-kline bg-card p-5">
                  <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                    <Sparkles className="h-4 w-4 text-trust" /> Derived live — never stored
                  </p>
                  <div className="mt-3 space-y-2.5">
                    <div className={cn("rounded-2xl border p-3.5", distance ? "border-verified/25 bg-verified-soft" : "border-kline bg-kbg/50")}>
                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-kmuted">
                        <Footprints className="h-3.5 w-3.5" /> Distance to main road
                      </p>
                      <p className={cn("mt-1 text-[13px] font-extrabold", distance ? "text-ok" : "text-kmuted")}>
                        {distance ?? "Pin a location first"}
                      </p>
                    </div>
                    <div className={cn("rounded-2xl border p-3.5", weather ? "border-trust/25 bg-trust/5" : "border-kline bg-kbg/50")}>
                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-kmuted">
                        <CloudSun className="h-3.5 w-3.5" /> Weather now (6h cache)
                      </p>
                      <p className={cn("mt-1 text-[13px] font-extrabold", weather ? "text-trust" : "text-kmuted")}>
                        {weather ? `${weather.tempC}°C ${weather.note}` : lat ? "fetching…" : "Pin a location first"}
                      </p>
                    </div>
                    <p className="text-[10px] font-semibold leading-relaxed text-kmuted">
                      Both values are derived from links/APIs at request time — written to no table. Visitors always see fresh data.
                    </p>
                  </div>
                </div>
              </div>

              {/* photo LINKS */}
              <div className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                  <ImageIcon className="h-4 w-4 text-trust" /> Photos — up to 3 external image LINKS (no uploads, ever)
                </p>
                <p className="mt-1 text-[11px] font-semibold text-kmuted">
                  Paste links to images you’ve already hosted elsewhere (Cloudinary, Imgix, TikTok CDN). We store the URL strings only.
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {photoLinks.map((p, i) => (
                    <Field key={i} label={`Photo link ${i + 1}`}>
                      <input
                        value={p}
                        onChange={(e) => setPhotoLinks((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder="https://res.cloudinary.com/…"
                        inputMode="url"
                        className={inputCls}
                      />
                    </Field>
                  ))}
                </div>
                {photoLinks.some((p) => p.trim() && !/^https?:\/\//i.test(p.trim())) && (
                  <p role="alert" className="mt-2 flex items-center gap-1.5 text-[11px] font-extrabold text-danger-strong">
                    <TriangleAlert className="h-3.5 w-3.5" /> Links must start with https://
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep(2)} className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline px-4 py-2.5 text-[12px] font-extrabold text-body">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!estate || !rent}
                  className={cn(
                    "touch-target inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-extrabold transition-all",
                    estate && rent ? "bg-ink text-white hover:shadow-md active:scale-[0.98]" : "cursor-not-allowed bg-kbg text-kmuted disabled:opacity-40",
                  )}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* ============ STEP 4 — EVIDENCE + PUBLISHING RULES ============ */}
          {step === 4 && (
            <section aria-label="Evidence and publish" className="space-y-5">
              <EvidenceChecklist
                checked={evidence}
                onChange={(next) => setEvidence(next)}
              />
              <p className={cn("text-[11.5px] font-extrabold", evidenceCount === 5 ? "text-ok" : "text-warn-strong")}>
                {evidenceCount === 5
                  ? "5/5 evidence clips checked — full evidence verified, publish is unlocked."
                  : `${evidenceCount}/5 evidence clips checked — publishing is blocked until all 5 are ticked.`}
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl border border-kline bg-card p-5">
                  <p className="font-display text-[14px] font-extrabold text-body">Publishing rules</p>
                  <ul className="mt-3 space-y-2">
                    {PUBLISH_RULES.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-[12px] font-semibold text-body">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-kline bg-card p-5">
                  <p className="font-display text-[14px] font-extrabold text-body">Trust checks preview</p>
                  <ul className="mt-3 space-y-2.5">
                    <li className="flex items-center justify-between gap-2 rounded-xl bg-kbg/60 px-3 py-2.5 text-[12px] font-bold text-body">
                      Phone verified <span className="inline-flex items-center gap-1 rounded-full bg-pending-soft px-2 py-0.5 text-[10px] font-extrabold text-warn-strong"><EyeOff className="h-3 w-3" /> masked until lead</span>
                    </li>
                    <li className="flex items-center justify-between gap-2 rounded-xl bg-kbg/60 px-3 py-2.5 text-[12px] font-bold text-body">
                      Evidence video <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold", evidenceCount === 5 ? "bg-verified-soft text-ok" : "bg-pending-soft text-warn-strong")}>{evidenceCount}/5 clips</span>
                    </li>
                    <li className="flex items-center justify-between gap-2 rounded-xl bg-kbg/60 px-3 py-2.5 text-[12px] font-bold text-body">
                      No viewing fee rule <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold", parsed.fee ? "bg-danger-soft text-danger-strong" : "bg-verified-soft text-ok")}>{parsed.fee ? "fee signal — flagged red" : "clean ✓"}</span>
                    </li>
                    <li className="flex items-center justify-between gap-2 rounded-xl bg-kbg/60 px-3 py-2.5 text-[12px] font-bold text-body">
                      Re-check enabled <span className="rounded-full bg-verified-soft px-2 py-0.5 text-[10px] font-extrabold text-ok">SMS YES/NO • day 6</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* store-manifest */}
              <div className="rounded-3xl border border-trust/25 bg-trust/5 p-5">
                <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
                  <Link2 className="h-4 w-4 text-trust" /> What gets stored — links only
                </p>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {[
                    `tiktokUrl: ${url.trim().slice(0, 46)}…`,
                    resolved?.thumbnailLink ? "thumbnailLink: (oEmbed thumb URL)" : "thumbnailLink: —",
                    resolved?.embedHtmlLink ? "embedHtmlLink: (oEmbed iframe HTML)" : "embedHtmlLink: —",
                    resolved?.authorLink ? `authorLink: @${resolved.handle}` : "authorLink: —",
                    ...photoLinks.filter((p) => /^https?:\/\//i.test(p.trim())).map((_, i) => `photoLink${i + 1}: (external URL)`),
                    role === "Caretaker" && docLink ? "mandateLink: (signed vault URL • 24h)" : null,
                    role === "Owner" && docLink ? "kplcBillLink: (vault)" : null,
                    role === "Developer" && docLink ? "titleDocLink: (vault)" : null,
                    `tags: ${beds} • ${estate} • ${kes(rent)} • ${amenities.length} amenities`,
                  ].filter(Boolean).map((line) => (
                    <p key={line} className="truncate rounded-lg bg-white/70 px-3 py-1.5 font-mono text-[10.5px] font-semibold text-body dark:bg-white/5">{line}</p>
                  ))}
                </div>
                <p className="mt-2 text-[10.5px] font-bold text-kmuted">Never stored: video bytes, photo bytes, ID image bytes, exact house number.</p>
              </div>

              {result ? (
                <div className="rounded-3xl border border-verified/30 bg-verified-soft p-5" role="status">
                  <p className="flex items-center gap-2 font-display text-[15px] font-extrabold text-ok">
                    <Check className="h-5 w-5" /> Listing submitted — in verification review
                  </p>
                  <div className="mt-3 grid gap-2 text-[12px] font-semibold text-body sm:grid-cols-2">
                    <p>videoId: <b className="font-mono">{result.videoId}</b></p>
                    <p>status: <b>{result.status}</b> • publishState: <b>{result.publishState}</b></p>
                  </div>
                  {result.flags.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {result.flags.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11.5px] font-bold text-warn-strong">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate("home")} className="touch-target rounded-full bg-ink px-5 py-2.5 text-[12px] font-extrabold text-white">Browse listings</button>
                    <button type="button" onClick={() => navigate("dashboard")} className="touch-target rounded-full border border-kline px-5 py-2.5 text-[12px] font-extrabold text-body">Poster dashboard</button>
                    <button type="button" onClick={resetWizard} className="touch-target rounded-full border border-kline px-5 py-2.5 text-[12px] font-extrabold text-body">Post another</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep(3)} className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline px-4 py-2.5 text-[12px] font-extrabold text-body">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || evidenceCount < 5}
                    className={cn(
                      "touch-target inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[13px] font-extrabold transition-all",
                      evidenceCount === 5 && !submitting ? "bg-verified text-white shadow-md hover:shadow-lg active:scale-[0.98]" : "cursor-not-allowed bg-kbg text-kmuted disabled:opacity-40",
                    )}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {submitting ? "Publishing…" : "Publish listing"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ================= SIDE — LIVE DATA FEED ================= */}
        <aside className="min-w-0 space-y-4" aria-label="Live data feed">
          <div className="rounded-3xl border border-kline bg-card p-4">
            <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-body">
              <Radio className="h-4 w-4 text-verified" /> Live data feed
              <span className="ml-auto rounded-full bg-verified-soft px-2 py-0.5 text-[10px] font-extrabold text-ok">{feed.length + mine.length} links</span>
            </p>
            <p className="mt-1 text-[10.5px] font-semibold text-kmuted">Latest link-only submissions flowing into the catalog.</p>
            {mine.length > 0 && (
              <ul className="mt-3 space-y-2">
                <li className="text-[9.5px] font-extrabold uppercase tracking-widest text-pending">just posted by you</li>
                {mine.map((m) => renderFeedItem(m, -1))}
              </ul>
            )}
            <ul className="mt-3 space-y-2">
              {feed.length === 0 && <li className="rounded-xl bg-kbg px-3 py-4 text-center text-[11px] font-bold text-kmuted">Loading live listings…</li>}
              {feed.map((f, i) => renderFeedItem(f, i))}
            </ul>
          </div>

          <div className="rounded-3xl border border-verified/20 bg-verified-soft/70 p-4">
            <p className="text-[12px] font-extrabold text-ok">Hakuna Kulipa Kabla Ya Kuona Nyumba</p>
            <p className="mt-1 text-[10.5px] font-semibold leading-relaxed text-ok-strong">
              Every link in this feed was inputted live through this wizard. Thumbnails come from TikTok’s oEmbed at render time — our servers hold zero media.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
