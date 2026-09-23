/**
 * KEJA HALISI — TikTok Ingest Agent :: RESOLUTION TIER (resolve.ts)
 *
 * Resolves a candidate TikTok URL into full metadata using the tikwm mirror
 * of TikTok's public data (the same LINK-ONLY resolver the app itself uses —
 * /api/retrieval/resolve calls the identical endpoint family).
 *
 * WHAT COMES BACK (all LINKS + numbers — never media bytes):
 *   {
 *     ok, videoId, handle, region, title,
 *     cover,            // small cover image URL (external)
 *     originCover,      // large cover image URL (external)
 *     images: [...],    // TikTok photo-mode post images (external URLs) —
 *                       //   when present the post IS a photo carousel
 *     play,             // no-watermark mp4 URL — used EPHEMERALLY for frame
 *                       //   extraction only; the file is never persisted
 *     durationSec, createTimeSec, author { unique_id, nickname }, stats
 *   }
 *
 * RATE POLICY: ~1.2s spacing between calls + 2 retries with backoff. The
 * endpoint also powers the live app, so we keep our footprint tiny.
 */

export interface TikTokMeta {
  ok: boolean;
  videoId: string;
  handle: string;
  region: string | null;
  title: string;
  cover: string | null;
  originCover: string | null;
  images: string[];
  play: string | null;
  durationSec: number;
  createTimeSec: number | null;
  authorId: string | null;
  authorName: string | null;
  stats: { plays: number; likes: number; comments: number };
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/** Extract the numeric videoId from any tiktok.com video URL. */
export function extractVideoId(url: string): string {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : "";
}

/** Extract the @handle from any tiktok.com video URL. */
export function extractHandle(url: string): string {
  const m = url.match(/tiktok\.com\/@([\w.\-]+)/);
  return m ? `@${m[1]}` : "@unknown";
}

/** Fetch with timeout — never hangs the agent loop. */
async function timedFetch(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * RESOLVE — candidate URL → TikTokMeta via tikwm (2 retries, 1.2s spacing).
 * ok=false means "unresolvable right now" — the caller skips the candidate.
 */
export async function resolveVideo(url: string, tries = 2): Promise<TikTokMeta> {
  const videoId = extractVideoId(url);
  const handle = extractHandle(url);
  const empty: TikTokMeta = {
    ok: false, videoId, handle, region: null, title: "", cover: null,
    originCover: null, images: [], play: null, durationSec: 0,
    createTimeSec: null, authorId: null, authorName: null,
    stats: { plays: 0, likes: 0, comments: 0 },
  };
  if (!videoId) return empty;

  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt));
    const res = await timedFetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
      18_000,
    );
    if (!res || !res.ok) continue;
    try {
      const json = (await res.json()) as {
        code?: number;
        data?: Record<string, unknown>;
      };
      if (json.code !== 0 || !json.data) continue;
      const d = json.data;
      const author = (d.author ?? {}) as Record<string, unknown>;
      const stats = (d.statistics ?? d.stats ?? {}) as Record<string, unknown>;
      return {
        ok: true,
        videoId: String(d.id ?? videoId),
        handle: author.unique_id ? `@${String(author.unique_id)}` : handle,
        region: d.region ? String(d.region) : null,
        title: String(d.title ?? ""),
        cover: d.cover ? String(d.cover) : null,
        originCover: d.origin_cover ? String(d.origin_cover) : null,
        images: Array.isArray(d.images) ? (d.images as string[]).map(String) : [],
        play: d.play ? String(d.play) : null,
        durationSec: Number(d.duration ?? 0) || 0,
        createTimeSec: d.create_time ? Number(d.create_time) : null,
        authorId: author.id ? String(author.id) : null,
        authorName: author.nickname ? String(author.nickname) : null,
        stats: {
          plays: Number(stats.play_count ?? 0) || 0,
          likes: Number(stats.digg_count ?? 0) || 0,
          comments: Number(stats.comment_count ?? 0) || 0,
        },
      };
    } catch {
      continue; // JSON parse hiccup — retry
    }
  }
  return empty;
}
