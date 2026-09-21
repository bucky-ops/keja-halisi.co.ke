"use client";
// KEJA HALISI — VerifyView: agent verification center (4 roles)
// State machine: 1 Role select → 2 Phone OTP → 3 ID+Selfie+role docs → 4 Status
import { useState } from "react";
import {
  Users,
  House,
  Building2,
  Store,
  Check,
  Clock,
  Upload,
  Loader2,
  ArrowRight,
  Home as HomeIcon,
  ShieldCheck,
  ChevronDown,
  Crown,
  Phone,
  Video,
  PhoneCall,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { ROLES, EVIDENCE_ITEMS, type Role } from "@/lib/nairobi";
import { sendOtp, checkOtp, submitVerification } from "../api";
import { OtpInput, Confetti } from "../evidence";
import { PendingBadge } from "../badges";

const STEP_LABELS = ["Role", "Phone OTP", "Evidence", "Status"];

const ROLE_CARDS: Record<Role, { icon: typeof Users; desc: string }> = {
  Agent: { icon: Users, desc: "Lists many estates • commission • fastest response ranking" },
  Owner: { icon: House, desc: "Owns unit • direct • no viewing fee • evidence required" },
  Developer: { icon: Building2, desc: "Multiple units • M-Pesa Till • expiry cron • borough grouping" },
  Caretaker: {
    icon: Store,
    desc: "Specific estates only • needs owner mandate letter • permissions table • cannot list outside mandate",
  },
};

const MANDATE_ESTATES = [
  "Kileleshwa",
  "Lavington",
  "Kilimani",
  "Kasarani",
  "Zimmerman",
  "Syokimau",
  "Utawala",
  "Umoja",
  "Buruburu",
];

/** Simulated drag-drop upload zone (demo — no real upload in sandbox) */
function UploadZone({
  label,
  done,
  onCapture,
}: {
  label: string;
  done: boolean;
  onCapture: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCapture}
      aria-pressed={done}
      className={cn(
        "touch-target w-full rounded-2xl border-2 border-dashed p-4 text-left transition-colors",
        done
          ? "border-verified bg-verified-soft"
          : "border-kline bg-kbg/60 hover:border-trust hover:bg-trust-soft/60"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
            done ? "border-verified bg-verified text-white" : "border-kline bg-surface text-trust"
          )}
        >
          {done ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        </span>
        <p className="text-[12px] font-bold leading-snug text-body">{label}</p>
        {done && (
          <span className="ml-auto shrink-0 rounded-full bg-verified px-2 py-0.5 text-[10px] font-extrabold text-white">
            Captured
          </span>
        )}
      </div>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-kmuted">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "touch-target w-full rounded-xl border border-kline bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-body outline-none placeholder:font-medium placeholder:text-kmuted/60 focus:border-trust focus:ring-4 focus:ring-trust/10";

export default function VerifyView() {
  const { navigate, setSession, notify } = useKeja();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [party, setParty] = useState(false);

  // step 2 — phone OTP
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"send" | "check" | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [shake, setShake] = useState(false);
  const [otpOk, setOtpOk] = useState<{ age: number } | null>(null);

  // step 3 — evidence
  const [idDone, setIdDone] = useState(false);
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [video1, setVideo1] = useState("");
  const [video2, setVideo2] = useState("");
  const [ref1, setRef1] = useState("");
  const [ref2, setRef2] = useState("");
  const [kplcDone, setKplcDone] = useState(false);
  const [titleDone, setTitleDone] = useState(false);
  const [mandateDone, setMandateDone] = useState(false);
  const [mandateEstates, setMandateEstates] = useState<string[]>([]);
  const [goldOpen, setGoldOpen] = useState(false);
  const [goldDone, setGoldDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  const bumpShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  /* ---------- step 2 handlers ---------- */
  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      toast("error", "Enter a valid Safaricom number — 07xx xxx xxx");
      bumpShake();
      return;
    }
    setBusy("send");
    setOtpError(false);
    try {
      const res = await sendOtp(phone);
      setDemoCode(res.demoCode);
      setOtpSent(true);
      setOtp("");
      toast("info", `Demo OTP: ${res.demoCode} • SMS mock — Africa's Talking in production`);
    } catch {
      toast("error", "Could not send OTP — try again");
    } finally {
      setBusy(null);
    }
  };

  const handleCheckOtp = async () => {
    if (otp.length < 6) {
      setOtpError(true);
      bumpShake();
      return;
    }
    setBusy("check");
    setOtpError(false);
    try {
      const res = await checkOtp(phone, otp);
      if (res.verified) {
        setOtpOk({ age: res.phoneAgeMonths });
        setSession({ phone, verified: true });
        toast("success", "Phone verified ✓");
        notify("success", "Phone verified ✓", `${phone} passed the Africa's Talking OTP check — you can now post and lead-log.`);
        setTimeout(() => setStep(3), 800);
      } else {
        setOtpError(true);
        bumpShake();
      }
    } catch {
      setOtpError(true);
      bumpShake();
    } finally {
      setBusy(null);
    }
  };

  /* ---------- step 3 handlers ---------- */
  const captureId = () => {
    if (idDone) return;
    setIdDone(true);
    toast("success", "ID front captured • Selfie with ID next");
  };

  const toggleMandateEstate = (estate: string) => {
    setMandateEstates((prev) =>
      prev.includes(estate) ? prev.filter((e) => e !== estate) : [...prev, estate]
    );
  };

  const buildDocs = (): string[] => {
    const docs: string[] = [];
    if (idDone) docs.push("ID selfie + liveness");
    if (role === "Agent") {
      if (video1.trim() && video2.trim()) docs.push("2 old TikTok video links");
      if (ref1.trim() && ref2.trim()) docs.push("2 referral phone numbers");
    }
    if (role === "Owner" && kplcDone) docs.push("KPLC bill matching name");
    if (role === "Developer" && titleDone) docs.push("Title / Lease document + company reg");
    if (role === "Caretaker" && mandateDone) docs.push("Owner mandate letter");
    if (goldDone) docs.push("KRA PIN / Business Reg (Gold)");
    return docs;
  };

  const handleSubmitVerification = async () => {
    if (!role || !idDone) {
      toast("error", "Capture ID selfie + liveness before submitting");
      bumpShake();
      return;
    }
    if (!tiktokHandle.trim().startsWith("@")) {
      toast("error", "Add your TikTok handle — e.g. @keja_yourname");
      bumpShake();
      return;
    }
    if (role === "Caretaker" && (!mandateDone || mandateEstates.length === 0)) {
      toast("error", "Caretaker needs the owner mandate letter + at least one mandate estate");
      bumpShake();
      return;
    }
    setSubmitting(true);
    try {
      await submitVerification({
        phone,
        tiktokHandle: tiktokHandle.trim(),
        role,
        docs: buildDocs(),
        ...(role === "Caretaker" ? { mandateEstates } : {}),
      });
      setSubmittedAt(new Date());
      setParty(true);
      setTimeout(() => setParty(false), 3200);
      toast("success", "Verification submitted • Pending yellow pulse • Under review 2h — you will get SMS");
      setStep(4);
    } catch {
      toast("error", "Submit failed — check connection and retry");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- render helpers ---------- */
  const renderStepper = () => (
    <nav aria-label="Verification steps" className="flex flex-wrap items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <span
            key={label}
            aria-current={active ? "step" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-extrabold",
              done && "border-verified/30 bg-verified-soft text-ok",
              active && "border-ink bg-ink text-white",
              !done && !active && "border-kline bg-surface text-kmuted"
            )}
          >
            {done ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9.5px]", active ? "bg-white/20" : "bg-kbg")}>
                {n}
              </span>
            )}
            {n} {label}
          </span>
        );
      })}
    </nav>
  );

  const permissionsBox = () => {
    if (!role) {
      return (
        <div className="rounded-2xl border border-kline bg-kbg/60 p-4">
          <p className="flex items-center gap-2 text-[12px] font-bold text-kmuted">
            <ShieldCheck className="h-4 w-4 text-trust" />
            Select a role to preview its posting permissions
          </p>
        </div>
      );
    }
    if (role === "Caretaker") {
      return (
        <div className="rounded-2xl border border-pending/30 bg-pending-soft p-4" role="note">
          <p className="flex items-center gap-2 text-[12px] font-extrabold text-warn-strong">
            <Store className="h-4 w-4 shrink-0" />
            Caretaker permissions
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-warn-strong/90">
            Caretaker can only post for estates in mandate • Owner mandate letter required • Permissions table in
            developer dashboard • Private vault stores letter.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-trust/25 bg-trust-soft p-4" role="note">
        <p className="flex items-center gap-2 text-[12px] font-extrabold text-trust">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {role} permissions
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-trust">
          {role} can post Nairobi wide • Trust checks required • No viewing fee enforcement • Evidence checklist
          required.
        </p>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      {party && <Confetti />}

      {/* header */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-extrabold text-body sm:text-2xl">Verify Agent • 3 Steps</h2>
        <div className="rounded-2xl border border-trust/25 bg-trust-soft p-4" role="note">
          <p className="flex items-start gap-2 text-[12px] font-semibold leading-relaxed text-trust">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Verification flow combines phone OTP, ID/selfie, TikTok evidence and referral signals. Never display the
            raw ID in the public profile.
          </p>
        </div>
        {renderStepper()}
      </div>

      {/* ============ STEP 1 — ROLE ============ */}
      {step === 1 && (
        <section className="mt-6" aria-label="Role selection">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => {
              const card = ROLE_CARDS[r];
              const Icon = card.icon;
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  aria-pressed={active}
                  className={cn(
                    "touch-target rounded-3xl border p-5 text-left transition-all",
                    active
                      ? "border-ink bg-ink text-white shadow-lg"
                      : "border-kline bg-card text-body hover:-translate-y-0.5 hover:border-trust/40 hover:shadow-md"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-2xl",
                      active ? "bg-white/10 text-tiktok-cyan" : "bg-trust-soft text-trust"
                    )}
                  >
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <p className="mt-3 font-display text-[15px] font-extrabold">{r}</p>
                  <p className={cn("mt-1 text-[11.5px] font-semibold leading-relaxed", active ? "text-white/70" : "text-kmuted")}>
                    {card.desc}
                  </p>
                  {active && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-extrabold text-tiktok-cyan">
                      <Check className="h-3 w-3" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4">{permissionsBox()}</div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={!role}
              onClick={() => {
                setStep(2);
                toast("info", `${role} selected • Next: phone OTP`);
              }}
              className={cn(
                "touch-target inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-extrabold transition-all",
                role
                  ? "bg-ink text-white hover:shadow-md active:scale-[0.98]"
                  : "cursor-not-allowed bg-kbg text-kmuted"
              )}
            >
              Continue to phone OTP <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* ============ STEP 2 — PHONE OTP ============ */}
      {step === 2 && (
        <section className="mt-6 max-w-xl" aria-label="Phone OTP">
          <div className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-display text-[14px] font-extrabold text-body">
              <Phone className="h-4 w-4 text-trust" />
              Phone OTP — Safaricom number
            </p>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xx xxx xxx"
                inputMode="tel"
                aria-label="Phone number"
                className={cn(inputCls, "flex-1", shake && "shake border-scam")}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={busy === "send"}
                className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-trust px-5 py-2.5 text-[12.5px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md disabled:opacity-60"
              >
                {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                Send OTP
              </button>
            </div>

            {demoCode && (
              <div className="mt-3 rounded-xl border border-pending/30 bg-pending-soft px-3.5 py-3" role="note">
                <p className="text-[11.5px] font-bold text-warn-strong">
                  Demo: SMS mock — code {demoCode} (Africa&apos;s Talking in production)
                </p>
              </div>
            )}

            {otpSent && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-kmuted">
                  Enter the 6-digit code
                </p>
                <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(false); }} />
                {otpError && (
                  <p role="alert" className="mt-2 text-[11.5px] font-extrabold text-danger-strong">
                    Invalid or expired code
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCheckOtp}
                  disabled={busy === "check" || otpOk !== null}
                  className="touch-target mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[12.5px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md disabled:opacity-60"
                >
                  {busy === "check" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {otpOk ? "Verified" : "Verify"}
                </button>
              </div>
            )}

            {otpOk && (
              <div
                role="status"
                className={cn(
                  "mt-4 rounded-xl border px-3.5 py-3",
                  otpOk.age >= 6 ? "border-verified/25 bg-verified-soft" : "border-pending/30 bg-pending-soft"
                )}
              >
                {otpOk.age >= 6 ? (
                  <p className="text-[12px] font-extrabold text-ok">
                    ✓ Phone verified • Truecaller: number age {otpOk.age} months → trusted
                  </p>
                ) : (
                  <p className="text-[12px] font-extrabold text-warn-strong">
                    ✓ Phone verified • Truecaller: number age {otpOk.age} months &lt;6 months — extra review
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12px] font-bold text-body hover:bg-kbg"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Role
            </button>
            <span className="text-[11px] font-semibold text-kmuted">Auto-advances after verification</span>
          </div>
        </section>
      )}

      {/* ============ STEP 3 — EVIDENCE ============ */}
      {step === 3 && role && (
        <section className="mt-6 max-w-2xl" aria-label="Evidence upload">
          <div className="space-y-4">
            {/* common ID selfie zone */}
            <UploadZone
              label="🪪 ID selfie upload • Selfie holding ID • Liveness"
              done={idDone}
              onCapture={captureId}
            />

            {/* role-specific evidence */}
            {role === "Agent" && (
              <div className="rounded-3xl border border-kline bg-card p-5">
                <p className="flex items-center gap-2 font-display text-[13.5px] font-extrabold text-body">
                  <Video className="h-4 w-4 text-trust" /> 2 old TikTok video links
                </p>
                <div className="mt-3 space-y-2.5">
                  <input
                    value={video1}
                    onChange={(e) => setVideo1(e.target.value)}
                    placeholder="https://www.tiktok.com/@you/video/older-listing-1"
                    inputMode="url"
                    aria-label="TikTok video link 1"
                    className={inputCls}
                  />
                  <input
                    value={video2}
                    onChange={(e) => setVideo2(e.target.value)}
                    placeholder="https://www.tiktok.com/@you/video/older-listing-2"
                    inputMode="url"
                    aria-label="TikTok video link 2"
                    className={inputCls}
                  />
                </div>
                <p className="mt-3 flex items-center gap-2 font-display text-[13.5px] font-extrabold text-body">
                  <PhoneCall className="h-4 w-4 text-trust" /> 2 referral phone numbers
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={ref1}
                    onChange={(e) => setRef1(e.target.value)}
                    placeholder="07xx xxx xxx — agent ref 1"
                    inputMode="tel"
                    aria-label="Referral phone number 1"
                    className={inputCls}
                  />
                  <input
                    value={ref2}
                    onChange={(e) => setRef2(e.target.value)}
                    placeholder="07xx xxx xxx — agent ref 2"
                    inputMode="tel"
                    aria-label="Referral phone number 2"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {role === "Owner" && (
              <UploadZone
                label="KPLC bill matching name — bill must carry the same name as ID"
                done={kplcDone}
                onCapture={() => {
                  if (kplcDone) return;
                  setKplcDone(true);
                  toast("success", "KPLC bill captured • Name match check queued");
                }}
              />
            )}

            {role === "Developer" && (
              <UploadZone
                label="Title / Lease document + company reg — project ownership proof"
                done={titleDone}
                onCapture={() => {
                  if (titleDone) return;
                  setTitleDone(true);
                  toast("success", "Title / lease + company reg captured");
                }}
              />
            )}

            {role === "Caretaker" && (
              <div className="rounded-3xl border border-pending/30 bg-pending-soft p-5">
                <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-warn-strong">
                  <Store className="h-4 w-4 shrink-0" />
                  Caretaker mandate upload • Owner mandate letter • Permissions for specific estates
                </p>
                <div className="mt-3">
                  <UploadZone
                    label="Owner mandate letter — signed by the owner, stored in private vault"
                    done={mandateDone}
                    onCapture={() => {
                      if (mandateDone) return;
                      setMandateDone(true);
                      toast("success", "Mandate letter captured • Vault copy encrypted");
                    }}
                  />
                </div>
                <fieldset className="mt-4">
                  <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-warn-strong">
                    Mandate estates — pick estates you may post
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {MANDATE_ESTATES.map((estate) => {
                      const on = mandateEstates.includes(estate);
                      return (
                        <label
                          key={estate}
                          className={cn(
                            "touch-target flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-[11.5px] font-bold transition-colors",
                            on ? "border-ink bg-ink text-white" : "border-kline bg-surface text-body hover:border-trust/40"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleMandateEstate(estate)}
                            className="sr-only"
                          />
                          {on && <Check className="h-3 w-3" />}
                          {estate}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {/* optional gold */}
            <div className="rounded-3xl border border-gold/50 bg-gold/10">
              <button
                type="button"
                onClick={() => setGoldOpen((v) => !v)}
                aria-expanded={goldOpen}
                className="touch-target flex w-full items-center gap-2 rounded-3xl p-4 text-left"
              >
                <Crown className="h-4 w-4 text-warn" />
                <span className="text-[12.5px] font-extrabold text-warn">
                  KRA PIN / Business Reg (optional Gold badge 👑)
                </span>
                <ChevronDown className={cn("ml-auto h-4 w-4 text-warn transition-transform", goldOpen && "rotate-180")} />
              </button>
              {goldOpen && (
                <div className="px-4 pb-4">
                  <UploadZone
                    label="KRA PIN certificate or Business registration — unlocks Gold listing tier"
                    done={goldDone}
                    onCapture={() => {
                      if (goldDone) return;
                      setGoldDone(true);
                      toast("success", "Gold doc captured • 👑 badge unlocks after review");
                    }}
                  />
                </div>
              )}
            </div>

            {/* evidence checklist note */}
            <div className="rounded-2xl border border-verified/25 bg-verified-soft p-4" role="note">
              <p className="flex items-start gap-2 text-[12px] font-bold leading-relaxed text-ok">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
                Listing evidence checklist applies at posting time: {EVIDENCE_ITEMS.join(" • ")}
              </p>
            </div>

            {/* tiktok handle */}
            <Field label="Your TikTok handle (shown on your public profile)">
              <input
                value={tiktokHandle}
                onChange={(e) => setTiktokHandle(e.target.value)}
                placeholder="@keja_yourname"
                aria-label="TikTok handle"
                className={inputCls}
              />
            </Field>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12px] font-bold text-body hover:bg-kbg"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Phone OTP
              </button>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={submitting}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-verified px-6 py-3 text-[13px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Submit verification
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ STEP 4 — STATUS ============ */}
      {step === 4 && (
        <section className="mt-6 max-w-xl" aria-label="Verification status">
          <div className="rounded-3xl border border-kline bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <PendingBadge label="Under review" className="px-4 py-1.5 text-[13px]" />
              <span className="text-[11.5px] font-semibold text-kmuted">
                {submittedAt
                  ? `Submitted ${submittedAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}`
                  : "Just now"}
              </span>
            </div>

            {/* timeline */}
            <ol className="mt-5 space-y-3" aria-label="Verification timeline">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-verified text-white">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-extrabold text-body">Phone OTP</p>
                  <p className="text-[11.5px] font-semibold text-kmuted">
                    {phone.replace(/\D/g, "").slice(-3).padStart(11, "*")} • verified ✓
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-verified text-white">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-extrabold text-body">ID + selfie</p>
                  <p className="text-[11.5px] font-semibold text-kmuted">Encrypted in private vault • never public</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pending-soft text-pending ring-1 ring-pending/30">
                  <Clock className="h-4 w-4 pulse-dot" />
                </span>
                <div>
                  <p className="text-[13px] font-extrabold text-body">Role evidence — {role}</p>
                  <p className="text-[11.5px] font-semibold text-kmuted">
                    Under review ~2h • SMS confirmation on decision
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => navigate("home")}
                className="touch-target inline-flex items-center gap-2 rounded-full border border-kline bg-surface px-5 py-3 text-[12.5px] font-extrabold text-body hover:bg-kbg"
              >
                <HomeIcon className="h-4 w-4" /> Back to discover
              </button>
              <button
                type="button"
                onClick={() => navigate("post")}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12.5px] font-extrabold text-white transition-transform active:scale-[0.98] hover:shadow-md"
              >
                Post a house anyway (demo) <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
