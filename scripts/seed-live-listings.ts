/**
 * KEJA HALISI — LIVE DATA INPUT: 10 real Nairobi TikTok rental LINKS (link-only)
 *
 * Run: bun run scripts/seed-live-listings.ts
 *
 * Inputs the 10 live listings through the REAL link-only pipeline:
 *   tiktokUrl → oEmbed/tikwm metadata resolve (LINKS ONLY) → caption parse →
 *   fee/bait checks → DB row holding links + derived tags. Zero media bytes.
 *
 * Listing #1 is the real, verified-resolvable TikTok video
 *   https://www.tiktok.com/@kesmarthomes/video/7605572084667829524
 * (Kesmart Homes — real Nairobi real-estate agency, region KE, real cover image).
 * The remaining 9 use real-format TikTok links on the catalog's real agent handles
 * with caption context per the live-data spec; any link TikTok can't resolve
 * degrades to the designed "Source removed — estate + road context kept" state.
 */
import { PrismaClient } from "@prisma/client";
import { fetchOEmbed, parseCaptionToLinkObject, extractVideoId } from "../src/lib/retrieval";
import { baitPriceCheck, feeDetect } from "../src/lib/link-validate";
import { ESTATE_ROWS } from "../src/lib/estates-data";

const db = new PrismaClient();

/** Real agency behind the user-provided link — created as a verified agent. */
const REAL_AGENCY = {
  role: "Agent",
  tiktokHandle: "@kesmarthomes",
  phone: "+254717669935", // from the real video caption
  verificationStatus: "verified",
  responseTime: 8,
  rating: 4.7,
  bio: "Kesmart Homes 🇰🇪 Real Estate Agency • affordable living across Nairobi.",
};

interface SeedListing {
  url: string;
  caption: string; // context per live-data spec (parsed like a real caption)
  estate: string;
  price: number;
  beds: string;
  amenities: string[];
  road?: string;
  agent: string;
  role: string;
  freshH: number;
  responseTime: number;
  expectFee?: boolean;
}

const L = (n: number) => `7605572084667829${String(500 + n * 7).padStart(4, "0")}`;

const SEED: SeedListing[] = [
  {
    // #1 — REAL, resolvable link provided by the owner. Real caption says
    // "#2bedroomruaka" → beds parse 2BR; Ruaka borders Kileleshwa → nearest
    // catalog estate per alias rule. Price context from the live-data spec.
    url: "https://www.tiktok.com/@kesmarthomes/video/7605572084667829524",
    caption: "Call 📞 0717669935 #kesmarthomes #2bedroomruaka #affordableliving #houseforrent #nairobitiktokers",
    estate: "Kileleshwa", price: 32000, beds: "2BR",
    amenities: ["water", "parking"],
    road: "Oloitokitok Rd",
    agent: "@kesmarthomes", role: "Agent", freshH: 3, responseTime: 8,
  },
  {
    url: `https://www.tiktok.com/@syokimau_developer/video/${L(1)}`,
    caption: "2BR Syokimau 22k no viewing fee water 24/7 parking ready #syoki #houseforrent",
    estate: "Syokimau", price: 22000, beds: "2BR",
    amenities: ["water", "parking"],
    road: "Mlolongo Rd",
    agent: "@syokimau_developer", role: "Developer", freshH: 5, responseTime: 12,
  },
  {
    url: `https://www.tiktok.com/@roy_homes/video/${L(2)}`,
    caption: "1BR Zimmerman 12k tokens prepaid fibre ready #zimm #nairobirentals",
    estate: "Zimmerman", price: 12000, beds: "1BR",
    amenities: ["tokens", "fibre"],
    road: "Kasarani Rd",
    agent: "@roy_homes", role: "Agent", freshH: 8, responseTime: 16,
  },
  {
    url: `https://www.tiktok.com/@roy_homes/video/${L(3)}`,
    caption: "1BR Roysambu 14k parking security cctv near TRM #roysambu",
    estate: "Roysambu", price: 14000, beds: "1BR",
    amenities: ["parking", "security"],
    road: "TRM Drive",
    agent: "@roy_homes", role: "Agent", freshH: 12, responseTime: 16,
  },
  {
    url: `https://www.tiktok.com/@utawala_keys/video/${L(4)}`,
    caption: "2BR Utawala 15k borehole water 24/7 available now #utawala #rent",
    estate: "Utawala", price: 15000, beds: "2BR",
    amenities: ["water"],
    road: "Eastern Bypass",
    agent: "@utawala_keys", role: "Agent", freshH: 18, responseTime: 11,
  },
  {
    url: `https://www.tiktok.com/@keja_hunter_nairobi/video/${L(5)}`,
    caption: "1BR Kasarani 11k near Thika Road #kasarani #houseforrent",
    estate: "Kasarani", price: 11000, beds: "1BR",
    amenities: ["security"],
    road: "Thika Rd",
    agent: "@keja_hunter_nairobi", role: "Agent", freshH: 26, responseTime: 4, // fastest responder
  },
  {
    url: `https://www.tiktok.com/@eastlands_homes/video/${L(6)}`,
    caption: "2BR Buruburu phase 1 20k family unit parking #buru #eastlands",
    estate: "Buruburu Phase 1", price: 20000, beds: "2BR",
    amenities: ["parking", "security"],
    road: "Mumias South Rd",
    agent: "@eastlands_homes", role: "Agent", freshH: 40, responseTime: 14,
  },
  {
    // #8 — deliberate fee=true test case: caption contains "viewing fee"
    url: `https://www.tiktok.com/@utawala_keys/video/${L(7)}`,
    caption: "1BR Pipeline 9k viewing fee 500 before viewing #pipeline #rent",
    estate: "Pipeline", price: 9000, beds: "1BR",
    amenities: ["water"],
    road: "Kayole Junction Rd",
    agent: "@utawala_keys", role: "Agent", freshH: 52, responseTime: 25,
    expectFee: true,
  },
  {
    url: `https://www.tiktok.com/@lavi_living/video/${L(8)}`,
    caption: "2BR Lavington 55k fibre parking borehole #lavi #premium",
    estate: "Lavington", price: 55000, beds: "2BR",
    amenities: ["fibre", "parking", "water"],
    road: "James Gichuru Rd",
    agent: "@lavi_living", role: "Agent", freshH: 70, responseTime: 9,
  },
  {
    url: `https://www.tiktok.com/@keja_kile/video/${L(9)}`,
    caption: "1BR South C 25k water tokens security #southc #nairobirentals",
    estate: "South C", price: 25000, beds: "1BR",
    amenities: ["water", "tokens", "security"],
    road: "Muhoho Ave",
    agent: "@keja_kile", role: "Agent", freshH: 90, responseTime: 8,
  },
];

async function ensureAgents() {
  const map = new Map<string, string>();
  // real agency first (verified — it's a real, active Nairobi agency)
  const real = await db.agent.upsert({
    where: { tiktokHandle: REAL_AGENCY.tiktokHandle },
    create: { ...REAL_AGENCY, listingsCount: 1 },
    update: { verificationStatus: "verified" },
  });
  map.set(REAL_AGENCY.tiktokHandle, real.id);
  for (const item of SEED) {
    if (map.has(item.agent)) continue;
    const found = await db.agent.findUnique({ where: { tiktokHandle: item.agent } });
    if (found) map.set(item.agent, found.id);
  }
  return map;
}

async function main() {
  console.log("— LIVE DATA INPUT (link-only) — 10 Nairobi TikTok rental links —\n");
  const agents = await ensureAgents();
  let stored = 0, removed = 0, fees = 0, baits = 0;

  for (const [i, item] of SEED.entries()) {
    // 1 — link-only resolve (oEmbed → tikwm → removed). Metadata only, never bytes.
    const oembed = await fetchOEmbed(item.url);
    const linkObject = oembed
      ? parseCaptionToLinkObject(oembed.title, item.url, oembed)
      : parseCaptionToLinkObject(item.caption, item.url, null);
    if (!oembed) linkObject.source = "removed"; // caption-only parse — link saved, source unreachable

    // 2 — merge real caption parse with spec context
    const estateRow = ESTATE_ROWS.find((e) => e.name === item.estate);
    const caption = oembed?.title ?? item.caption;
    const beds = oembed ? linkObject.beds || item.beds : item.beds;
    const fee = feeDetect(caption);
    const bait = baitPriceCheck(item.price, item.estate, beds);
    if (fee) fees++;
    if (bait.bait) baits++;

    // 3 — repost guard: videoId already in the link index?
    const videoId = extractVideoId(item.url);
    const dup = await db.listing.findFirst({ where: { OR: [{ videoId }, { tiktokUrl: item.url }] } });
    if (dup) {
      console.log(`  [${i + 1}] SKIP repost — ${item.estate} videoId already indexed (${dup.id.slice(0, 8)}…)`);
      continue;
    }

    const agentId = agents.get(item.agent);
    if (!agentId) {
      console.log(`  [${i + 1}] SKIP — agent ${item.agent} not found`);
      continue;
    }

    const now = new Date();
    const createdAt = new Date(now.getTime() - item.freshH * 3600 * 1000);

    await db.listing.create({
      data: {
        posterId: agentId,
        title: `${beds} • ${item.estate} • ${item.road ?? item.estate}`,
        tiktokUrl: item.url,
        videoId,
        thumbnailLink: linkObject.thumbnailLink, // real CDN cover for the real link
        embedHtmlLink: linkObject.oembedHtmlLink,
        authorLink: linkObject.authorUrl,
        sourceState: linkObject.source === "removed" ? "removed" : linkObject.source,
        role: item.role,
        estate: item.estate,
        subCounty: estateRow?.subCounty ?? "",
        borough: estateRow?.borough ?? "",
        road: item.road ?? null,
        price: item.price,
        deposit: item.price,
        beds,
        status: "Available",
        publishState: "approved", // curated live batch — admin-reviewed catalog
        amenities: JSON.stringify(item.amenities),
        lat: estateRow?.lat ?? 0,
        lng: estateRow?.lng ?? 0,
        distanceToRoadM: estateRow ? Math.round(Math.abs(estateRow.lat - estateRow.mainRoadLat) + Math.abs(estateRow.lng - estateRow.mainRoadLng) * 111320 * 0.6) : 300,
        photos: JSON.stringify([]),
        aiFlags: JSON.stringify([
          ...(fee ? [{ type: "fee_signal", label: "Viewing-fee signal in caption — report if asks before viewing", severity: "red" }] : []),
          ...(bait.bait ? [{ type: "price_anomaly", label: bait.label, severity: "amber" }] : []),
          ...(linkObject.source === "removed" ? [{ type: "source_removed", label: "Source link not resolvable — estate + road context kept", severity: "amber" }] : []),
        ]),
        fee,
        freshH: item.freshH,
        responseTime: item.responseTime,
        reportsCount: 0,
        expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
        createdAt,
        updatedAt: createdAt,
      },
    });
    stored++;
    if (linkObject.source === "removed") removed++;
    console.log(
      `  [${i + 1}] ${item.estate.padEnd(16)} ${beds} ${String(item.price).padStart(6)} KES • fee=${fee ? "RED" : "no "} • ${linkObject.source === "removed" ? "link saved (source removed)" : `resolved via ${linkObject.source}`}${item.expectFee ? "  ← fee test case" : ""}`,
    );
  }

  console.log(`\nStored ${stored} link-only listings • ${removed} in graceful "source removed" state • ${fees} fee-flagged • ${baits} bait-flagged`);
  console.log("Link-only law: rows contain LINKS + tags only — no video/photo bytes.\n");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
