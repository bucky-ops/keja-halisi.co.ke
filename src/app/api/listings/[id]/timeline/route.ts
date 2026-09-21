export const dynamic = "force-dynamic";
// GET /api/listings/[id]/timeline — public trust ledger for one listing.
// Append-only audit_events filtered to meaningful lifecycle events (viewed noise excluded).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

const NOISE = ["listing.viewed", "listing.timeline_viewed"];

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const events = await db.auditEvent.findMany({
    where: { object: "listing", objectId: id, action: { notIn: NOISE } },
    orderBy: { timestamp: "desc" },
    take: 8,
  });

  // log the ledger view itself (audit stays append-only)
  await audit(db, { actor: "system", action: "listing.timeline_viewed", object: "listing", objectId: id });

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      actor: e.actor,
      action: e.action,
      timestamp: e.timestamp.toISOString(),
      metadata: e.metadata ? (JSON.parse(e.metadata) as Record<string, unknown>) : null,
    }))
  );
}
