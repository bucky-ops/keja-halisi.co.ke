export const dynamic = "force-dynamic";
// POST /api/admin/review-listing — approve/reject listing (publish_state)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const { listingId, decision, reason } = await req.json();
  if (!listingId || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "listingId and decision (approved|rejected) required" }, { status: 400 });
  }
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await db.listing.update({
    where: { id: listingId },
    data: { publishState: decision, ...(decision === "rejected" ? { status: "Taken" } : {}) },
  });
  await audit(db, {
    actor: "admin",
    action: `listing.${decision}`,
    object: "listing",
    objectId: listingId,
    metadata: { estate: listing.estate, reason: reason ?? null, aiFlags: listing.aiFlags },
  });
  return NextResponse.json({ ok: true, publishState: decision });
}
