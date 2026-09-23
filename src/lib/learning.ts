// KEJA HALISI — learning loop (D): localStorage link IDs ONLY, zero personal data to server
// Keys: kh_viewed, kh_saved, kh_called, kh_reported → string[] of TikTok videoIds
// Affinity: kh_affinity → { estate: Record<string,number>, bucket: Record<string,number>, amenity: Record<string,number> }
// Clearing storage (kh_reset button) resets learning instantly.

import { extractVideoId } from "@/lib/retrieval-linkid";

const K_VIEWED = "kh_viewed";
const K_SAVED = "kh_saved";
const K_CALLED = "kh_called";
const K_REPORTED = "kh_reported";
const K_AFFINITY = "kh_affinity";
const K_TRENDING = "kh_trending"; // anonymous oEmbed-resolve counts per videoId

export interface Affinity {
  estate: Record<string, number>;
  bucket: Record<string, number>;
  amenity: Record<string, number>;
}

type BucketFn = (price: number) => string;

function readArr(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeArr(key: string, arr: string[]) {
  if (typeof window === "undefined") return;
  try {
    // cap memory — keep the most recent 200 link ids
    window.localStorage.setItem(key, JSON.stringify(arr.slice(-200)));
  } catch {
    /* storage full / private mode — learning silently off */
  }
}

function readAffinity(): Affinity {
  if (typeof window === "undefined") return { estate: {}, bucket: {}, amenity: {} };
  try {
    const v = JSON.parse(window.localStorage.getItem(K_AFFINITY) || "null");
    if (v && v.estate && v.bucket && v.amenity) return v as Affinity;
  } catch { /* ignore */ }
  return { estate: {}, bucket: {}, amenity: {} };
}

function writeAffinity(a: Affinity) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(K_AFFINITY, JSON.stringify(a));
  } catch { /* ignore */ }
}

/** TikTok videoId from a listing URL (stable link id); falls back to listing id. */
export function linkIdOf(listing: { tiktokUrl: string; id: string }): string {
  return extractVideoId(listing.tiktokUrl) || listing.id;
}

function bump(list: string[], id: string) {
  if (!list.includes(id)) list.push(id);
}

/** Record an interaction on a link. kind drives which kh_* list + affinity maps update. */
export function recordInteraction(
  listing: { tiktokUrl: string; id: string; estate: string; price: number; amenities: string[] },
  kind: "view" | "save" | "call" | "report",
  priceBucket?: BucketFn,
) {
  const id = linkIdOf(listing);
  const key = kind === "view" ? K_VIEWED : kind === "save" ? K_SAVED : kind === "call" ? K_CALLED : K_REPORTED;
  const arr = readArr(key);
  const isNew = !arr.includes(id);
  bump(arr, id);
  writeArr(key, arr);

  // affinity grows only on NEW interactions (re-taps don't inflate)
  if (isNew) {
    const a = readAffinity();
    a.estate[listing.estate] = (a.estate[listing.estate] || 0) + 1;
    if (priceBucket) {
      const b = priceBucket(listing.price);
      a.bucket[b] = (a.bucket[b] || 0) + 1;
    }
    for (const am of listing.amenities || []) a.amenity[am] = (a.amenity[am] || 0) + 1;
    writeAffinity(a);
  }
  return { id, first: isNew };
}

/** Anonymous popularity — counts link opens per videoId (device-local aggregate). */
export function bumpTrending(listing: { tiktokUrl: string; id: string }) {
  if (typeof window === "undefined") return;
  const id = linkIdOf(listing);
  try {
    const t = JSON.parse(window.localStorage.getItem(K_TRENDING) || "{}") as Record<string, number>;
    t[id] = (t[id] || 0) + 1;
    window.localStorage.setItem(K_TRENDING, JSON.stringify(t));
  } catch { /* ignore */ }
}

export function trendingCount(listing: { tiktokUrl: string; id: string }): number {
  if (typeof window === "undefined") return 0;
  try {
    const t = JSON.parse(window.localStorage.getItem(K_TRENDING) || "{}") as Record<string, number>;
    return t[linkIdOf(listing)] || 0;
  } catch { return 0; }
}

/** Personalization boost for search scoring (D): saved estate +25, called bucket +15. */
export function personalizationBoost(listing: { tiktokUrl: string; id: string; estate: string; price: number }, priceBucket?: BucketFn): number {
  let boost = 0;
  const saved = readArr(K_SAVED);
  const called = readArr(K_CALLED);
  const viewed = readArr(K_VIEWED);
  const id = linkIdOf(listing);
  // exact link re-engagement
  if (saved.includes(id)) boost += 25;
  else if (viewed.includes(id)) boost += 8;
  // affinity boost — this listing's estate is in your saved links
  const a = readAffinity();
  const estateScore = a.estate[listing.estate] || 0;
  const inSavedEstates = saved.length > 0 && estateScore > 0;
  if (inSavedEstates) boost += 25;
  if (priceBucket) {
    const b = priceBucket(listing.price);
    if (called.length > 0 && (a.bucket[b] || 0) > 0) boost += 15;
  }
  return boost;
}

/** UI stats for the Saved view "Learning" card. */
export function getLearningStats(priceBucket?: BucketFn) {
  const viewed = readArr(K_VIEWED);
  const saved = readArr(K_SAVED);
  const called = readArr(K_CALLED);
  const reported = readArr(K_REPORTED);
  const a = readAffinity();
  const top = (m: Record<string, number>): [string, number] | null => {
    const e = Object.entries(m).sort((x, y) => y[1] - x[1])[0];
    return e ? [e[0], e[1]] : null;
  };
  return {
    viewed: viewed.length,
    saved: saved.length,
    called: called.length,
    reported: reported.length,
    topEstate: top(a.estate),
    topBucket: top(a.bucket),
    topAmenity: top(a.amenity),
  };
}

/** Wipe every kh_* key — instant reset. */
export function clearLearning() {
  if (typeof window === "undefined") return;
  for (const k of [K_VIEWED, K_SAVED, K_CALLED, K_REPORTED, K_AFFINITY, K_TRENDING]) {
    try { window.localStorage.removeItem(k); } catch { /* ignore */ }
  }
}
