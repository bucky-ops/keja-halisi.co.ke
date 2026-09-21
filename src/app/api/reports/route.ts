// POST /api/reports — submit report; 3 reports => auto-hide (publish_state=rejected)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

const VALID_REASONS = ["Taken", "FakePrice", "ViewingFee", "LocationFake", "AlreadyRented", "Repost"];

export async function POST(req: NextRequest) {
  const { listingId, reason, details } = await req.json();
  if (!listingId || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "listingId and a valid reason are required" }, { status: 400 });
  }

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // rate limit: max 5 reports per listing per minute window (simple heuristic)
  const recent = await db.report.count({
    where: { listingId, createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
  });
  if (recent >= 5) {
    return NextResponse.json({ error: "Rate limited — too many reports for this listing right now" }, { status: 429 });
  }

  await db.report.create({ data: { listingId, reason, details } });
  const reportsCount = listing.reportsCount + 1;
  const autoHidden = reportsCount >= 3;

  await db.listing.update({
    where: { id: listingId },
    data: {
      reportsCount,
      ...(autoHidden ? { publishState: "rejected", status: "Taken" } : {}),
    },
  });

  await audit(db, {
    actor: "user",
    action: autoHidden ? "listing.auto_hidden" : "report.submitted",
    object: "listing",
    objectId: listingId,
    metadata: { reason, reportsCount, autoHidden },
  });

  return NextResponse.json({ reportsCount, autoHidden });
}
