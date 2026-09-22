// KEJA HALISI — link id extraction (shared by retrieval engine + learning loop)
// The ONLY identity we persist is the TikTok video id — never video/photo bytes.

const VIDEO_ID_RE = /\/video\/(\d+)/;

/** Extract the TikTok videoId from a URL like https://www.tiktok.com/@user/video/747... Returns "" when absent. */
export function extractVideoId(tiktokUrl: string): string {
  if (!tiktokUrl) return "";
  const m = tiktokUrl.match(VIDEO_ID_RE);
  return m ? m[1] : "";
}
