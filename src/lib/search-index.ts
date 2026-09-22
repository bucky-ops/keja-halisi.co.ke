// KEJA HALISI — inverted index search + learning integration (spec sections C + D)
// Pure, synchronous, in-memory. No awaits, no network, no localStorage WRITES.
// localStorage reads happen only through lib/learning (boosts/stats) — guarded for SSR.

import {
  PRICE_BUCKETS,
  BEDS_VOCAB,
  AMENITIES_VOCAB,
  ESTATE_ROWS,
  ALIAS_MAP,
} from "@/lib/estates-data";
import { personalizationBoost } from "@/lib/learning";
import type { ListingDTO } from "@/lib/types";

// ---------------------------------------------------------------------------
// Vocabulary + compiled matchers (module level — built once, reused everywhere)
// ---------------------------------------------------------------------------

export const SEARCH_AMENITIES = AMENITIES_VOCAB.filter((a) => !a.isTrustFilter);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/** Bucket id for a price via Estates.json priceBuckets (first inclusive range wins). */
export function priceBucketOf(price: number): string {
  for (const b of PRICE_BUCKETS) {
    if (price >= b.min && price <= b.max) return b.id;
  }
  return price < PRICE_BUCKETS[0].min ? PRICE_BUCKETS[0].id : PRICE_BUCKETS[PRICE_BUCKETS.length - 1].id;
}

export function bucketLabelOf(id: string): string {
  return PRICE_BUCKETS.find((b) => b.id === id)?.label ?? id;
}

export function amenityLabelOf(id: string): string {
  return AMENITIES_VOCAB.find((a) => a.id === id)?.label ?? id;
}

/** Canonical beds label ("Bedsitter" | "1BR" | "2BR" | "3BR") from any listing value/alias. */
const BEDS_ALIAS_TO_LABEL = new Map<string, string>();
for (const b of BEDS_VOCAB) {
  BEDS_ALIAS_TO_LABEL.set(b.label.toLowerCase(), b.label);
  for (const a of b.aliases) BEDS_ALIAS_TO_LABEL.set(a.toLowerCase(), b.label);
}
export function canonicalBeds(beds: string): string {
  return BEDS_ALIAS_TO_LABEL.get(beds.toLowerCase().trim()) ?? beds;
}

/** Estate tokens: alias keys ("kile" -> Kileleshwa) UNION full estate names. */
const ESTATE_TOKEN_MAP = new Map<string, string>();
for (const [k, v] of Object.entries(ALIAS_MAP)) ESTATE_TOKEN_MAP.set(k.toLowerCase(), v);
for (const e of ESTATE_ROWS) if (!ESTATE_TOKEN_MAP.has(e.name.toLowerCase())) ESTATE_TOKEN_MAP.set(e.name.toLowerCase(), e.name);

const BEDS_MATCHERS: { canonical: string; re: RegExp }[] = BEDS_VOCAB.map((b) => ({
  canonical: b.label,
  re: new RegExp(`\\b(?:${[b.label, ...b.aliases].map((a) => escapeRegExp(a.toLowerCase())).join("|")})\\b`),
}));

const ESTATE_MATCHERS: { name: string; re: RegExp }[] = [...ESTATE_TOKEN_MAP.keys()]
  .sort((a, b) => b.length - a.length) // longest token wins ("kileleshwa" before "kile")
  .map((k) => ({ name: ESTATE_TOKEN_MAP.get(k) as string, re: new RegExp(`\\b${escapeRegExp(k)}\\b`) }));

const AMENITY_MATCHERS: { id: string; res: RegExp[] }[] = SEARCH_AMENITIES.filter((a) => a.keywords.length > 0).map(
  (a) => ({ id: a.id, res: a.keywords.map((k) => new RegExp(`\\b${escapeRegExp(k.toLowerCase())}\\b`)) })
);

/** "18k" -> 15-20k, "7k" -> 7-10k … (1-2 digits + optional space + k) */
const BUCKET_TOKEN_RE = /\b(\d{1,2})\s*k\b/;

// ---------------------------------------------------------------------------
// Query tokenization — "1br kile 18k water" -> { beds:"1BR", estate:"Kileleshwa", bucket:"15-20k", amenities:["water"] }
// ---------------------------------------------------------------------------

export interface ParsedQuery {
  beds?: string; // canonical beds label
  estate?: string; // resolved estate name (alias resolved)
  bucket?: string; // price bucket id
  amenities: string[]; // amenity ids
  tokens: string[]; // lowercased word tokens
  hasTokens: boolean; // at least one recognizable token type present
}

export function tokenizeQuery(q: string): ParsedQuery {
  const raw = (q || "").toLowerCase();
  const tokens = raw.split(/[^a-z0-9/]+/).filter(Boolean);
  const parsed: ParsedQuery = { amenities: [], tokens, hasTokens: false };

  for (const bm of BEDS_MATCHERS) {
    if (bm.re.test(raw)) {
      parsed.beds = bm.canonical;
      break;
    }
  }
  for (const em of ESTATE_MATCHERS) {
    if (em.re.test(raw)) {
      parsed.estate = em.name;
      break;
    }
  }
  const km = BUCKET_TOKEN_RE.exec(raw);
  if (km) parsed.bucket = priceBucketOf(Number(km[1]) * 1000);
  for (const am of AMENITY_MATCHERS) {
    if (!parsed.amenities.includes(am.id) && am.res.some((re) => re.test(raw))) parsed.amenities.push(am.id);
  }

  parsed.hasTokens = Boolean(parsed.beds || parsed.estate || parsed.bucket || parsed.amenities.length > 0);
  return parsed;
}

/** Alias targets can be catalog names ("Umoja I") while seeded listings say "Umoja" — match flexibly. */
export function estateMatches(listingEstate: string, parsedEstate: string): boolean {
  const a = listingEstate.toLowerCase();
  const b = parsedEstate.toLowerCase();
  if (a === b) return true;
  return a.startsWith(b) || b.startsWith(a);
}

/** Amenity ids a listing actually carries (keyword containment over its free-form amenity strings). */
export function listingAmenityIds(l: Pick<ListingDTO, "amenities">): string[] {
  const ids: string[] = [];
  for (const am of AMENITY_MATCHERS) {
    if (l.amenities.some((str) => am.res.some((re) => re.test(str.toLowerCase())))) ids.push(am.id);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Inverted index — Maps rebuilt via useMemo on listings (never persisted)
// ---------------------------------------------------------------------------

export interface SearchIndex {
  byId: Map<string, ListingDTO>;
  estate: Map<string, Set<string>>; // lc estate name -> ids
  beds: Map<string, Set<string>>; // canonical beds -> ids
  bucket: Map<string, Set<string>>; // bucket id -> ids
  amenity: Map<string, Set<string>>; // amenity id -> ids
  borough: Map<string, Set<string>>; // lc borough -> ids
  amenitiesOf: Map<string, string[]>; // listing id -> matched amenity ids
}

function add(map: Map<string, Set<string>>, key: string, id: string) {
  let set = map.get(key);
  if (!set) {
    set = new Set<string>();
    map.set(key, set);
  }
  set.add(id);
}

export function buildIndex(listings: ListingDTO[]): SearchIndex {
  const idx: SearchIndex = {
    byId: new Map(),
    estate: new Map(),
    beds: new Map(),
    bucket: new Map(),
    amenity: new Map(),
    borough: new Map(),
    amenitiesOf: new Map(),
  };
  for (const l of listings) {
    idx.byId.set(l.id, l);
    add(idx.estate, l.estate.toLowerCase(), l.id);
    add(idx.beds, canonicalBeds(l.beds), l.id);
    add(idx.bucket, priceBucketOf(l.price), l.id);
    const amIds = listingAmenityIds(l);
    idx.amenitiesOf.set(l.id, amIds);
    for (const a of amIds) add(idx.amenity, a, l.id);
    add(idx.borough, l.borough.toLowerCase(), l.id);
  }
  return idx;
}

// ---------------------------------------------------------------------------
// Scoring (spec D) — additive, deterministic, no IO beyond the learning boost
// ---------------------------------------------------------------------------

export interface ScoreFilters {
  borough?: string;
  noFee?: boolean;
}

/**
 * scoreListing — additive score:
 *   +45 estate token exact  ┐
 *   +30 beds token exact    ├ all three present & exact = baseMatch 100
 *   +25 bucket token exact  ┘ (token miss = -1000 → sinks below any real match)
 *   +20 borough matches filters.borough
 *   +15 per matched amenity token
 *   -50 listing.fee (hidden entirely by smartSearch when filters.noFee)
 *   +20 freshH < 24
 *   +30 poster.verificationStatus === "verified"
 *   + personalizationBoost(listing, priceBucketOf)   [lib/learning]
 */
export function scoreListing(
  listing: ListingDTO,
  parsed: ParsedQuery,
  filters?: ScoreFilters,
  precomputedBoost?: number,
): number {
  if (filters?.noFee && listing.fee) return -1_000_000_000; // hidden entirely

  let score = 0;
  if (parsed.estate) score += estateMatches(listing.estate, parsed.estate) ? 45 : -1000;
  if (parsed.beds) score += canonicalBeds(listing.beds) === parsed.beds ? 30 : -1000;
  if (parsed.bucket) score += priceBucketOf(listing.price) === parsed.bucket ? 25 : -1000;

  if (filters?.borough && listing.borough === filters.borough) score += 20;

  const have = listingAmenityIds(listing);
  for (const a of parsed.amenities) if (have.includes(a)) score += 15;

  if (listing.fee) score -= 50;
  if (listing.freshH < 24) score += 20;
  if (listing.poster.verificationStatus === "verified") score += 30;

  score += precomputedBoost ?? personalizationBoost(listing, priceBucketOf);
  return score;
}

// ---------------------------------------------------------------------------
// smartSearch — one synchronous pass: token gates + score sort (<50ms / 500 items)
// ---------------------------------------------------------------------------

export interface SmartSearchFilters extends ScoreFilters {
  sort?: "fresh" | "price_asc" | "price_desc" | "response";
}

export interface SmartMatch {
  results: ListingDTO[];
  parsed: ParsedQuery;
  matched: { estate?: string; beds?: string; bucket?: string; amenities: string[] };
  hidden: number; // rows dropped by token gates / noFee
}

function sortCmp(sort: SmartSearchFilters["sort"]): (a: ListingDTO, b: ListingDTO) => number {
  switch (sort) {
    case "price_asc":
      return (a, b) => a.price - b.price;
    case "price_desc":
      return (a, b) => b.price - a.price;
    case "response":
      return (a, b) => a.responseTime - b.responseTime;
    default:
      return (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // fresh = newest first
  }
}

export function smartSearch(
  listings: ListingDTO[],
  q: string,
  filters?: SmartSearchFilters,
  index?: SearchIndex,
): SmartMatch {
  const idx = index ?? buildIndex(listings);
  const parsed = tokenizeQuery(q);
  const cmp = sortCmp(filters?.sort);

  // personalization read ONCE per listing per search (keeps 500 items < 50ms)
  const boost = new Map<string, number>();
  for (const l of listings) boost.set(l.id, personalizationBoost(l, priceBucketOf));

  const rows = listings.filter((l) => {
    if (filters?.noFee && l.fee) return false;
    if (parsed.estate && !estateMatches(l.estate, parsed.estate)) return false;
    if (parsed.beds && canonicalBeds(l.beds) !== parsed.beds) return false;
    if (parsed.bucket && priceBucketOf(l.price) !== parsed.bucket) return false;
    if (parsed.amenities.length > 0) {
      const have = idx.amenitiesOf.get(l.id) ?? listingAmenityIds(l);
      if (!parsed.amenities.every((a) => have.includes(a))) return false;
    }
    return true;
  });

  const scored = rows.map((l) => ({ l, s: scoreListing(l, parsed, filters, boost.get(l.id)) }));

  if (parsed.hasTokens) {
    // query tokens present → score desc wins; current sort only as tiebreak
    scored.sort((a, b) => b.s - a.s || cmp(a.l, b.l));
  } else {
    // no tokens → keep the current sort, personalizationBoost as secondary sort
    scored.sort((a, b) => cmp(a.l, b.l) || (boost.get(b.l.id) ?? 0) - (boost.get(a.l.id) ?? 0));
  }

  return {
    results: scored.map((x) => x.l),
    parsed,
    matched: { estate: parsed.estate, beds: parsed.beds, bucket: parsed.bucket, amenities: parsed.amenities },
    hidden: listings.length - rows.length,
  };
}
