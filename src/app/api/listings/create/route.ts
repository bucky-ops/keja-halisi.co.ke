export const dynamic = "force-dynamic";
// POST /api/listings/create — LINK-ONLY LIVE DATA INPUT (spec STEP 4 submit)
//
// body: {
//   tiktokUrl, estate, subCounty, borough, price, beds, amenities[],
//   lat, lng, photoLinks[], role, mandateLink?, kplcBillLink?, titleDocLink?,
//   deposit?, road?, evidence[] (5 checked items), posterHandle?
// }
//
// STORES ONLY LINKS + TAGS: tiktokUrl, thumbnailLink, embedHtmlLink, authorLink,
// photoLinks[] (external), mandateLink (signed vault URL) — NEVER video/photo bytes.
// On success: status=Available, publishState=pending_review, freshH=0,
// responseTime=30, reportsCount=0, expires_at=now()+7days.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";
import {
  fetchOEmbed,
  parseCaptionToLinkObject,
  removedLinkObject,
} from "@/lib/retrieval";
import { baitPriceCheck, feeDetect, validateTikTokUrl } from "@/lib/link-validate";

interface CreateBody {
  tiktokUrl?: string;
  estate?: string;
  subCounty?: string;
  borough?: string;
  price?: number;
  deposit?: number;
  beds?: string;
  amenities?: string[];
  lat?: number;
  lng?: number;
  photoLinks?: string[];
  role?: string;
  mandateLink?: string;
  kplcBillLink?: string;
  titleDocLink?: string;
  road?: string;
  evidence?: string[];
  posterHandle?: string;
  posterPhone?: string;
}

const ROLES = ["Agent", "Owner", "Developer", "Caretaker"];
const EXPIRY_DAYS = 7;

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    tiktokUrl, estate, subCounty, borough, price, deposit, beds, amenities,
    lat, lng, photoLinks, role, mandateLink, kplcBillLink, titleDocLink,
    road, evidence, posterHandle, posterPhone,
  } = body;

  // 1 — TikTok URL format gate (shake-error contract)
  const gate = validateTikTokUrl(tiktokUrl ?? "");
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Invalid TikTok link", detail: "Invalid TikTok link — must be tiktok.com/@handle/video/..." },
      { status: 400 },
    );
  }

  // 2 — REPOST check: videoId already in the link index → hard block
  const existing = await db.listing.findFirst({
    where: { OR: [{ videoId: gate.videoId }, { tiktokUrl: String(tiktokUrl).trim() }] },
    include: { poster: true },
  });
  if (existing) {
    await audit(db, {
      actor: "system", action: "listing.repost.blocked", object: "listing",
      metadata: { videoId: gate.videoId, matchHandle: existing.poster.tiktokHandle },
    });
    return NextResponse.json(
      {
        error: "Repost",
        detail: `Repost 80% match ${existing.poster.tiktokHandle} — this videoId is already in the index`,
        repostOf: existing.poster.tiktokHandle,
      },
      { status: 409 },
    );
  }

  // 3 — evidence checklist: 5 boxes mandatory (Outside • Gate • Inside • Water • Window)
  const ev = Array.isArray(evidence) ? evidence : [];
  if (ev.length < 5) {
    return NextResponse.json(
      { error: "Evidence checklist incomplete", detail: "All 5 evidence clips required: Outside • Gate • Inside • Water running • Window view" },
      { status: 422 },
    );
  }

  // 4 — resolve metadata LINKS ONLY (oEmbed → tikwm → removed)
  const oembed = await fetchOEmbed(String(tiktokUrl).trim());
  const caption = oembed?.title ?? "";
  const linkObject = oembed
    ? parseCaptionToLinkObject(caption, String(tiktokUrl).trim(), oembed)
    : removedLinkObject(String(tiktokUrl).trim());

  const finalPrice = Number(price) || linkObject.price || 0;
  const finalBeds = beds || linkObject.beds || "Bedsitter";
  const finalEstate = estate || linkObject.estate || "";

  if (!finalEstate || !finalPrice) {
    return NextResponse.json(
      { error: "estate and price are required", detail: "Pick an estate and confirm the rent before publishing" },
      { status: 400 },
    );
  }

  // 5 — trust signals
  const fee = linkObject.fee || feeDetect(caption);
  const bait = baitPriceCheck(finalPrice, finalEstate, finalBeds);

  const aiFlags: { type: string; label: string; severity: string }[] = [];
  if (fee) aiFlags.push({ type: "fee_signal", label: "Viewing-fee signal in caption — report if asks before viewing", severity: "red" });
  if (bait.bait) aiFlags.push({ type: "price_anomaly", label: bait.label, severity: "amber" });
  if (linkObject.source === "removed") {
    aiFlags.push({ type: "source_removed", label: "Source link not resolvable — estate + road context kept", severity: "amber" });
  }

  // 6 — poster (created on first post; verification stays pending → out of green catalog)
  const handle = posterHandle || `@${gate.handle || "keja_poster"}`;
  let poster = await db.agent.findUnique({ where: { tiktokHandle: handle } });
  if (!poster) {
    poster = await db.agent.create({
      data: {
        role: role && ROLES.includes(role) ? role : "Agent",
        phone: posterPhone || "+254700000000",
        tiktokHandle: handle,
        verificationStatus: "pending",
        bio: "New poster — verification in progress.",
        listingsCount: 1,
      },
    });
  } else {
    await db.agent.update({ where: { id: poster.id }, data: { listingsCount: { increment: 1 } } });
  }

  // 7 — CREATE: links + tags only. expires_at = now + 7 days.
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const photoLinksClean = (Array.isArray(photoLinks) ? photoLinks : [])
    .map((s) => String(s).trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .slice(0, 3); // max 3 external photo links

  const created = await db.listing.create({
    data: {
      posterId: poster.id,
      title: `${finalBeds} • ${finalEstate} • ${road || finalEstate}`,
      tiktokUrl: String(tiktokUrl).trim(),
      videoId: gate.videoId,
      thumbnailLink: linkObject.thumbnailLink,
      embedHtmlLink: linkObject.oembedHtmlLink,
      authorLink: linkObject.authorUrl,
      sourceState: linkObject.source,
      role: role && ROLES.includes(role) ? role : "Agent",
      mandateLink: mandateLink || null,
      kplcBillLink: kplcBillLink || null,
      titleDocLink: titleDocLink || null,
      estate: finalEstate,
      subCounty: subCounty || "",
      borough: borough || "",
      road: road || null,
      price: finalPrice,
      deposit: Number(deposit) || finalPrice,
      beds: finalBeds,
      status: "Available",
      publishState: "pending_review",
      amenities: JSON.stringify(Array.isArray(amenities) ? amenities : []),
      lat: Number.isFinite(Number(lat)) ? Number(lat) : 0,
      lng: Number.isFinite(Number(lng)) ? Number(lng) : 0,
      photos: JSON.stringify(photoLinksClean),
      aiFlags: JSON.stringify(aiFlags),
      fee,
      freshH: 0,
      responseTime: 30,
      reportsCount: 0,
      expiresAt,
    },
  });

  await audit(db, {
    actor: poster.tiktokHandle,
    action: "listing.create.link_only",
    object: "listing",
    objectId: created.id,
    metadata: {
      videoId: gate.videoId,
      estate: finalEstate,
      price: finalPrice,
      fee,
      bait: bait.bait,
      source: linkObject.source,
      storedLinks: ["tiktokUrl", "thumbnailLink", "embedHtmlLink", "authorLink", ...photoLinksClean.map((_, i) => `photoLink${i + 1}`)],
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      videoId: gate.videoId,
      tiktokUrl: created.tiktokUrl,
      thumbnailLink: created.thumbnailLink,
      embedHtmlLink: created.embedHtmlLink,
      status: created.status,
      publishState: created.publishState,
      fee,
      bait: bait.bait,
      source: linkObject.source,
      aiFlags,
    },
    { status: 201 },
  );
}
