/**
 * KEJA HALISI — TikTok Ingest Agent :: ORCHESTRATOR (index.ts)
 *
 * The full autonomous pipeline, run end-to-end:
 *
 *   DISCOVER   web-search battery mines real tiktok.com video links
 *        ↓
 *   RESOLVE    tikwm returns metadata LINKS per video (title/cover/images/play)
 *        ↓
 *   VERIFY     G0 dedupe • G1 region KE • G2 rent signal • G3 canonical estate
 *              • G4 price present • G5 bait→human-review (see verify.ts)
 *        ↓
 *   SNAPSHOT   photo posts → store image LINKS; video posts → ephemeral mp4 +
 *              ffmpeg scene-detection frames → Snapshot table (see snapshot.ts)
 *        ↓
 *   STORE      link-only Listing rows + Agent upserts + audit trail (store.ts)
 *
 * USAGE
 *   bun run scripts/agent-tiktok/index.ts                 # DRY RUN (no writes)
 *   bun run scripts/agent-tiktok/index.ts --live          # write to DB
 *   bun run scripts/agent-tiktok/index.ts --live --limit 12
 *   bun run scripts/agent-tiktok/index.ts --no-snapshots  # links-only round
 *
 * DB TARGET: whatever DATABASE_URL points at + the generated Prisma client
 *   (SQLite locally; for Neon Postgres run `bun run db:generate:pg` first and
 *   export the pooled DATABASE_URL — see docs/tiktok-agent.md).
 */
import { PrismaClient } from "@prisma/client";
import { ESTATE_ROWS } from "../../src/lib/estates-data";
import { discoverCandidates, loadSeeds } from "./search";
import { resolveVideo } from "./resolve";
import { verifyCandidate } from "./verify";
import { snapshotVideo, type Frame } from "./snapshot";
import { loadExistingVideoIds, storeListing } from "./store";

/* ---------------- CLI flags ---------------- */
const argv = process.argv.slice(2);
const LIVE = argv.includes("--live"); // default: dry-run (no writes)
const SNAPSHOTS = !argv.includes("--no-snapshots");
const seedsSpec = (() => {
  const i = argv.indexOf("--seeds");
  return i >= 0 ? argv[i + 1] : undefined;
})();
const LIMIT = (() => {
  const i = argv.indexOf("--limit");
  return i >= 0 ? Math.max(1, parseInt(argv[i + 1] ?? "12", 10) || 12) : 12;
})();

const db = new PrismaClient();

interface Tally {
  candidates: number;
  resolved: number;
  accepted: number;
  review: number;
  rejected: number;
  failedResolve: number;
  snapshotOk: number;
  photoPosts: number;
}

async function main() {
  const t0 = Date.now();
  console.log("— KEJA HALISI :: TIKTOK INGEST AGENT —");
  console.log(`  mode: ${LIVE ? "LIVE (writes enabled)" : "DRY RUN"} • limit: ${LIMIT} • snapshots: ${SNAPSHOTS ? "on" : "off"}\n`);

  // handles worth probing this round: known realtors already in the DB
  const knownAgents = await db.agent.findMany({
    select: { tiktokHandle: true },
    where: { tiktokHandle: { not: "" } },
    take: 12,
  });
  const handleSeeds = knownAgents.map((a) => a.tiktokHandle as string);

  // 1 — DISCOVER (+ optional seeds from file/inline — the always-works path)
  const seeds = loadSeeds(seedsSpec);
  const discovered = await discoverCandidates(handleSeeds);
  const candidates = [...new Set([...seeds, ...discovered])];
  console.log(`  seeds: ${seeds.length} • discovered: ${discovered.length} → ${candidates.length} candidate video links\n`);

  const existing = await loadExistingVideoIds(db);
  const estateRows = ESTATE_ROWS.map((e) => ({
    name: e.name, subCounty: e.subCounty, borough: e.borough,
    lat: e.lat, lng: e.lng, mainRoad: e.mainRoad,
    mainRoadLat: e.mainRoadLat, mainRoadLng: e.mainRoadLng,
  }));
  const deps = { db, estateRows };

  const tally: Tally = {
    candidates: candidates.length, resolved: 0, accepted: 0,
    review: 0, rejected: 0, failedResolve: 0, snapshotOk: 0, photoPosts: 0,
  };
  const stored: string[] = [];
  const newHandles = new Set<string>();

  for (const url of candidates) {
    if (tally.accepted + tally.review >= LIMIT) break; // respect the run budget

    // 2 — RESOLVE
    const meta = await resolveVideo(url);
    await new Promise((r) => setTimeout(r, 1200)); // rate-limit spacing
    if (!meta.ok) {
      tally.failedResolve++;
      console.log(`  · skip (resolve failed) ${url}`);
      continue;
    }
    tally.resolved++;

    // 3 — VERIFY
    const ver = verifyCandidate(meta, existing);
    if (ver.verdict === "reject") {
      tally.rejected++;
      console.log(`  · reject [${ver.reason}] ${meta.handle} "${meta.title.slice(0, 48)}"`);
      continue;
    }

    // 4 — SNAPSHOT (video posts only; photo posts keep their image LINKS)
    let frames: Frame[] = [];
    if (SNAPSHOTS && !meta.images.length && meta.play) {
      frames = await snapshotVideo(meta.play, meta.videoId, meta.durationSec);
      if (frames.length) tally.snapshotOk++;
    } else if (meta.images.length) {
      tally.photoPosts++;
    }

    // 5 — STORE
    if (!LIVE) {
      const tag = ver.verdict === "review" ? "REVIEW" : "ACCEPT";
      console.log(`  ✓ dry ${tag} ${meta.handle} • ${ver.linkObject.estate} ${ver.linkObject.beds} KES ${ver.linkObject.price} • photos: ${meta.images.length ? `${meta.images.length} post-images` : frames.length ? `${frames.length} frames` : "cover"} [${ver.reason}]`);
      tally[ver.verdict === "review" ? "review" : "accepted"]++;
      continue;
    }

    try {
      const res = await storeListing(deps, meta, ver, frames);
      existing.add(meta.videoId); // keep the in-run dedupe set fresh
      if (meta.handle) newHandles.add(meta.handle);
      tally[ver.verdict === "review" ? "review" : "accepted"]++;
      stored.push(`${ver.linkObject.estate} • ${ver.linkObject.beds} • KES ${ver.linkObject.price} • ${res.photos.length} photos`);
      console.log(`  ✓ stored [${ver.verdict === "review" ? "REVIEW" : "LIVE"}] ${ver.linkObject.estate} ${ver.linkObject.beds} KES ${ver.linkObject.price} • ${res.photos.length} photos • ${meta.handle}`);
    } catch (e) {
      console.log(`  · store FAILED ${meta.videoId}: ${(e as Error).message.slice(0, 90)}`);
    }
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n— RUN SUMMARY (${secs}s) —`);
  console.log(`  candidates ${tally.candidates} • resolved ${tally.resolved} • accepted ${tally.accepted} • review ${tally.review} • rejected ${tally.rejected} • resolve-fail ${tally.failedResolve}`);
  console.log(`  photos: ${tally.photoPosts} photo-posts • ${tally.snapshotOk} snapshot videos`);
  if (LIVE && stored.length) {
    console.log("\n  NEW LISTINGS:");
    for (const s of stored) console.log(`   • ${s}`);
  }
  if (!LIVE) console.log("\n  (dry run — nothing written. re-run with --live to store)");

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("AGENT CRASH:", e);
  await db.$disconnect();
  process.exit(1);
});
