export const dynamic = "force-dynamic";
// POST /api/leads — log lead with masked phone (minimum necessary contact data)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const { listingId, action } = await req.json();
  if (!listingId || !["call", "whatsapp", "tiktok"].includes(action)) {
    return NextResponse.json({ error: "listingId and valid action (call|whatsapp|tiktok) required" }, { status: 400 });
  }

  const listing = await db.listing.findUnique({ where: { id: listingId }, include: { poster: true } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const digits = listing.poster.phone.replace(/\D/g, "");
  const phoneMasked = `07** *** ${digits.slice(-3)}`;

  await db.lead.create({ data: { listingId, action, phoneMasked } });
  await audit(db, {
    actor: "user",
    action: `lead.${action}`,
    object: "listing",
    objectId: listingId,
    metadata: { phoneMasked, estate: listing.estate },
  });

  // NOTE: we return the poster phone so the client can complete the *user-initiated*
  // contact action after logging. It is only revealed post-lead, per privacy rule.
  return NextResponse.json({ phoneMasked, phone: listing.poster.phone });
}
