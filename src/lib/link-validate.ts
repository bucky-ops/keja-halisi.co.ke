// KEJA HALISI — link-only input validation (spec: VALIDATION ON INPUT)
//
// Pure helpers shared by /api/listings/resolve and /api/listings/create:
//   • TikTok URL format gate        /tiktok.com/@.*/video/\d+/
//   • Bait-price detector           price < 50% of estate avgPrice[beds] → yellow
//   • Repost detector               videoId already in the link index → red
//   • Fee-signal detector           caption contains "viewing fee"/"booking fee"
//
// NOTHING here touches media bytes — strings and numbers only.

import { ALIAS_MAP, ESTATE_ROWS, type EstateRow } from "./estates-data";
import { extractVideoId } from "./retrieval-linkid";

export const TIKTOK_URL_RE =
  /^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+(?:[/?#].*)?$/i;

export function validateTikTokUrl(url: string): { ok: boolean; videoId: string; handle: string } {
  const clean = String(url ?? "").trim();
  const ok = TIKTOK_URL_RE.test(clean);
  return { ok, videoId: ok ? extractVideoId(clean) : "", handle: clean.match(/@([\w.\-]+)/)?.[1] ?? "" };
}

/** Canonical estate row by name (case-insensitive) or alias shorthand ("kile"). */
export function findEstate(nameOrAlias: string): EstateRow | null {
  const key = String(nameOrAlias ?? "").trim().toLowerCase();
  if (!key) return null;
  const canonical = ALIAS_MAP[key] ?? key;
  return ESTATE_ROWS.find((e) => e.name.toLowerCase() === canonical) ?? null;
}

export interface BaitResult {
  bait: boolean;
  pctOfAvg: number; // price ÷ estate-avg — UI shows "62% of estate average"
  label: string; // e.g. "Bait? 1BR Kileleshwa 8k — 23% of estate average"
}

/**
 * Price-anomaly detector: flag when the asking price is under 50% of the
 * canonical estate average for that beds type (yellow tag, not a block).
 */
export function baitPriceCheck(price: number, estateName: string, beds: string): BaitResult {
  const estate = findEstate(estateName);
  const p = Number(price) || 0;
  if (!estate || !p || !beds) return { bait: false, pctOfAvg: 100, label: "" };
  const avg = estate.avgPrice?.[beds as keyof typeof estate.avgPrice] ?? 0;
  if (!avg) return { bait: false, pctOfAvg: 100, label: "" };
  const pct = Math.round((p / avg) * 100);
  if (pct >= 50) return { bait: false, pctOfAvg: pct, label: "" };
  return {
    bait: true,
    pctOfAvg: pct,
    label: `Bait? ${beds} ${estate.name} ${p.toLocaleString("en-KE")}k-looking — only ${pct}% of estate average (${(avg / 1000).toFixed(0)}k)`,
  };
}

/** Fee-signal keywords per spec: "viewing fee" or "booking fee" → fee=true.
 *  NEGATIONS respected: "no viewing fee" / "hakuna viewing fee" / "zero booking fee" → fee=false. */
const FEE_SIGNAL_RE = /viewing\s*fee|booking\s*fee|pay.*before.*view/i;
const FEE_NEGATION_RE = /\b(?:no|hakuna|zero|without|free)\s+(?:viewing\s*fee|booking\s*fee|fee)\b/i;
export function feeDetect(caption: string): boolean {
  const c = String(caption ?? "");
  if (!FEE_SIGNAL_RE.test(c)) return false;
  return !FEE_NEGATION_RE.test(c);
}

export interface RepostMatch {
  repost: boolean;
  videoId: string;
  matchHandle: string;
  pct: number;
  label: string;
}

/**
 * Repost detector — if the videoId already exists in the link index (from any
 * poster), warn "Repost 80% match @otheragent". pct is kept at 80 for a same
 * videoId collision (same video = same content), per spec wording.
 */
export function repostCheck(
  videoId: string,
  existing: { tiktokUrl: string; poster: { tiktokHandle: string } } | null,
): RepostMatch {
  if (!videoId || !existing) {
    return { repost: false, videoId, matchHandle: "", pct: 0, label: "" };
  }
  const other = existing.poster?.tiktokHandle ?? "@unknown";
  return {
    repost: true,
    videoId,
    matchHandle: other,
    pct: 80,
    label: `Repost 80% match ${other} — same videoId already in the index`,
  };
}
