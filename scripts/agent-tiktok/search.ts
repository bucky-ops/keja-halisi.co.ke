/**
 * KEJA HALISI — TikTok Ingest Agent :: DISCOVERY TIER (search.ts)
 *
 * Finds candidate TikTok video links for Nairobi rental listings.
 *
 * HOW DISCOVERY WORKS
 * -------------------
 * TikTok's own search API needs signed device tokens and its web search page
 * is region-walled from this environment (both verified) — so the agent uses a
 * two-source discovery strategy:
 *
 *   1. WEB SEARCH BATTERY  — a battery of Nairobi-rental queries is run through
 *      the z-ai web_search function (CLI). Result URLs/snippets are mined with
 *      a strict `tiktok.com/@handle/video/<digits>` regex. Social search
 *      indexes surface real, shareable video links this way.
 *   2. CURATED HANDLE SEEDS — real Nairobi real-estate TikTok handles (grown
 *      every run from newly-ingested authors). Their videos are mined the
 *      same way: `tiktok @handle nairobi rent` queries tend to return the
 *      handle's video URLs in results.
 *
 * Everything here returns CANDIDATES only — verification happens in verify.ts.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, readdirSync, unlinkSync, rmdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Regex that matches canonical TikTok video URLs and captures handle + videoId. */
export const TIKTOK_VIDEO_RE = /tiktok\.com\/@([\w.\-]+)\/video\/(\d{6,25})/g;

/** Build a canonical URL from a regex match pair. */
export const toVideoUrl = (handle: string, videoId: string) =>
  `https://www.tiktok.com/@${handle.replace(/^@/, "")}/video/${videoId}`;

/**
 * Query battery — Nairobi-specific rental phrasing used by real agents on
 * TikTok. Extend freely; each query costs one web_search call (~2s).
 */
export const QUERY_BATTERY = (extraHandles: string[] = []): string[] => {
  const base = [
    "site:tiktok.com nairobi houses for rent",
    "site:tiktok.com keja nairobi rent",
    "site:tiktok.com nairobi apartment tour rent",
    "site:tiktok.com nairobirentals",
    "site:tiktok.com house hunting nairobi",
    "site:tiktok.com nairobi 2 bedroom rent",
    "site:tiktok.com bedsitter nairobi",
    "site:tiktok.com kilimani kileleshwa rent",
    "site:tiktok.com umoja kayole pipeline rent",
    "tiktok video bedsitter nairobi rent ksh",
    "tiktok kilimani kileleshwa apartment rent video",
    "tiktok nairobi real estate agent houses for rent video",
    "tiktok syokimau ruaka roysambu rent house video",
    "tiktok nairobi bedsitter 1 bedroom rent ksh video",
    "tiktok kasarani zimmerman githurai rent house",
    "tiktok south c langata karen house rent video",
  ];
  // For known handles, probe for their videos directly (their links show up
  // in social search results with the full /video/<id> path).
  const handleQs = extraHandles
    .slice(0, 4)
    .map((h) => `tiktok ${h} nairobi rent house video`);
  return [...base, ...handleQs];
};

interface SearchItem {
  url?: string;
  name?: string;
  snippet?: string;
}

/**
 * Run one web_search query through the z-ai CLI (backend function). Returns
 * the raw result items; failures return [] — discovery never throws.
 */
function runQuery(query: string, tmp: string): SearchItem[] {
  try {
    const out = join(tmp, `kh-search-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.json`);
    const args = JSON.stringify({ query, num: 12 });
    const res = spawnSync("z-ai", ["function", "-n", "web_search", "-a", args, "-o", out], {
      timeout: 25_000,
      encoding: "utf8",
    });
    if (res.status !== 0) return [];
    const parsed = JSON.parse(readFileSync(out, "utf8"));
    const items = Array.isArray(parsed) ? parsed : parsed?.results ?? parsed?.data ?? [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

/**
 * SEEDS — load candidate URLs from a file or inline list (one per line).
 * This is the ALWAYS-AVAILABLE ingestion path: when search engines and TikTok
 * mirrors wall public discovery (they aggressively bot-block), a human opens
 * the TikTok app's search (the owner's normal workflow), copies video links,
 * drops them in a seeds file — and the agent does everything else:
 * resolve → verify → snapshot → store.
 *
 * Accepts: `--seeds /path/to/file.txt` or `--seeds "url1,url2,..."`.
 * Non-TikTok lines are ignored; duplicates collapse.
 */
export function loadSeeds(spec: string | undefined): string[] {
  if (!spec) return [];
  const out = new Set<string>();
  let raw = spec;
  try {
    if (existsSync(spec)) raw = readFileSync(spec, "utf8");
  } catch { /* treat as inline list */ }
  for (const line of raw.split(/[\s,]+/)) {
    TIKTOK_VIDEO_RE.lastIndex = 0;
    const m = TIKTOK_VIDEO_RE.exec(line);
    if (m) out.add(toVideoUrl(m[1], m[2]));
  }
  return [...out];
}

/**
 * DISCOVER — run the full query battery and mine TikTok video links.
 * @param extraHandles realtor handles to probe for videos this round
 * @returns deduped candidate URLs (canonical tiktok.com/@h/video/<id> form)
 */
export async function discoverCandidates(extraHandles: string[] = []): Promise<string[]> {
  const tmp = mkdtempSync(`${tmpdir()}/kh-agent-`);

  const found = new Map<string, string>(); // videoUrl -> handle (first seen wins)
  const queries = QUERY_BATTERY(extraHandles);

  for (const q of queries) {
    const items = runQuery(q, tmp);
    for (const item of items) {
      const haystack = `${item.url ?? ""} ${item.name ?? ""} ${item.snippet ?? ""}`;
      TIKTOK_VIDEO_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = TIKTOK_VIDEO_RE.exec(haystack)) !== null) {
        const url = toVideoUrl(m[1], m[2]);
        if (!found.has(url)) found.set(url, m[1]);
      }
    }
    // gentle pacing — be polite to the search backend
    await new Promise((r) => setTimeout(r, 400));
  }

  // cleanup temp json
  try {
    for (const f of readdirSync(tmp)) unlinkSync(join(tmp, f));
    rmdirSync(tmp);
  } catch { /* best effort */ }

  return [...found.keys()];
}
