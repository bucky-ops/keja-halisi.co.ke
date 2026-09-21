// GET /api/agents/[handle] — public agent profile + listings + verification timeline
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAgentDTO, toListingDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const agent = await db.agent.findUnique({ where: { tiktokHandle: decodeURIComponent(handle) } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const listings = await db.listing.findMany({
    where: { posterId: agent.id, publishState: "approved" },
    orderBy: { createdAt: "desc" },
    include: { poster: true },
  });
  const verifications = await db.verification.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    agent: toAgentDTO(agent),
    listings: listings.map(toListingDTO),
    verifications: verifications.map((v) => ({ docType: v.docType, status: v.status })),
  });
}
