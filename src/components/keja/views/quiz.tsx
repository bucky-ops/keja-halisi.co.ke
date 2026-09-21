"use client";
// KEJA HALISI — Scam Safety Quiz view ("Scam au Legit?")
// 8 real Nairobi rental scenarios; instant feedback + Sheng explanations.
// Best score persists in store.activity — drives the Scam Radar tile on home.
import { useMemo, useState } from "react";
import {
  ArrowLeft, ShieldAlert, ShieldCheck, Play, RotateCcw, Trophy, Check, X,
  GraduationCap, PartyPopper, Frown, Meh, Smile, Phone, Banknote, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import { Confetti } from "../evidence";

type Scenario = {
  id: string;
  headline: string;
  body: string;
  answer: "scam" | "legit";
  explain: string;
  rule: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "fee",
    headline: "Kasarani bedsitter — KES 8,000",
    body: "The agent says: \"Ni offer ya leo tu. Send KES 500 viewing fee via M-Pesa first, ndio nikupe direction ya plot.\" The TikTok video looks real and the price is right.",
    answer: "scam",
    explain: "Asking for a viewing fee BEFORE you see the house is the #1 Nairobi rental scam. Keja Halisi bans it instantly.",
    rule: "Hakuna kulipa kabla ya kuona nyumba",
  },
  {
    id: "evidence",
    headline: "Kileleshwa 1BR — KES 35,000",
    body: "The listing has a 5-point evidence video: outside, gate, inside, water running from the tap, and the window view. Poster is green-tick verified with 12 listings and 4.8★.",
    answer: "legit",
    explain: "Full evidence checklist + verified agent = trust signals. Still visit in person before paying deposit.",
    rule: "Evidence 5/5 + green tick",
  },
  {
    id: "bait",
    headline: "Kileleshwa 1BR — KES 9,000",
    body: "\"Spacious 1BR in Kileleshwa, KES 9,000 only!\" The caption says the house is next to a landmark gate, but the video never shows the inside — just a gate photo and a phone number.",
    answer: "scam",
    explain: "Premium estate + impossibly low price + no interior footage = 1BR-bait. The real house is a bedsitter across town, or doesn't exist.",
    rule: "If it's too cheap for the area, it's bait",
  },
  {
    id: "masked",
    headline: "Utawala bedsitter — KES 12,000",
    body: "You tap \"Call Agent\" and the app shows 07** *** 214 — the number is masked until you log the lead. After logging, the full number appears and the lead is audit-logged.",
    answer: "legit",
    explain: "Masked-until-contact protects you from WhatsApp spam groups selling one 'available' room to 50 people.",
    rule: "Phone masked until contact",
  },
  {
    id: "whatsapp-group",
    headline: "\"Hot deals Nairobi\" WhatsApp group",
    body: "An admin posts 20 'available' houses with blurred photos. To get 'the exact location and door number' you must pay KES 300 to join the VIP group first.",
    answer: "scam",
    explain: "Selling 'exact location' access is a middleman scam. Real platforms show estate + road publicly and never sell door numbers.",
    rule: "Never pay for 'exact location' access",
  },
  {
    id: "deposit",
    headline: "Buruburu 2BR — KES 32,000",
    body: "You visit the house with the agent, you love it. Deposit + one month rent is paid via M-Pesa to the landlord's till, you get a stamped receipt and sign a lease with the owner present.",
    answer: "legit",
    explain: "Payment AFTER viewing, with receipts and a lease = the correct flow. Viewed first, paid after — perfect.",
    rule: "View first, then deposit with receipt",
  },
  {
    id: "repost",
    headline: "Zimmerman bedsitter — KES 7,500",
    body: "Same walkthrough video was posted 3 weeks ago by a different handle, and last month another agent 'rented' you the same video house in Umoja. The caption says 'just vacated, hurry!'.",
    answer: "scam",
    explain: "Reposted / recycled videos across handles is the classic multi-victim scam — one real video sold to many people.",
    rule: "Reposted video = red flag",
  },
  {
    id: "caretaker",
    headline: "Lavington 1BR — KES 42,000",
    body: "The poster is a caretaker with a verified mandate letter from the owner, mandate covers Kileleshwa + Lavington, and expires 2026-03-01. He shows you the house physically the same day.",
    answer: "legit",
    explain: "Caretakers with owner-verified mandates are legitimate — Keja Halisi checks the mandate letter and estate scope.",
    rule: "Caretaker needs a verified mandate",
  },
];

const BADGES = [
  { min: 90, label: "Scam Detective", tone: "text-verified", cls: "bg-verified-soft text-ok-strong", icon: PartyPopper, note: "Elite! Hakuna scam inaweza kushinda wewe. Teach your friends on TikTok." },
  { min: 70, label: "Keja Guardian", tone: "text-trust", cls: "bg-trust-soft text-trust", icon: Trophy, note: "Solid radar. Review the ones you missed and you're untouchable." },
  { min: 50, label: "Still Learning", tone: "text-gold", cls: "bg-gold/15 text-warn-strong", icon: Meh, note: "Half-way there — one more round and the patterns will stick." },
  { min: 0, label: "Fresh Renters", tone: "text-scam", cls: "bg-scam/10 text-scam", icon: Frown, note: "Good thing you practiced here and not with your deposit! Run it again." },
];

type Phase = "intro" | "play" | "done";

export default function QuizView() {
  const { back, navigate, activity, notify, recordQuiz } = useKeja();
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<"scam" | "legit" | null>(null);
  const [correct, setCorrect] = useState(0);

  const scorePct = Math.round((correct / SCENARIOS.length) * 100);
  const badge = useMemo(() => BADGES.find((b) => scorePct >= b.min) ?? BADGES[BADGES.length - 1], [scorePct]);
  const isBest = scorePct >= (activity.quizBest ?? 0) && phase === "done" && scorePct > 0;

  const pick = (choice: "scam" | "legit") => {
    if (picked) return;
    setPicked(choice);
    if (choice === SCENARIOS[idx].answer) {
      setCorrect((c) => c + 1);
      toast("success", t("quizCorrect"));
    } else {
      toast("error", t("quizWrong"));
    }
  };

  const next = () => {
    if (idx + 1 >= SCENARIOS.length) {
      const pct = Math.round((correct / SCENARIOS.length) * 100);
      setPhase("done");
      recordQuiz(pct);
      notify(
        pct >= 70 ? "success" : "info",
        `Quiz done — ${pct}% scam radar`,
        pct >= (activity.quizBest ?? 0) ? `New best! Badge: ${BADGES.find((b) => pct >= b.min)?.label ?? "Fresh"}` : `Best stays ${activity.quizBest}%`
      );
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  };

  const restart = () => {
    setPhase("intro");
    setIdx(0);
    setPicked(null);
    setCorrect(0);
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <button
        onClick={back}
        className="touch-target inline-flex items-center gap-1.5 rounded-full border border-kline bg-surface px-4 py-2.5 text-[12.5px] font-extrabold text-body hover:bg-kbg"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* ============================ INTRO ============================ */}
      {phase === "intro" && (
        <section className="mt-5 overflow-hidden rounded-3xl bg-tiktok text-white shadow-2xl" aria-label="Scam safety quiz intro">
          <div className="relative p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-tiktok-cyan/20 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-48 w-48 rounded-full bg-tiktok-pink/25 blur-2xl" aria-hidden />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[10.5px] font-extrabold tracking-[0.14em] text-tiktok-cyan ring-1 ring-white/20">
              <GraduationCap className="h-4 w-4" /> SCAM SAFETY SCHOOL
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
              {t("quizTitle")}
            </h1>
            <p className="mt-2.5 max-w-lg text-[13.5px] font-semibold leading-relaxed text-white/75">
              {t("quizSub")}
            </p>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: ShieldAlert, n: "8", label: "Real Nairobi scenarios" },
                { icon: Phone, n: "60s", label: "Faster than one M-Pesa scam" },
                { icon: Trophy, n: `${activity.quizBest ?? 0}%`, label: t("quizBest") },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                  <s.icon className="h-4.5 w-4.5 text-tiktok-cyan" />
                  <p className="mt-2 font-display text-xl font-extrabold">{s.n}</p>
                  <p className="text-[10.5px] font-semibold text-white/60">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPhase("play")}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-display text-[14px] font-extrabold text-[#161616] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-[#161616]" /> {t("quizStart")}
              </button>
              {(activity.quizRuns ?? 0) > 0 && (
                <span className="rounded-full bg-white/10 px-3.5 py-2 text-[11px] font-bold text-white/70 ring-1 ring-white/15">
                  {activity.quizRuns} runs • best {activity.quizBest}%
                </span>
              )}
            </div>
            <p className="mt-5 text-[10.5px] font-semibold text-white/45">
              Free forever • no sign-up • score stays private on this device
            </p>
          </div>
        </section>
      )}

      {/* ============================ PLAY ============================ */}
      {phase === "play" && (
        <section className="mt-5" aria-label="Quiz question">
          {/* progress */}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-kline" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={SCENARIOS.length}>
              <div className="h-full rounded-full bg-gradient-to-r from-trust to-verified transition-all duration-500" style={{ width: `${((idx + (picked ? 1 : 0)) / SCENARIOS.length) * 100}%` }} />
            </div>
            <span className="shrink-0 font-display text-[12px] font-extrabold text-kmuted">
              {idx + 1}/{SCENARIOS.length} • {correct} ✓
            </span>
          </div>

          <div key={SCENARIOS[idx].id} className="view-in mt-5 overflow-hidden rounded-3xl border border-kline bg-surface shadow-lg">
            <header className="flex items-center justify-between gap-3 border-b border-kline bg-kbg px-5 py-3.5">
              <p className="font-display text-[13px] font-extrabold text-body">{SCENARIOS[idx].headline}</p>
              <span className="hidden rounded-full bg-trust-soft px-2.5 py-1 text-[9.5px] font-extrabold text-trust sm:inline">SCENARIO {idx + 1}</span>
            </header>
            <div className="p-5 sm:p-6">
              <p className="text-[13.5px] font-semibold leading-relaxed text-body">{SCENARIOS[idx].body}</p>

              <p className="mt-5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Your call — what do you see?</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                {(["scam", "legit"] as const).map((choice) => {
                  const isPicked = picked === choice;
                  const isAnswer = SCENARIOS[idx].answer === choice;
                  const revealed = picked !== null;
                  return (
                    <button
                      key={choice}
                      onClick={() => pick(choice)}
                      disabled={revealed}
                      aria-pressed={isPicked}
                      className={cn(
                        "touch-target flex items-center justify-center gap-2 rounded-2xl border-2 py-4 font-display text-[14px] font-extrabold transition-all",
                        !revealed && choice === "scam" && "border-scam/40 bg-scam/5 text-scam hover:-translate-y-0.5 hover:bg-scam hover:text-white",
                        !revealed && choice === "legit" && "border-verified/40 bg-verified/5 text-ok-strong hover:-translate-y-0.5 hover:bg-verified hover:text-white",
                        revealed && isAnswer && "border-verified bg-verified text-white pop",
                        revealed && isPicked && !isAnswer && "border-scam bg-scam text-white shake",
                        revealed && !isAnswer && !isPicked && "border-kline opacity-40"
                      )}
                    >
                      {revealed && isAnswer ? <Check className="h-4.5 w-4.5" /> : revealed && isPicked ? <X className="h-4.5 w-4.5" /> : choice === "scam" ? <ShieldAlert className="h-4.5 w-4.5" /> : <ShieldCheck className="h-4.5 w-4.5" />}
                      {choice === "scam" ? t("quizScam") : t("quizLegit")}
                    </button>
                  );
                })}
              </div>

              {/* feedback */}
              {picked && (
                <div className={cn("pop mt-5 rounded-2xl p-4", picked === SCENARIOS[idx].answer ? "bg-verified-soft" : "bg-scam/10")}>
                  <p className={cn("flex items-center gap-1.5 font-display text-[13px] font-extrabold", picked === SCENARIOS[idx].answer ? "text-ok-strong" : "text-scam")}>
                    {picked === SCENARIOS[idx].answer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {picked === SCENARIOS[idx].answer ? t("quizCorrect") : t("quizWrong")}
                  </p>
                  <p className="mt-1.5 text-[12.5px] font-semibold leading-relaxed text-body/85">{SCENARIOS[idx].explain}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[10.5px] font-extrabold text-trust ring-1 ring-kline">
                    <Eye className="h-3 w-3" /> RULE: {SCENARIOS[idx].rule}
                  </p>
                  <button
                    onClick={next}
                    className="touch-target mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-display text-[13px] font-extrabold text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
                  >
                    {idx + 1 >= SCENARIOS.length ? t("quizFinish") : t("quizNext")} <Banknote className="h-4 w-4 text-gold" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================ DONE ============================ */}
      {phase === "done" && (
        <section className="relative mt-5 overflow-hidden rounded-3xl border border-kline bg-surface p-6 text-center shadow-xl sm:p-10" aria-label="Quiz result">
          {isBest && <Confetti />}
          <span className={cn("mx-auto grid h-16 w-16 place-items-center rounded-3xl", badge.cls)}>
            <badge.icon className="h-8 w-8" />
          </span>
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-kmuted">{t("quizScore")}</p>
          <p className="mt-1 font-display text-6xl font-extrabold text-body">
            {scorePct}<span className="text-2xl text-kmuted">%</span>
          </p>
          <p className={cn("mt-2 inline-block rounded-full px-4 py-1.5 font-display text-[14px] font-extrabold", badge.cls)}>
            {scorePct}/{SCENARIOS.length} correct • {badge.label}
          </p>
          <p className="mx-auto mt-3 max-w-md text-[12.5px] font-semibold leading-relaxed text-kmuted">{badge.note}</p>

          {isBest && (
            <p className="pop mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 text-[11px] font-extrabold text-warn-strong">
              <PartyPopper className="h-3.5 w-3.5" /> NEW BEST SCORE!
            </p>
          )}

          {/* score bar */}
          <div className="mx-auto mt-6 max-w-sm">
            <div className="flex justify-between text-[10px] font-extrabold text-kmuted">
              <span>Fresh renter</span><span>Guardian</span><span>Detective</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-gradient-to-r from-scam via-gold to-verified" />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={restart}
              className="touch-target inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12.5px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> {t("quizRetry")}
            </button>
            <button
              onClick={() => navigate("estate")}
              className="touch-target inline-flex items-center gap-2 rounded-full border-2 border-trust bg-trust-soft px-5 py-3 text-[12.5px] font-extrabold text-trust transition-colors hover:bg-trust hover:text-white"
            >
              Browse verified kejas <Smile className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-5 text-[10.5px] font-semibold text-kmuted">
            {(activity.quizRuns ?? 0)} total runs • best {Math.max(scorePct, activity.quizBest ?? 0)}% • private to this device
          </p>
        </section>
      )}
    </div>
  );
}
