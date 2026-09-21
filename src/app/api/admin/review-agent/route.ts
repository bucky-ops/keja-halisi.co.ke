export const dynamic = "force-dynamic";
// POST /api/admin/review-agent — approve/reject verification (audit logged)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const { agentId, decision, reason } = await req.json();
  if (!agentId || !["verified", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "agentId and decision (verified|rejected) required" }, { status: 400 });
  }
  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const status = agent.role === "Caretaker" && decision === "verified" ? "caretaker" : decision;
  await db.agent.update({
    where: { id: agentId },
    data: {
      verificationStatus: status,
      verifiedSince: decision === "verified" ? new Date() : null,
      badge: agent.role === "Developer" && decision === "verified" ? "Gold" : null,
    },
  });
  await db.verification.updateMany({
    where: { agentId, status: "pending" },
    data: { status: decision === "verified" ? "verified" : "rejected", reviewer: "admin", reviewedAt: new Date() },
  });
  await audit(db, {
    actor: "admin",
    action: decision === "verified" ? "agent.approved" : "agent.rejected",
    object: "agent",
    objectId: agentId,
    metadata: { handle: agent.tiktokHandle, role: agent.role, reason: reason ?? null },
  });
  return NextResponse.json({ ok: true, status });
}
