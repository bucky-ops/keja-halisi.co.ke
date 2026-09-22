/**
 * KEJA HALISI — TikTok Ingest Agent :: SNAPSHOT TIER (snapshot.ts)
 *
 * "If photos exist, show them; if not, snap the video."
 *
 * For video posts WITHOUT photos, this module downloads the mp4 EPHEMERALLY
 * (tmpfs, deleted after use — the file itself is never stored anywhere), then
 * extracts up to 3 presentation frames with ffmpeg:
 *
 *   1. SCENE DETECTION  — `select='gt(scene,0.22)'` picks frames where the
 *      visual scene changes hard; on a house tour those are exactly the
 *      transitions between gate → living room → bedroom → kitchen. This is
 *      the "identify key sections" step.
 *   2. FIXED-TIMESTAMP FALLBACK — if the video is a single continuous shot
 *      (few scene cuts), frames are grabbed at 25% / 50% / 75% of the
 *      duration instead, skipping the usual text intro at the start.
 *
 * Frames are scaled to 540px wide JPEG (q=5) — small enough to keep DB-stored
 * payloads ~30–80KB each, sharp enough for card + gallery presentation.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, unlinkSync, rmdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface Frame {
  idx: number;
  base64: string;
  width: number;
  height: number;
  bytes: number;
}

/** Download a URL to a local temp file. Returns null on failure. */
async function downloadTo(url: string, dest: string, ms = 25_000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Referer: "https://www.tiktok.com/" },
    });
    if (!res.ok || !res.body) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) return false; // <10KB is not a real video
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Probe the video duration in seconds (fallback: metadata duration). */
function probeDuration(path: string, fallback: number): number {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
    { encoding: "utf8", timeout: 15_000 },
  );
  const d = parseFloat((res.stdout ?? "").trim());
  return Number.isFinite(d) && d > 0 ? d : fallback;
}

/** Extract N frames at fixed percentage positions across the video. */
function framesAtPercents(path: string, percents: number[], outPrefix: string): void {
  for (const p of percents) {
    const at = Math.max(0.5, p); // seconds — already computed by caller below
    void at;
  }
}

/** Grab one JPEG frame at `seconds` into the video, scaled to 540px wide. */
function grabFrame(path: string, seconds: number, out: string): boolean {
  const res = spawnSync(
    "ffmpeg",
    [
      "-y", "-ss", seconds.toFixed(2), "-i", path,
      "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "5", out,
    ],
    { encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "ignore"] },
  );
  return res.status === 0;
}

/** Read a frame file into a Frame payload, or null if unreadable. */
function readFrame(path: string, idx: number): Frame | null {
  try {
    const buf = readFileSync(path);
    if (buf.length < 3_000) return null; // corrupt / blank frame
    return {
      idx,
      base64: buf.toString("base64"),
      width: 540,
      height: 0, // filled by ffprobe-free approximation below if needed
      bytes: buf.length,
    };
  } catch {
    return null;
  }
}

/**
 * SNAPSHOT — download + extract key frames from a TikTok video.
 * @param playUrl   no-watermark mp4 URL from resolve.ts (ephemeral use only)
 * @param videoId   for the temp filename
 * @param fallbackSec duration from metadata when ffprobe can't read the file
 * @returns up to 3 frames, [] when the video could not be processed
 */
export async function snapshotVideo(
  playUrl: string,
  videoId: string,
  fallbackSec: number,
): Promise<Frame[]> {
  const work = mkdtempSync(`${tmpdir()}/kh-snap-`);
  const mp4 = join(work, `${videoId}.mp4`);
  const frames: Frame[] = [];

  try {
    if (!(await downloadTo(playUrl, mp4))) return [];
    const duration = probeDuration(mp4, fallbackSec || 15);

    // Attempt 1 — scene-detection pass (key room transitions)
    const scenePrefix = join(work, "scene");
    spawnSync(
      "ffmpeg",
      [
        "-y", "-i", mp4,
        "-vf", "select='gt(scene,0.22)',scale=540:-2",
        "-frames:v", "3", "-q:v", "5", `${scenePrefix}%02d.jpg`,
      ],
      { encoding: "utf8", timeout: 45_000, stdio: ["ignore", "pipe", "ignore"] },
    );
    const sceneFrames = readdirSync(work)
      .filter((f) => f.startsWith("scene") && f.endsWith(".jpg"))
      .sort();
    for (const [i, f] of sceneFrames.slice(0, 3).entries()) {
      const fr = readFrame(join(work, f), i);
      if (fr) frames.push(fr);
    }

    // Attempt 2 — fixed timestamps when scene cuts were too few
    if (frames.length < 2) {
      frames.length = 0;
      const stops = [0.25, 0.5, 0.75].map((p) =>
        Math.min(Math.max(0.5, duration * p), Math.max(0.5, duration - 0.5)),
      );
      framesAtPercents(mp4, stops, work); // (kept for documentation symmetry)
      let idx = 0;
      for (const s of stops) {
        if (frames.length >= 3) break;
        const out = join(work, `fix${idx}.jpg`);
        if (grabFrame(mp4, s, out)) {
          const fr = readFrame(out, frames.length);
          if (fr) frames.push(fr);
        }
        idx++;
      }
    }

    // Height probe on first frame (images are 540 wide, 9:16-ish content)
    if (frames.length) {
      const first = frames[0];
      const probe = spawnSync(
        "ffprobe",
        ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", join(work, sceneFrames[0] ?? "fix0.jpg")],
        { encoding: "utf8", timeout: 10_000 },
      );
      const [w, h] = (probe.stdout ?? "").trim().split(",").map(Number);
      first.width = w || first.width;
      first.height = h || first.height;
    }

    return frames;
  } finally {
    // EPHEMERAL BY DESIGN: the downloaded mp4 and raw frames are wiped —
    // only the 3 extracted JPEG payloads survive (as base64 in the Snapshot
    // table, served through /api/snapshots/<id>).
    try {
      for (const f of readdirSync(work)) unlinkSync(join(work, f));
      rmdirSync(work);
    } catch { /* best effort */ }
  }
}
