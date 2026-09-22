/**
 * KEJA HALISI — TikTok Ingest Agent :: STORAGE TIER (store.ts)
 *
 * Writes verified listings to the Prisma database (SQLite for local dev,
 * Neon Postgres for production — same code, switch via DATABASE_URL).
 *
 * LINK-ONLY LAW ON LISTINGS: the Listing row stores URLs + derived tags only
 * (tiktokUrl, thumbnailLink, embedHtmlLink, authorLink, photo links). The one
 * exception, explicitly approved by the product owner, is agent-GENERATED
 * video-frame snapshots: their JPEG payloads live in the dedicated Snapshot
 * table and listings reference them as /api/snapshots/<id> links.
 */
import type { PrismaClient } from "@prisma/client";
import type { TikTokMeta } from "./resolve";
import type { Verification } from "./verify";
import type { Frame } from "./snapshot";

export interface StoreDeps {
  db: PrismaClient;
  /** Canonical estate rows (name → row) from src/lib/estates-data */
  estateRows: { name: string; subCounty: string; borough: string; lat: number; lng: number; mainRoad: string; mainRoadLat: number; mainRoadLng: number }[];
}

/** videoIds already in the link index — the dedupe set (G0). */
export async function loadExistingVideoIds(db: PrismaClient): Promise<Set<string>> {
  const rows = await db.listing.findMany({ where: { videoId: { not: null } }, select: { videoId: true } });
  return new Set(rows.map((r) => r.videoId as string));
}

/**
 * Deterministic unique placeholder phone derived from the handle.
 * Agent.phone is @unique but unknown until the first contact unlocks the
 * masked lead flow — so each new poster gets a stable, collision-resistant
 * synthetic number (djb2 hash of the handle, 9 digits). Real verification
 * later replaces it.
 */
function syntheticPhone(handle: string): string {
  let h = 5381;
  for (let i = 0; i < handle.length; i++) h = ((h << 5) + h + handle.charCodeAt(i)) >>> 0;
  const digits = String(h).padStart(9, "1").replace(/0/g, "1").slice(0, 9);
  return `+2547${digits}`;
}

/** Upsert the posting Agent (role Agent, unverified until a human verifies). */
export async function upsertAgent(
  db: PrismaClient,
  meta: TikTokMeta,
): Promise<{ id: string }> {
  const handle = meta.handle || "@unknown";
  const existing = await db.agent.findUnique({ where: { tiktokHandle: handle } });
  if (existing) {
    await db.agent.update({ where: { id: existing.id }, data: { listingsCount: { increment: 1 } } });
    return { id: existing.id };
  }
  try {
    const created = await db.agent.create({
      data: {
        role: "Agent",
        phone: syntheticPhone(handle), // unique per handle — no placeholder collision
        tiktokHandle: handle,
        verificationStatus: "pending", // out of the green catalog until admin verifies
        bio: meta.authorName ? `${meta.authorName} — Nairobi rentals on TikTok.` : "TikTok rentals poster — verification pending.",
        listingsCount: 1,
      },
    });
    return { id: created.id };
  } catch (e) {
    // rare hash collision on phone — one rehash retry with a salted seed
    if (String((e as { code?: string }).code) === "P2002") {
      const created = await db.agent.create({
        data: {
          role: "Agent",
          phone: syntheticPhone(handle + "#2"),
          tiktokHandle: handle,
          verificationStatus: "pending",
          bio: meta.authorName ? `${meta.authorName} — Nairobi rentals on TikTok.` : "TikTok rentals poster — verification pending.",
          listingsCount: 1,
        },
      });
      return { id: created.id };
    }
    throw e;
  }
}

/**
 * Create the listing row + snapshot payloads, returning what happened.
 * Write order: listing → snapshot rows (FK needs listingId) → patch photos[].
 * photos[] priority: TikTok photo-post images (external links) → generated
 * snapshot links → origin_cover link fallback.
 */
export async function storeListing(
  deps: StoreDeps,
  meta: TikTokMeta,
  ver: Verification,
  frames: Frame[],
): Promise<{ listingId: string; photos: string[]; snapshotIds: string[] }> {
  const { db, estateRows } = deps;
  const estate = estateRows.find((e) => e.name === ver.linkObject.estate);

  // poster
  const { id: posterId } = await upsertAgent(db, meta);

  // photo strategy decided up-front:
  const usePhotoPost = meta.images.length > 0;
  const useSnapshots = !usePhotoPost && frames.length > 0;

  const now = new Date();
  const freshH = meta.createTimeSec
    ? Math.min(8760, Math.max(0, Math.round((now.getTime() / 1000 - meta.createTimeSec) / 3600)))
    : 24;

  const aiFlags: { type: string; label: string; severity: string }[] = [];
  if (ver.fee) aiFlags.push({ type: "fee_signal", label: "Viewing-fee signal in caption — report if asks before viewing", severity: "red" });
  if (ver.bait) aiFlags.push({ type: "price_anomaly", label: "Bait price — below 50% of estate average", severity: "amber" });
  aiFlags.push({ type: "agent_ingest", label: "Ingested by TikTok agent • auto-verified", severity: "blue" });

  // 1) LISTING FIRST (link-only row — photos patched at the end)
  const created = await db.listing.create({
    data: {
      posterId,
      title: `${ver.linkObject.beds} • ${ver.linkObject.estate} • ${estate?.mainRoad ?? ver.linkObject.estate}`,
      tiktokUrl: `https://www.tiktok.com/${meta.handle}/video/${meta.videoId}`,
      videoId: meta.videoId,
      thumbnailLink: meta.cover,
      embedHtmlLink: `<iframe src="https://www.tiktok.com/embed/v2/${meta.videoId}" width="325" height="580" frameborder="0" allow="encrypted-media;" scrolling="no"></iframe>`,
      authorLink: meta.handle ? `https://www.tiktok.com/${meta.handle}` : null,
      sourceState: "tikwm",
      role: "Agent",
      estate: ver.linkObject.estate,
      subCounty: estate?.subCounty ?? "",
      borough: estate?.borough ?? "",
      road: estate?.mainRoad ?? null,
      price: ver.linkObject.price,
      deposit: ver.linkObject.price,
      beds: ver.linkObject.beds || "Bedsitter",
      status: "Available",
      // fully verified → green catalog; bait prices → human review queue
      publishState: ver.verdict === "review" ? "pending_review" : "approved",
      amenities: JSON.stringify(ver.linkObject.amenities),
      lat: estate?.lat ?? 0,
      lng: estate?.lng ?? 0,
      distanceToRoadM: estate
        ? Math.round(Math.abs(estate.lat - estate.mainRoadLat) + Math.abs(estate.lng - estate.mainRoadLng) * 111320 * 0.6)
        : 300,
      photos: "[]",
      aiFlags: JSON.stringify(aiFlags),
      fee: ver.fee,
      freshH,
      responseTime: 30,
      reportsCount: 0,
      expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
    },
  });

  // 2) SNAPSHOTS (FK-safe: listing exists now)
  const photos: string[] = [];
  const snapshotIds: string[] = [];
  if (usePhotoPost) {
    photos.push(...meta.images.slice(0, 4)); // TikTok photo carousel — external links
  } else if (useSnapshots) {
    for (const [idx, f] of frames.entries()) {
      const snap = await db.snapshot.create({
        data: {
          listingId: created.id,
          idx,
          dataBase64: f.base64,
          width: f.width,
          height: f.height,
          bytes: f.bytes,
        },
      });
      snapshotIds.push(snap.id);
      photos.push(`/api/snapshots/${snap.id}`);
    }
  } else if (meta.originCover) {
    photos.push(meta.originCover); // cover-image fallback (external link)
  }

  // 3) PATCH the photos array onto the listing
  await db.listing.update({
    where: { id: created.id },
    data: { photos: JSON.stringify(photos) },
  });

  return { listingId: created.id, photos, snapshotIds };
}
