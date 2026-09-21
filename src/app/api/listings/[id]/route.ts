// GET /api/listings/[id] — listing detail (public: approved only unless admin flag)
// PATCH /api/listings/[id] — poster tools:
//   { status }            → Available/Taken/Reserved toggle
//   { price, deposit? }   → price edit (audit-logged)
//   { action: "relist" }  → extend expiry 7d + back to Available (72h re-check flow)
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
  const body = await req.json();
  const { status, price, deposit, action } = body as {
    status?: string;
    price?: number;
    deposit?: number;
    action?: string;
  };

  if (action === "relist") {
    const updated = await db.listing.update({
      where: { id },
      data: {
        status: "Available",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        freshH: 0,
      },
    });
    await audit(db, { actor: "poster", action: "listing.relisted", object: "listing", objectId: id, metadata: { expiresAt: updated.expiresAt.toISOString() } });
    return NextResponse.json({ id: updated.id, status: updated.status, expiresAt: updated.expiresAt });
  }

  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 1000 || p > 1_000_000) {
      return NextResponse.json({ error: "Price must be KES 1,000 - 1,000,000" }, { status: 400 });
    }
    const data: Record<string, number> = { price: Math.round(p) };
    if (deposit !== undefined && Number.isFinite(Number(deposit))) {
      const d = Number(deposit);
      if (d < 0 || d > 1_000_000) return NextResponse.json({ error: "Invalid deposit" }, { status: 400 });
      data.deposit = Math.round(d);
    }
    const updated = await db.listing.update({ where: { id }, data });
    await audit(db, { actor: "poster", action: "listing.price_updated", object: "listing", objectId: id, metadata: data });
    return NextResponse.json({ id: updated.id, price: updated.price, deposit: updated.deposit });
  }

  if (!status || !["Available", "Taken", "Reserved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = await db.listing.update({ where: { id }, data: { status } });
  await audit(db, { actor: "poster", action: `listing.status_${status.toLowerCase()}`, object: "listing", objectId: id, metadata: { status } });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
