/**
 * KEJA HALISI — TikTok Ingest Agent :: VERIFICATION TIER (verify.ts)
 *
 * Every candidate video must pass ALL gates before it earns a listing row.
 * This is the anti-scam core of the agent — a listing that can't be tied to a
 * real Nairobi estate with a plausible price never reaches the catalog.
 *
 * GATES (in order):
 *   G0 DEDUPE        — videoId already in the link index → skip (repost)
 *   G1 REGION        — tikwm reports the poster's region; must be KE or unknown
 *   G2 RENT SIGNAL   — caption must look like a rental post (rent/beds/ksh…)
 *   G3 LOCATION      — caption must resolve to a CANONICAL catalog estate
 *                      (hashtag → aliasMap → fuzzy; empty estate = reject)
 *   G4 PRICE SANITY  — parsed price must be present; bait prices (<50% of the
 *                      estate's avg for the bed type) do NOT auto-approve —
 *                      they land in pending_review for a human admin decision
 *   G5 FEE SIGNAL    — "viewing fee"/"booking fee" in caption → stored with
 *                      the red fee flag (existing UI warns renters)
 *
 * OUTCOME: { verdict: "accept" | "review" | "reject", reason, parsed }
 */
import { parseCaptionToLinkObject, type LinkObject } from "../../src/lib/retrieval";
import { baitPriceCheck, feeDetect } from "../../src/lib/link-validate";
import type { TikTokMeta } from "./resolve";

/** Captions that indicate an actual rental offer (G2). */
const RENT_SIGNAL_RE =
  /rent|ksh|kes\b|\d+\s*k\b|bedsitter|bedroom|bedsitter|apartment|house|unit|vacant|move.?in|available|to.?let|boma|studio/i;

/** Captions that are clearly NOT rentals even if they mention houses. */
const NEGATIVE_RE = /funny|comedy|skit|prank|meme|football|music video|lyrics/i;

export type Verdict = "accept" | "review" | "reject";

export interface Verification {
  verdict: Verdict;
  reason: string;
  linkObject: LinkObject;
  fee: boolean;
  bait: boolean;
}

export function verifyCandidate(meta: TikTokMeta, existingVideoIds: Set<string>): Verification {
  const linkObject = meta.ok
    ? parseCaptionToLinkObject(meta.title, `https://www.tiktok.com/${meta.handle}/video/${meta.videoId}`, {
        title: meta.title,
        thumbnail_url: meta.cover ?? "",
        author_url: meta.handle ? `https://www.tiktok.com/${meta.handle}` : "",
        author_name: meta.authorName ?? "",
        html: "",
        width: 0,
        height: 0,
      })
    : parseCaptionToLinkObject(meta.title, `https://www.tiktok.com/${meta.handle}/video/${meta.videoId}`, null);

  const fee = feeDetect(meta.title);
  const price = linkObject.price;
  const bait = price > 0 ? baitPriceCheck(price, linkObject.estate, linkObject.beds).bait : false;

  // G0 — dedupe against the live link index
  if (existingVideoIds.has(meta.videoId)) {
    return { verdict: "reject", reason: "repost: videoId already indexed", linkObject, fee, bait };
  }

  // G1 — region gate (KE = Kenya). Unknown region passes with a note.
  if (meta.region && meta.region !== "KE") {
    return { verdict: "reject", reason: `region:${meta.region} — not Kenya`, linkObject, fee, bait };
  }

  // G2 — rent signal
  if (!RENT_SIGNAL_RE.test(meta.title) || NEGATIVE_RE.test(meta.title)) {
    return { verdict: "reject", reason: "no rental signal in caption", linkObject, fee, bait };
  }

  // G3 — location gate: caption must map to a canonical catalog estate
  if (!linkObject.estate) {
    return { verdict: "reject", reason: "estate not resolvable from caption", linkObject, fee, bait };
  }

  // G4 — price gate: a listing without any price can't be price-verified
  if (!price) {
    return { verdict: "reject", reason: "no rent price found in caption", linkObject, fee, bait };
  }

  // G5 — bait prices go to human review instead of the green catalog
  if (bait) {
    return { verdict: "review", reason: `bait price — ${price} vs estate avg (pending admin review)`, linkObject, fee, bait };
  }

  return { verdict: "accept", reason: "all gates passed", linkObject, fee, bait };
}
