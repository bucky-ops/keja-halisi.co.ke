// GET /api/listings — public read: Available + approved only (RLS-equivalent)
// POST /api/listings — create listing (pending_review), AI checks
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toListingDTO, audit } from "@/lib/serialize";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // lazy expiry (mirrors cron): flip anything past expires_at
  await db.listing.updateMany({
    where: { status: { in: ["Available", "Reserved"] }, expiresAt: { lt: new Date() } },
    data: { status: "Expired" },
  });

  const sp = req.nextUrl.searchParams;
  const admin = sp.get("admin") === "true";

  const where: Prisma.ListingWhereInput = {};
  if (!admin) {
    where.publishState = "approved";
    where.status = "Available";
  }
  const q = sp.get("q");
  if (q) {
    where.OR = [
      { estate: { contains: q } },
      { title: { contains: q } },
      { subCounty: { contains: q } },
      { road: { contains: q } },
    ];
  }
  const borough = sp.get("borough");
  if (borough) where.borough = borough;
  const subCounty = sp.get("subCounty");
  if (subCounty) where.subCounty = subCounty;
  const estate = sp.get("estate");
  if (estate) where.estate = { contains: estate };
  const beds = sp.get("beds");
  if (beds) where.beds = beds;
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice && Number(maxPrice) < 100000 ? { lte: Number(maxPrice) } : {}),
    };
  }
  if (sp.get("fresh") === "true") where.freshH = { lte: 24 };
  if (sp.get("noFee") === "true") where.fee = false;
  if (sp.get("available") === "true") where.status = "Available";

  const sort = sp.get("sort") ?? "fresh";
  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" }
    : sort === "price_desc" ? { price: "desc" }
    : sort === "response" ? { responseTime: "asc" }
    : { createdAt: "desc" };

  const rows = await db.listing.findMany({
    where,
    orderBy,
    take: Math.min(Number(sp.get("limit") ?? 60), 100),
    include: { poster: true },
  });

  let listings = rows.map(toListingDTO);
  if (sp.get("verified") === "true") {
    listings = listings.filter((l) => ["verified", "gold", "caretaker"].includes(l.poster.verificationStatus));
  }

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    tiktokUrl, title, estate, subCounty, borough, road, price, deposit, beds,
    amenities, posterHandle, evidence, fee, sizeSqm, floor, role,
  } = body;

  if (!tiktokUrl || !String(tiktokUrl).includes("tiktok.com/")) {
    return NextResponse.json({ error: "Invalid TikTok link — must be tiktok.com/@handle/video/..." }, { status: 400 });
  }
  if (!estate || !price || !beds) {
    return NextResponse.json({ error: "estate, price and beds are required" }, { status: 400 });
  }
  // Evidence checklist enforcement — 5 items required before publish
  const ev: string[] = Array.isArray(evidence) ? evidence : [];
  if (ev.length < 5) {
    await audit(db, { actor: "system", action: "evidence_checklist.blocked", object: "listing", metadata: { estate, missing: 5 - ev.length } });
    return NextResponse.json({ error: "Evidence checklist incomplete — all 5 clips required (Outside • Gate • Inside • Water running • Window view)" }, { status: 422 });
  }

  let poster = posterHandle
    ? await db.agent.findUnique({ where: { tiktokHandle: posterHandle } })
    : null;
  if (!poster) {
    poster = await db.agent.create({
      data: {
        role: role || "Agent",
        phone: body.posterPhone || "+254700000000",
        tiktokHandle: posterHandle || "@demo_poster",
        verificationStatus: "pending",
        bio: "New poster — verification in progress.",
        listingsCount: 1,
      },
    });
  } else {
    await db.agent.update({ where: { id: poster.id }, data: { listingsCount: { increment: 1 } } });
  }

  const estateRow = await db.estate.findFirst({ where: { name: estate } });
  const aiFlags: { type: string; label: string; severity: string }[] = [];
  if (fee) aiFlags.push({ type: "fee_signal", label: "Viewing-fee signal in caption", severity: "red" });
  if (beds === "1BR" && ["Kileleshwa", "Lavington", "Parklands"].includes(estate) && price < 15000) {
    aiFlags.push({ type: "price_anomaly", label: `1BR ${estate} KES ${Number(price).toLocaleString()} — bait?`, severity: "amber" });
  }
  const dup = await db.listing.findFirst({ where: { tiktokUrl }, include: { poster: true } });
  if (dup) {
    aiFlags.push({ type: "repost", label: dup.posterId !== poster.id ? `Repost 80% match ${dup.poster.tiktokHandle}` : "Repost — duplicate of own earlier listing", severity: "red" });
  }

  const created = await db.listing.create({
    data: {
      posterId: poster.id,
      title: title || `${beds} • ${estate}`,
      tiktokUrl,
      estate,
      subCounty: subCounty || estateRow?.subCounty || "Westlands",
      borough: borough || estateRow?.borough || "Western",
      road: road || null,
      price: Number(price),
      deposit: Number(deposit ?? price),
      beds,
      amenities: JSON.stringify(amenities ?? []),
      lat: estateRow?.lat ?? -1.29,
      lng: estateRow?.lng ?? 36.8,
      distanceToRoadM: Number(body.distanceToRoadM ?? 300),
      weatherCache: JSON.stringify({ temp: 22, note: "usual, rainy Mar-May" }),
      photos: JSON.stringify(body.photos ?? ["p1", "p2", "p3"]),
      aiFlags: JSON.stringify(aiFlags),
      fee: Boolean(fee),
      freshH: 0,
      responseTime: poster.responseTime,
      sizeSqm: sizeSqm ? Number(sizeSqm) : null,
      floor: floor || null,
      exactNumberEnc: `vault://doors/${Date.now()}/house-number.enc`,
      publishState: "pending_review",
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });

  await audit(db, {
    actor: poster.tiktokHandle,
    action: "listing.submitted",
    object: "listing",
    objectId: created.id,
    metadata: { estate, price, beds, evidence: ev, fee },
  });

  return NextResponse.json({ id: created.id, publishState: created.publishState, aiFlags }, { status: 201 });
}
