"use client";
// KEJA HALISI — verification badges + trust pills (all brand states)
import { BadgeCheck, Crown, Store, Clock, Flag, ShieldCheck, Phone, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/lib/types";

export function VerifiedBadge({ className, label = "Verified" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-verified-soft border border-verified/25 text-ok px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3" /> {label}
    </span>
  );
}

export function GoldBadge({ className, label = "Gold Developer" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "badge-shimmer relative inline-flex items-center gap-1 overflow-hidden rounded-full bg-gold/25 border border-gold/50 text-warn px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <Crown className="h-3 w-3" /> {label}
    </span>
  );
}

export function CaretakerBadge({ className, label = "Caretaker" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-trust-soft border border-trust/25 text-trust px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <Store className="h-3 w-3" /> {label}
    </span>
  );
}

export function PendingBadge({ className, label = "Pending review" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-pending-soft border border-pending/25 text-warn-strong px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <Clock className="h-3 w-3 pulse-dot" /> {label}
    </span>
  );
}

export function ScamBadge({ className, label = "Reported" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-scam-soft border border-scam/25 text-danger-strong px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <Flag className="h-3 w-3" /> {label}
    </span>
  );
}

export function NoFeeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-trust-soft border border-trust/20 text-trust px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" /> No Fee
    </span>
  );
}

export function FreshBadge({ hours, className }: { hours: number; className?: string }) {
  if (hours > 24) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ink/85 text-white px-2 py-0.5 text-[10.5px] font-bold backdrop-blur-sm",
        className
      )}
    >
      <Zap className="h-3 w-3 text-tiktok-cyan" /> Fresh • {hours < 1 ? "<1" : Math.round(hours)}h ago
    </span>
  );
}

export function FeeWarningBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-scam text-white px-2 py-0.5 text-[10.5px] font-extrabold",
        className
      )}
    >
      <Flag className="h-3 w-3" /> Fee signal
    </span>
  );
}

export function VerificationBadge({ status, role }: { status: VerificationStatus; role?: string }) {
  if (status === "gold") return <GoldBadge label={role === "Developer" ? "Gold Developer" : "Gold"} />;
  if (status === "caretaker") return <CaretakerBadge />;
  if (status === "verified") return <VerifiedBadge />;
  if (status === "rejected") return <ScamBadge label="Rejected" />;
  return <PendingBadge />;
}

/** Trust checks notice — green bar shown on listing detail */
export function TrustChecksNotice({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-verified-soft border border-verified/20 px-3.5 py-3", className)}>
      <p className="flex items-center gap-2 text-[12px] font-bold text-ok">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Trust checks
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ok-strong">
        phone verified • evidence video • no viewing fee rule • re-check enabled
      </p>
    </div>
  );
}

/** Privacy notice — dark bar: exact house number intentionally hidden */
export function PrivacyNotice({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-ink text-white px-3.5 py-3", className)}>
      <p className="flex items-center gap-2 text-[12px] font-bold">
        <Phone className="h-4 w-4 shrink-0 text-tiktok-cyan" />
        Exact house number intentionally not shown
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-white/70">
        Public UI shows estate + road only. Private vault stores the exact door. Phone masked until contact.
      </p>
    </div>
  );
}

/** Fee warning — red bar when fee signal exists */
export function FeeWarning({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-scam-soft border border-scam/30 px-3.5 py-3", className)} role="alert">
      <p className="flex items-center gap-2 text-[12px] font-extrabold text-danger-strong">
        <Flag className="h-4 w-4 shrink-0" />
        Viewing-fee signal exists
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-danger-strong/90">
        Treat as a warning and report if the agent asks you to pay before viewing. Filter “No Viewing Fee” to hide.
      </p>
    </div>
  );
}
