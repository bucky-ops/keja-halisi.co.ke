"use client";
// KEJA HALISI — PaymentsView: policy bar • escrow • subscriptions • wallet • KRA receipt
import { useEffect, useState } from "react";
import {
  ArrowRight, BadgeCheck, Crown, FileText, Landmark, Receipt, ShieldCheck, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/store";
import { StkModal } from "@/components/keja/modals";

const ESCROW_STEPS = ["User pays", "Held escrow", "Released after viewing confirmed", "Refunded if fake report upheld"];

const ESCROW_FLOW_TEXT =
  "Flow: M-Pesa STK Till 123456 • Held in escrow • Released to agent after viewing confirmed by user • Refunded if fake report upheld • Receipt auto PDF KRA compliant.";

const INVOICES = [{ receipt: "KH-2026-1247", date: "15 May 2026", amount: 999, plan: "Pro" }];

const KRA_LINES = [
  "KEJA HALISI LTD • KRA PIN P051234567X",
  "Receipt # KH-2026-1247 • 15 May 2026",
  "M-Pesa Till 123456 • KES 999 Pro Subscription",
  "Agent @keja_kile • Verified",
  "---------------------------",
  "Total KES 999 • VAT incl • PDF",
];

export default function PaymentsView() {
  const [stk, setStk] = useState<{ open: boolean; amount: number; plan: string }>({ open: false, amount: 999, plan: "Pro Subscription" });
  const [showInvoices, setShowInvoices] = useState(false);

  // StkModal shows its own receipt — surface a toast the moment success renders
  useEffect(() => {
    if (!stk.open) return;
    const obs = new MutationObserver(() => {
      if (document.body.innerText.includes("Payment Success (simulated)")) {
        toast("success", "STK Push simulated • no real payment was made");
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [stk.open]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <h1 className="font-display text-[20px] font-extrabold text-ink">Payments &amp; subscriptions</h1>
      <p className="mt-0.5 text-[12px] text-kmuted">M-Pesa Till 123456 • escrow viewing fee • KRA-compliant receipts</p>

      {/* 1 — policy bar */}
      <section
        className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-verified px-4 py-3 text-white"
        aria-label="Viewing fee policy"
      >
        <p className="text-[12.5px] font-bold leading-relaxed">
          Policy: No viewing fee before viewing — agent cannot ask fee before physical viewing, if does = ban + policy banner on listing.
        </p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#08743A]">ENFORCED</span>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* 2 — escrow card */}
        <section className="rounded-3xl border border-kline bg-card p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
            Viewing commitment fee • optional refundable KES 200-500 • escrow
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {ESCROW_STEPS.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                    i === 0 ? "bg-mpesa/10 text-[#0a7a33]" : i === ESCROW_STEPS.length - 1 ? "bg-pending-soft text-[#92400E]" : "bg-kbg text-ink"
                  )}
                >
                  {s}
                </span>
                {i < ESCROW_STEPS.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-kmuted" aria-hidden />}
              </span>
            ))}
          </div>

          <div className="mt-3 rounded-2xl bg-tiktok px-4 py-3.5 text-[11.5px] leading-relaxed text-white/85">
            {ESCROW_FLOW_TEXT}
          </div>

          <button
            onClick={() => setStk({ open: true, amount: 200, plan: "Viewing commitment • escrow refundable" })}
            className="touch-target mt-4 w-full rounded-full bg-mpesa font-extrabold text-[12.5px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Pay KES 200 Commitment Fee • M-Pesa
          </button>
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-kmuted">
            <ShieldCheck className="h-3.5 w-3.5 text-verified" /> Escrowed money never touches the agent until viewing is confirmed.
          </p>
        </section>

        {/* 4 — wallet panel */}
        <section className="rounded-3xl border border-kline bg-card p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Wallet • balance • pending • paid</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[32px] font-extrabold leading-none text-ink">KES 12,400</p>
              <p className="mt-1.5 text-[11.5px] text-kmuted">Till 123456 • Pending 2,100 • Paid 48,900</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mpesa/10">
              <Wallet className="h-5 w-5 text-mpesa" />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => toast("success", "Payout KES 12,400 requested")}
              className="touch-target rounded-full bg-ink font-extrabold text-[12px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Payout Request
            </button>
            <button
              onClick={() => setShowInvoices((v) => !v)}
              className="touch-target rounded-full border border-kline font-extrabold text-[12px] text-ink hover:bg-kbg"
            >
              Invoices
            </button>
          </div>

          {showInvoices && (
            <ul className="mt-3 space-y-1.5">
              {INVOICES.map((inv) => (
                <li key={inv.receipt} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-kbg px-3.5 py-2.5 font-mono text-[11px] text-ink/85">
                  <span>{inv.receipt} • {inv.date}</span>
                  <span className="font-sans font-bold">
                    {inv.plan} KES {inv.amount.toLocaleString("en-KE")} <BadgeCheck className="inline h-3.5 w-3.5 text-verified" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 3 — subscription cards */}
      <section className="mt-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-kmuted">Subscriptions • listings quota &amp; badges</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-3xl border border-kline bg-card p-5">
            <p className="font-display text-[14px] font-extrabold text-ink">Free</p>
            <p className="mt-1 font-display text-[24px] font-extrabold text-ink">KES 0</p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-ink/80">
              <li>• 3 listings</li>
              <li>• Basic badge</li>
              <li>• Community support</li>
            </ul>
            <button disabled className="touch-target mt-4 w-full cursor-not-allowed rounded-full border border-kline font-extrabold text-[12px] text-kmuted">
              Current plan
            </button>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl border border-kline bg-card p-5 ring-2 ring-trust">
            <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-[9.5px] font-extrabold text-ink shadow">
              MOST POPULAR
            </span>
            <p className="flex items-center gap-1.5 font-display text-[14px] font-extrabold text-ink">
              Pro <Crown className="h-4 w-4 text-gold" aria-hidden />
            </p>
            <p className="mt-1 font-display text-[24px] font-extrabold text-ink">
              KES 999 <span className="text-[12px] font-semibold text-kmuted">/month</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-ink/80">
              <li>• 20 listings</li>
              <li>• Gold badge 👑</li>
              <li>• Top search placement</li>
              <li>• Analytics</li>
              <li>• M-Pesa STK</li>
            </ul>
            <button
              onClick={() => setStk({ open: true, amount: 999, plan: "Pro Subscription • 20 listings + Gold" })}
              className="touch-target mt-4 w-full rounded-full bg-mpesa font-extrabold text-[12px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Pay with M-Pesa
            </button>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl border border-kline bg-card p-5">
            <p className="flex items-center gap-1.5 font-display text-[14px] font-extrabold text-ink">
              Enterprise <Landmark className="h-4 w-4 text-trust" aria-hidden />
            </p>
            <p className="mt-1 font-display text-[24px] font-extrabold text-ink">
              KES 4,999 <span className="text-[12px] font-semibold text-kmuted">/month</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-ink/80">
              <li>• 100 listings</li>
              <li>• Developer project</li>
              <li>• API access</li>
              <li>• Dedicated support</li>
            </ul>
            <button
              onClick={() => toast("info", "Enterprise — sales will WhatsApp you within 1 day (demo)")}
              className="touch-target mt-4 w-full rounded-full bg-ink font-extrabold text-[12px] text-white"
            >
              Contact sales
            </button>
          </div>
        </div>
      </section>

      {/* 5 — KRA receipt card */}
      <section className="mt-6 rounded-3xl border border-kline bg-card p-5">
        <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-kmuted">
          <Receipt className="h-3.5 w-3.5" /> KRA receipt • auto PDF
        </p>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-kbg px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-ink/90 keja-scroll">
{KRA_LINES.join("\n")}
        </pre>
        <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-kmuted">
          <FileText className="h-3.5 w-3.5" /> Every STK payment writes an immutable Payment row + receipt PDF (KRA e-TIMS slot).
        </p>
      </section>

      {/* STK modal */}
      <StkModal
        open={stk.open}
        amount={stk.amount}
        plan={stk.plan}
        onClose={() => setStk((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
