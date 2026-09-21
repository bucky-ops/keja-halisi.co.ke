// KEJA HALISI — Keja Trust Score (client-safe, explainable anti-scam score)
// 0-100 per listing, computed from signals a renter can verify themselves.
// No network calls — pure function so listing cards can use it too.

import type { ListingDTO } from "@/lib/types";

export type TrustBand = "strong" | "decent" | "check" | "risk";

export interface TrustPart {
  key: string;
  label: string;
  note: string;
  got: number;
  max: number;
}

export interface TrustScore {
  score: number; // 0-100
  band: TrustBand;
  parts: TrustPart[];
}

export const TRUST_BANDS: Record<
  TrustBand,
  { label: string; hint: string; text: string; chip: string; ring: string; stroke: [string, string] }
> = {
  strong: {
    label: "Strong trust",
    hint: "Multiple green signals line up — still do the 5-point check on arrival.",
    text: "text-ok-strong",
    chip: "bg-verified-soft text-ok-strong",
    ring: "text-verified",
    stroke: ["#0E9F6E", "#00B140"],
  },
  decent: {
    label: "Decent trust",
    hint: "Mostly green with a couple of gaps — verify those gaps on the call.",
    text: "text-trust",
    chip: "bg-trust-soft text-trust",
    ring: "text-trust",
    stroke: ["#1976D2", "#00B140"],
  },
  check: {
    label: "Check twice",
    hint: "Real gaps in the trust chain — ask hard questions before any payment.",
    text: "text-warn-strong",
    chip: "bg-pending-soft text-warn-strong",
    ring: "text-pending",
    stroke: ["#C27803", "#E0A104"],
  },
  risk: {
    label: "High risk",
    hint: "Several scam signals — we recommend skipping or reporting this keja.",
    text: "text-scam",
    chip: "bg-scam/10 text-scam",
    ring: "text-scam",
    stroke: ["#E02424", "#FF5A5A"],
  },
};

/**
 * Deterministic trust score:
 *  agent tier 25 · no viewing fee 18 · freshness 12 · price honesty (fair-price band) 15
 *  reports 12 · response speed 10 · photos+specs 8
 * A listing that fails the publish gate (evidence 5/5, admin approve) never reaches the client,
 * so those two are implicitly satisfied — the score communicates what a renter can still check.
 */
export function computeTrustScore(l: ListingDTO, fairBand?: "bait" | "below" | "fair" | "above" | "high" | null): TrustScore {
  const tier =
    l.poster.verificationStatus === "gold" ? 25 :
    l.poster.verificationStatus === "verified" ? 21 :
    l.poster.verificationStatus === "caretaker" ? 17 :
    l.poster.verificationStatus === "pending" ? 8 : 0;

  const fee = l.fee ? 0 : 18;

  const fresh = l.freshH <= 24 ? 12 : l.freshH <= 72 ? 9 : l.freshH <= 168 ? 6 : 3;

  const price =
    fairBand === "fair" ? 15 :
    fairBand === "below" ? 12 :
    fairBand === "above" ? 9 :
    fairBand === "bait" ? 0 :
    fairBand === "high" ? 4 : 9; // unknown band → neutral middle

  const reports = l.reportsCount === 0 ? 12 : l.reportsCount === 1 ? 7 : l.reportsCount === 2 ? 2 : 0;

  const speed = l.responseTime <= 15 ? 10 : l.responseTime <= 30 ? 7 : l.responseTime <= 60 ? 5 : 3;

  const detail = (l.photos.length >= 3 ? 5 : 3) + (l.sizeSqm ? 2 : 0) + (l.floor ? 1 : 0);

  const parts: TrustPart[] = [
    { key: "tier", label: "Agent verification", note: l.poster.verificationStatus === "gold" ? "Gold tier — ID + TikTok history + referrals" : l.poster.verificationStatus === "verified" ? "Green tick — ID + selfie verified" : l.poster.verificationStatus === "caretaker" ? "Caretaker — mandate letter verified" : "Pending review — proof uploaded", got: tier, max: 25 },
    { key: "fee", label: "No viewing fee", note: l.fee ? "Fee signal detected — viewing fees before viewing are banned" : "Free viewing confirmed — hakuna kulipa", got: fee, max: 18 },
    { key: "price", label: "Price honesty", note: fairBand === "bait" ? "Price far below market — likely bait" : fairBand === "fair" ? "In line with live comps" : fairBand === "above" ? "Above typical market range" : "Within acceptable range", got: price, max: 15 },
    { key: "fresh", label: "Freshness", note: l.freshH <= 24 ? "Posted within 24h — seller still responsive" : `Posted ${Math.round(l.freshH)}h ago — may already be taken`, got: fresh, max: 12 },
    { key: "reports", label: "Community reports", note: l.reportsCount === 0 ? "No reports against this keja" : `${l.reportsCount} report(s) — auto-hides at 3`, got: reports, max: 12 },
    { key: "speed", label: "Response speed", note: `Agent replies in ~${l.responseTime}min`, got: speed, max: 10 },
    { key: "detail", label: "Evidence detail", note: "Walkthrough photos + specs filled in", got: detail, max: 8 },
  ];

  const score = Math.max(0, Math.min(100, parts.reduce((s, p) => s + p.got, 0)));
  const band: TrustBand = score >= 80 ? "strong" : score >= 62 ? "decent" : score >= 42 ? "check" : "risk";
  return { score, band, parts };
}

/** compact pill tone for cards (score → color class) */
export function scoreChipCls(score: number): string {
  if (score >= 80) return "bg-verified-soft text-ok-strong";
  if (score >= 62) return "bg-trust-soft text-trust";
  if (score >= 42) return "bg-pending-soft text-warn-strong";
  return "bg-scam/10 text-scam";
}
