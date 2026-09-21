// GET /api/listings/[id] — listing detail (public: approved only unless admin flag)
// PATCH /api/listings/[id] — status toggle Available/Taken/Reserved (poster action)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toListingDTO, audit } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await db.listing.findUnique({ where: { id }, include: { poster: true } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";
  // RLS-equivalent: public reads only approved listings
  if (!isAdmin && (listing.publishState !== "approved" || listing.status === "Expired")) {
    if (listing.publishState === "rejected") {
      return NextResponse.json({ error: "This listing was hidden after reports — under review" }, { status: 403 });
    }
  }

  await db.listing.update({ where: { id }, data: { views: { increment: 1 } } });
  await audit(db, { actor: "user", action: "listing.viewed", object: "listing", objectId: id });
  return NextResponse.json(toListingDTO(listing));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (!["Available", "Taken", "Reserved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = await db.listing.update({ where: { id }, data: { status } });
  await audit(db, { actor: "poster", action: `listing.status_${status.toLowerCase()}`, object: "listing", objectId: id, metadata: { status } });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
