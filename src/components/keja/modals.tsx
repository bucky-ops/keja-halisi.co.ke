"use client";
// KEJA HALISI — modals: Report Scam • Contact (masked phone) • M-Pesa STK simulation
import { useEffect, useRef, useState } from "react";
import { Flag, X, Phone, MessageCircle, ShieldCheck, Smartphone, CheckCircle2, Receipt, PartyPopper, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_REASONS, kes } from "@/lib/nairobi";
import { toast } from "@/lib/store";
import { submitReport, logLead, stkPush } from "./api";
import type { ListingDTO } from "@/lib/types";

/* ---------------- Report Modal ---------------- */
export function ReportModal({
  listing,
  open,
  onClose,
}: {
  listing: ListingDTO | null;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setReason(""); setDetails(""); }
  }, [open]);

  if (!open || !listing) return null;

  const submit = async () => {
    if (!reason) { toast("warning", "Choose a report reason first"); return; }
    setBusy(true);
    try {
      const r = await submitReport(listing.id, reason, details);
      toast(
        "success",
        r.autoHidden
          ? `Thanks! Review in 1h — listing hidden after 3 reports`
          : `Reported: ${reason} • Audit log created • Review queued`
      );
      onClose();
    } catch {
      toast("error", "Report failed — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-[440px]">
      <ModalHeader title="Report Scam" onClose={onClose} accent="text-scam" />
      <div className="rounded-xl bg-scam-soft border border-scam/25 px-3.5 py-2.5 text-[11.5px] font-semibold text-[#9F2020]">
        Report concrete problems: already rented, fake price, fake location, viewing fee, or duplicate/reposted video.
      </div>
      <div className="mt-3 space-y-1.5" role="radiogroup" aria-label="Report reason">
        {REPORT_REASONS.map((r) => (
          <label
            key={r.value}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition-colors",
              reason === r.value ? "border-scam bg-scam-soft text-[#9F2020]" : "border-kline hover:bg-kbg"
            )}
          >
            <input
              type="radio"
              name="report-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="accent-scam"
            />
            <Flag className="h-3.5 w-3.5 shrink-0" />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Details... (optional) Sheng allowed"
        rows={3}
        className="mt-3 w-full rounded-xl border border-kline bg-white px-3.5 py-2.5 text-[12.5px] outline-none focus:border-trust focus:ring-4 focus:ring-trust/10"
      />
      <div className="mt-3 flex gap-2">
        <button onClick={onClose} className="touch-target flex-1 rounded-full border border-kline font-bold text-[12.5px] hover:bg-kbg">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="touch-target flex-1 rounded-full bg-scam font-extrabold text-[12.5px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Submitting..." : "Submit Report"}
        </button>
      </div>
      <p className="mt-2.5 text-center text-[10px] text-kmuted">After 3 reports, listing auto-hides + agent review.</p>
    </ModalShell>
  );
}

/* ---------------- Contact Modal (masked phone) ---------------- */
export function ContactModal({
  listing,
  open,
  onClose,
  onLeadLogged,
}: {
  listing: ListingDTO | null;
  open: boolean;
  onClose: () => void;
  onLeadLogged?: (action: "call" | "whatsapp") => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setRevealed(false);
  }, [open]);

  if (!open || !listing) return null;
  const masked = "07** *** " + listing.poster.phone.slice(-3);

  const reveal = async () => {
    setBusy(true);
    try {
      await logLead(listing.id, "call");
      setRevealed(true);
      onLeadLogged?.("call");
      toast("success", "Phone masked until contact • Lead logged • Response time tracked");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-[380px]">
      <ModalHeader title="Contact • Phone masked until contact" onClose={onClose} />
      <div className="rounded-2xl bg-ink p-4 text-white">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
          {listing.poster.role} • ~{listing.poster.responseTime}min response
        </p>
        <p className="mt-2 font-display text-2xl font-extrabold tracking-wide">
          {revealed ? listing.poster.phone : masked}
        </p>
        <p className="mt-2 text-[10.5px] leading-relaxed text-white/60">
          {revealed ? "Revealed after lead logged • audit_events updated" : "Exact number masked • Lead logged on reveal • OTP verified"}
        </p>
      </div>
      <div className="mt-3 rounded-xl bg-verified-soft border border-verified/20 px-3 py-2.5 text-[11px] font-semibold text-[#0a6b40]">
        Trust checks: phone verified • evidence video • no fee rule • re-check enabled
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={reveal}
          disabled={revealed || busy}
          className="touch-target flex items-center justify-center gap-1.5 rounded-full bg-safaricom font-extrabold text-[12px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          <Phone className="h-3.5 w-3.5" /> {revealed ? "Lead logged ✓" : busy ? "Logging..." : "Log Lead • Reveal"}
        </button>
        <a
          href={revealed ? `https://wa.me/${listing.poster.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw your keja in ${listing.estate} on Keja Halisi`)}` : "#"}
          onClick={(e) => {
            if (!revealed) { e.preventDefault(); toast("warning", "Log the lead first — phone masked until contact"); }
            else { onLeadLogged?.("whatsapp"); toast("success", `WhatsApp • wa.me lead logged • ${listing.estate}`); }
          }}
          className="touch-target flex items-center justify-center gap-1.5 rounded-full bg-wa font-extrabold text-[12px] text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </div>
      <button onClick={onClose} className="touch-target mt-2 w-full rounded-full border border-kline font-bold text-[12.5px] hover:bg-kbg">
        Close
      </button>
    </ModalShell>
  );
}

/* ---------------- M-Pesa STK Modal (simulated) ---------------- */
const STK_STEPS = [
  { title: "Phone entered", sub: "Masked • OTP verified", amount: true },
  { title: "STK Push sent", sub: "Check phone • Till 123456", buzz: true },
  { title: "Enter M-Pesa PIN", sub: "Escrow refundable commitment", },
  { title: "Success • Receipt", sub: "No real payment was made", done: true },
];

export function StkModal({
  open,
  onClose,
  amount = 999,
  plan = "Pro Subscription",
  phone: initialPhone = "",
}: {
  open: boolean;
  onClose: () => void;
  amount?: number;
  plan?: string;
  phone?: string;
}) {
  const [phone, setPhone] = useState(initialPhone || "07");
  const [step, setStep] = useState(-1); // -1 = form
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) { setStep(-1); setReceipt(null); setPhone(initialPhone || "07"); }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [open, initialPhone]);

  useEffect(() => {
    // auto-advance simulation steps every 900ms once started
    if (step >= 0 && step < STK_STEPS.length - 1) {
      timer.current = setTimeout(() => setStep((s) => s + 1), 900);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [step]);

  if (!open) return null;

  const start = async () => {
    if (!/^(\+?254|0)7\d{8}$/.test(phone.replace(/\s/g, ""))) {
      toast("error", "Enter a valid Safaricom number 07XXXXXXXX");
      return;
    }
    setBusy(true);
    setStep(0);
    try {
      const r = await stkPush({ phone, amount, plan, kind: plan.includes("Escrow") ? "escrow" : "subscription" });
      setReceipt(r.receipt);
    } catch {
      toast("error", "STK simulation failed");
      setStep(-1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-[380px]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mpesa/10">
          <Smartphone className="h-5 w-5 text-mpesa" />
        </span>
        <div>
          <h3 className="font-display text-[15px] font-extrabold text-ink">M-Pesa STK Push</h3>
          <p className="text-[10.5px] font-semibold text-kmuted">Till 123456 • Safaricom Green #12B44A</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="touch-target ml-auto grid place-items-center rounded-full hover:bg-kbg">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* progress */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-mpesa transition-all duration-500"
          style={{ width: `${((step + 2) / (STK_STEPS.length + 1)) * 100}%` }}
        />
      </div>

      {step === -1 ? (
        <div className="mt-4">
          <label className="text-[10.5px] font-extrabold uppercase tracking-wide text-kmuted">M-Pesa number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="07XX XXX XXX"
            className="mt-1.5 w-full rounded-2xl border border-kline px-4 py-3 font-display text-[15px] font-bold outline-none focus:border-mpesa focus:ring-4 focus:ring-mpesa/10"
          />
          <div className="mt-3 rounded-2xl bg-kbg p-3.5">
            <p className="font-display text-[15px] font-extrabold text-ink">{kes(amount)}</p>
            <p className="text-[11px] text-kmuted">{plan} • simulated — no real payment</p>
          </div>
          <button
            onClick={start}
            disabled={busy}
            className="touch-target mt-3 w-full rounded-full bg-mpesa font-extrabold text-[13px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Sending..." : "Trigger STK Simulation"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {STK_STEPS.map((s, i) => {
            const active = i === step;
            const done = i < step || (s.done && i === step && receipt);
            return (
              <div
                key={s.title}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all",
                  active && !done ? "border-verified/30 bg-verified-soft" : done ? "border-ink bg-ink text-white" : "border-kline opacity-45"
                )}
              >
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold", done ? "bg-verified text-white" : active ? "bg-verified/20 text-verified" : "bg-black/10")}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold">{s.title}</p>
                  <p className={cn("text-[10.5px]", done ? "text-white/70" : "text-kmuted")}>{s.sub}</p>
                </div>
                {active && s.buzz && <Smartphone className="ml-auto h-4 w-4 shrink-0 text-verified buzz" />}
              </div>
            );
          })}
          {receipt && (
            <div className="pop rounded-2xl border border-verified/30 bg-verified-soft p-3.5">
              <p className="flex items-center gap-2 text-[12px] font-extrabold text-[#08743A]">
                <PartyPopper className="h-4 w-4" /> Payment Success (simulated)
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-[#0a6b40]">
                KEJA HALISI LTD • KRA PIN P051234567X<br />
                Receipt # {receipt}<br />
                M-Pesa Till 123456 • {kes(amount)} • {plan}<br />
                ---------------------------<br />
                Total {kes(amount)} • VAT incl • PDF ready
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#9F2020]">
                <Receipt className="h-3 w-3" /> STK Push simulated • no real payment was made
              </p>
            </div>
          )}
          <button onClick={onClose} className="touch-target w-full rounded-full border border-kline font-bold text-[12.5px] hover:bg-kbg">
            Close • Simulation only
          </button>
        </div>
      )}
      <p className="mt-3 text-center text-[9.5px] leading-relaxed text-kmuted">
        Publishing rules: No viewing fee before viewing • Public UI estate+road only • Unverified out of green catalog • Re-check expiry
      </p>
    </ModalShell>
  );
}

/* ---------------- shared shell ---------------- */
function ModalShell({ children, onClose, className }: { children: React.ReactNode; onClose: () => void; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn("slide-up max-h-[90vh] w-full overflow-y-auto keja-scroll rounded-3xl bg-white p-5 shadow-2xl", className)}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose, accent = "text-ink" }: { title: string; onClose: () => void; accent?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className={cn("font-display text-[16px] font-extrabold", accent)}>{title}</h3>
      <button onClick={onClose} aria-label="Close" className="touch-target grid place-items-center rounded-full hover:bg-kbg">
        <X className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
