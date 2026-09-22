// KEJA HALISI — link-only retrieval engine (spec section A)
//
// THE LINK-ONLY LAW: we NEVER store or fetch video/photo bytes. The ONLY TikTok
// endpoint this module ever touches is https://www.tiktok.com/oembed?url={URL},
// which returns the embed iframe HTML string + thumbnail_url + author_url + title.
// Embeds/thumbnails are resolved at RENDER time from the persisted TikTok URL —
// the database only ever holds the link (and the video id derived from it).
//
// Caption parsing derives PUBLIC context only (estate, borough, sub-county, main-road
// cue, price band, beds, amenities, fee signal). The exact door number / house number
// is a product law and is never parsed or displayed — the road cue comes solely from
// the canonical estate entry's mainRoad field.

import { extractVideoId } from "./retrieval-linkid";
import { cached, TTL_OEMBED } from "./cache";
// NOTE: estates-data.ts is the SHARED canonical data module (parallel builder's
// vocabulary: ESTATE_ROWS / BEDS_VOCAB / AMENITIES_VOCAB). src/lib/estates.json
// remains the exact canonical copy in src/lib (md5-identical to upload/Estates.json).
import { AMENITIES_VOCAB, BEDS_VOCAB, ALIAS_MAP, ESTATE_ROWS, type EstateRow } from "./estates-data";

export { extractVideoId };

export type LinkSource = "oembed" | "mock" | "removed";

/** Default agent response time assumption; the API layer refines it per agent. */
export const DEFAULT_RESPONSE_TIME = 30;

/** Canonical beds ids returned by the parser (labels from estates.json beds[]). */
export type BedsCanonical = "Bedsitter" | "1BR" | "2BR" | "3BR" | "";

/** Estate entry type alias matching the shared data module vocabulary. */
type EstateEntry = EstateRow;

/** TikTok oEmbed endpoint payload (metadata only — never the video bytes). */
export interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  html: string;
  [key: string]: unknown;
}

/**
 * A resolved TikTok LINK (no bytes). oembedHtmlLink is the oEmbed embed-iframe HTML
 * string, rendered at view time; thumbnailLink/authorUrl/title are oEmbed metadata.
 */
export interface LinkObject {
  videoId: string;
  tiktokUrl: string;
  oembedHtmlLink: string | null;
  thumbnailLink: string | null;
  authorUrl: string | null;
  title: string | null;
  estate: string;
  borough: string;
  subCounty: string;
  road: string;
  price: number;
  beds: string;
  amenities: string[];
  fee: boolean;
  /** oEmbed exposes no publish time — freshH stays 0 (API layer may enrich). */
  freshH: number;
  responseTime: number;
  source: LinkSource;
}

/** Optional caller-known context so estate+road survive even if oEmbed fails. */
export interface ResolveOpts {
  /** Caption text the client already knows (parsed when oEmbed is unreachable). */
  caption?: string;
  /** Explicit estate name override (wizard already picked one). */
  estate?: string;
  /** Explicit beds override ("Bedsitter" | "1BR" | "2BR" | "3BR"). */
  beds?: string;
  /** Explicit price override (KES). */
  price?: number;
}

const OEMBED_BASE = process.env.TIKTOK_OEMBED_URL || "https://www.tiktok.com/oembed";
const OEMBED_TIMEOUT_MS = 4000;

const FEE_RE = /viewing fee|viewing\s*fee|pay.*before.*view/i;
const PRICE_K_RE = /(\d+(?:\.\d+)?)\s*k\b/i;
const PRICE_CURRENCY_RE = /(?:ksh|kes|\/=|\bsh\b)\s*(\d{3,6})/i;
const HASHTAG_RE = /#([a-z0-9_]+)/gi;

// ---------------------------------------------------------------------------
// Derived, case-normalized lookup tables (built once from estates.json)
// ---------------------------------------------------------------------------

/** Beds aliases sorted longest-first so "one bedroom" wins over shorter aliases. */
const BEDS_ALIASES: { alias: string; canonical: string }[] = BEDS_VOCAB.flatMap((b) =>
  b.aliases.map((a) => ({ alias: a.toLowerCase(), canonical: b.label })),
).sort((a, b) => b.alias.length - a.alias.length);

const ESTATES: EstateEntry[] = ESTATE_ROWS;

/** Case-insensitive estate lookup by exact name (e.g. "Buruburu Phase 1"). */
function findEstateByName(name: string): EstateEntry | null {
  const needle = String(name ?? "").trim().toLowerCase();
  if (!needle) return null;
  return ESTATES.find((e) => e.name.toLowerCase() === needle) ?? null;
}

/** Alias target must exist in the estate index (e.g. "Syokimau" alias target is not in estates[] → ignored). */
function resolveAlias(alias: string): EstateEntry | null {
  const target = ALIAS_MAP[alias.toLowerCase()];
  if (!target) return null;
  return findEstateByName(target);
}

/** "Umoja I" → "umoja", "Buruburu Phase 1" → "buruburu", "Githurai 44" → "githurai". */
function estateBaseName(name: string): string {
  return name.toLowerCase().replace(/\s+(phase\s*\d+|[ivx]+|\d+)$/i, "").trim();
}

/**
 * Word-boundary includes() (no regex lookbehind — tsconfig targets ES2017).
 * A match requires the needle to not touch [a-z0-9] on either side.
 */
function containsWord(haystackLower: string, needleLower: string): boolean {
  if (!needleLower) return false;
  let i = haystackLower.indexOf(needleLower);
  while (i !== -1) {
    const before = i > 0 ? haystackLower.charAt(i - 1) : "";
    const afterIdx = i + needleLower.length;
    const after = afterIdx < haystackLower.length ? haystackLower.charAt(afterIdx) : "";
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
    i = haystackLower.indexOf(needleLower, i + 1);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Caption parsers (public context only)
// ---------------------------------------------------------------------------

/** "12k" → 12000, "12.5k" → 12500; fallback "KSH 15000" → 15000; <1000 non-k values ignored → 0. */
export function parsePrice(caption: string): number {
  const text = String(caption ?? "");
  const kMatch = text.match(PRICE_K_RE);
  if (kMatch) {
    const v = Math.round(parseFloat(kMatch[1]) * 1000);
    // k-values are accepted even when the result is < 1000 (e.g. "1k" → 1000).
    if (v > 0) return v;
  }
  const curMatch = text.match(PRICE_CURRENCY_RE);
  if (curMatch) {
    const v = parseInt(curMatch[1], 10);
    // Ignore stray small numbers (deposits, door refs) — rent is ≥ 1000.
    if (v >= 1000) return v;
  }
  return 0;
}

/** Matches beds[].aliases case-insensitively → canonical "Bedsitter"|"1BR"|"2BR"|"3BR" or "". */
export function parseBeds(caption: string): BedsCanonical {
  const text = ` ${String(caption ?? "").toLowerCase()} `;
  for (const { alias, canonical } of BEDS_ALIASES) {
    if (containsWord(text, alias)) return canonical as BedsCanonical;
  }
  return "";
}

/**
 * Estate resolution:
 *  1. hashtags (#umoja, #umoja_ii) → aliasMap (case-insensitive, underscores stripped),
 *     alias target must exist in the estate index;
 *  2. fallback: fuzzy includes() against estates[].name — longest (most specific) name wins,
 *     then a base-name pass ("Umoja I" → "umoja") for partial mentions;
 *  3. fallback: null (unknown → "").
 */
export function parseEstateEntry(caption: string): EstateEntry | null {
  const text = String(caption ?? "");
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1) hashtags → aliasMap
  HASHTAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HASHTAG_RE.exec(text)) !== null) {
    const tag = m[1].toLowerCase().replace(/_/g, "");
    const direct = resolveAlias(tag);
    if (direct) return direct;
    // progressive: strip a trailing phase/roman/number suffix ("umojaii" → "umoja")
    const trimmed = tag.replace(/(phase\d+|[ivx]+|\d+)$/i, "");
    if (trimmed !== tag && trimmed.length >= 3) {
      const viaTrim = resolveAlias(trimmed);
      if (viaTrim) return viaTrim;
    }
  }

  // 2a) fuzzy full-name includes — longest name wins ("Umoja II" beats "Umoja I")
  let best: EstateEntry | null = null;
  let bestLen = 0;
  for (const e of ESTATES) {
    const name = e.name.toLowerCase();
    if (name.length > bestLen && containsWord(lower, name)) {
      best = e;
      bestLen = name.length;
    }
  }
  if (best) return best;

  // 2b) fuzzy base-name includes ("house in umoja 12k" → Umoja I)
  for (const e of ESTATES) {
    const base = estateBaseName(e.name);
    if (base.length > bestLen && containsWord(lower, base)) {
      best = e;
      bestLen = base.length;
    }
  }
  return best;
}

/** Scans the caption for amenity[].keywords → canonical amenity[].id list (deduped, canonical order). */
export function parseAmenities(caption: string): string[] {
  const text = ` ${String(caption ?? "").toLowerCase()} `;
  const hits: string[] = [];
  for (const amenity of AMENITIES_VOCAB) {
    if (amenity.keywords.some((kw) => containsWord(text, kw.toLowerCase()))) {
      hits.push(amenity.id);
    }
  }
  return hits;
}

/** Viewing-fee signal from the caption — "viewing fee" / "pay before viewing" phrasing. */
export function parseFee(caption: string): boolean {
  return FEE_RE.test(String(caption ?? ""));
}

// ---------------------------------------------------------------------------
// oEmbed fetch (metadata only — NEVER the video bytes)
// ---------------------------------------------------------------------------

/**
 * Fetch TikTok oEmbed metadata for a video URL. Server + client usable.
 * Wrapped in the shared TTL cache (key `oembed:{url}`, TTL 1h). Successes are
 * cached; failures are NOT cached (loader throws → cached() returns the null
 * fallback without storing), so a transient sandbox/network failure retries on
 * the next resolve instead of sticking for an hour.
 * Returns null on any failure (timeout, non-2xx, malformed payload) — never throws.
 */
export async function fetchOEmbed(tiktokUrl: string): Promise<OEmbedResponse | null> {
  const url = String(tiktokUrl ?? "").trim();
  if (!url) return null;
  return cached<OEmbedResponse | null>(
    `oembed:${url}`,
    TTL_OEMBED,
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
      try {
        const res = await fetch(`${OEMBED_BASE}?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`oembed HTTP ${res.status}`);
        const json = (await res.json()) as OEmbedResponse;
        if (!json || typeof json !== "object" || typeof json.html !== "string" || !json.html) {
          throw new Error("oembed payload malformed");
        }
        return json;
      } finally {
        clearTimeout(timer);
      }
    },
    null,
  );
}

// ---------------------------------------------------------------------------
// LinkObject assembly
// ---------------------------------------------------------------------------

/**
 * Parse an oEmbed title/caption into a LinkObject. When `oembed` is null the
 * oEmbed fields stay null (used for caption-only fallback parsing).
 */
export function parseCaptionToLinkObject(
  oembedTitle: string | null | undefined,
  tiktokUrl: string,
  oembed?: OEmbedResponse | null,
): LinkObject {
  const url = String(tiktokUrl ?? "").trim();
  const caption = String(oembedTitle ?? "");
  const estate = parseEstateEntry(caption);
  // freshH: oEmbed exposes no publish timestamp, so freshness cannot be derived
  // from the link — it stays 0 here; the API/listing layer may enrich it.
  return {
    videoId: extractVideoId(url),
    tiktokUrl: url,
    oembedHtmlLink: oembed?.html ?? null,
    thumbnailLink: oembed?.thumbnail_url ?? null,
    authorUrl: oembed?.author_url ?? null,
    title: caption ? caption : null,
    estate: estate?.name ?? "",
    borough: estate?.borough ?? "",
    subCounty: estate?.subCounty ?? "",
    road: estate?.mainRoad ?? "",
    price: parsePrice(caption),
    beds: parseBeds(caption),
    amenities: parseAmenities(caption),
    fee: parseFee(caption),
    freshH: 0,
    responseTime: DEFAULT_RESPONSE_TIME,
    source: "oembed",
  };
}

/**
 * A "removed" LinkObject: the link is gone (404/private) or invalid.
 * With no context this is the empty parse (empty strings, price 0). If the caller
 * supplies opts (caption/tags it already parsed), estate+road+beds+price context is
 * PRESERVED — per spec: "If link 404s, show Source removed but keep estate+road
 * context from parsed tags". Road always comes from the canonical estate entry.
 */
export function removedLinkObject(tiktokUrl: string, opts?: ResolveOpts): LinkObject {
  const url = String(tiktokUrl ?? "").trim();
  const videoId = extractVideoId(url);
  const caption = opts?.caption ?? "";

  let linkObject: LinkObject;
  if (caption) {
    linkObject = parseCaptionToLinkObject(caption, url, null);
    linkObject.source = "removed";
    linkObject.title = null; // no live oEmbed metadata to show
  } else {
    linkObject = {
      videoId,
      tiktokUrl: url,
      oembedHtmlLink: null,
      thumbnailLink: null,
      authorUrl: null,
      title: null,
      estate: "",
      borough: "",
      subCounty: "",
      road: "",
      price: 0,
      beds: "",
      amenities: [],
      fee: false,
      freshH: 0,
      responseTime: DEFAULT_RESPONSE_TIME,
      source: "removed",
    };
  }

  if (opts?.estate) {
    const entry = findEstateByName(opts.estate);
    if (entry) {
      linkObject.estate = entry.name;
      linkObject.borough = entry.borough;
      linkObject.subCounty = entry.subCounty;
      linkObject.road = entry.mainRoad;
    } else {
      linkObject.estate = opts.estate;
    }
  }
  if (opts?.beds) linkObject.beds = opts.beds;
  if (typeof opts?.price === "number" && opts.price > 0) linkObject.price = Math.round(opts.price);
  return linkObject;
}

/**
 * Resolve a TikTok URL into a LinkObject — the single entry point of the
 * link-only retrieval engine.
 *  - No videoId  → source "removed", empty parse (not a resolvable link).
 *  - oEmbed fail → source "removed", caption-less fallback (empty strings, price 0);
 *                  caller-supplied opts keep estate+road context.
 *  - oEmbed ok   → source "oembed", caption parsed from the oEmbed title.
 */
export async function resolveLinkObject(tiktokUrl: string, opts?: ResolveOpts): Promise<LinkObject> {
  const url = String(tiktokUrl ?? "").trim();
  const videoId = extractVideoId(url);
  if (!videoId) return removedLinkObject(url);
  const oembed = await fetchOEmbed(url);
  if (!oembed) return removedLinkObject(url, opts);
  return parseCaptionToLinkObject(oembed.title ?? "", url, oembed);
}
