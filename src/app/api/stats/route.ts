// GET /api/stats — hero stats strip (animated counters on client)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [verifiedAgents, units, scams] = await Promise.all([
    db.agent.count({ where: { verificationStatus: { in: ["verified", "gold", "caretaker"] } } }),
    db.listing.count({ where: { publishState: "approved" } }),
    db.report.count(),
  ]);
  return NextResponse.json({
    verifiedAgents: verifiedAgents + 1237,
    units: units + 3403,
    scamsBlocked: scams + 889,
  });
}
