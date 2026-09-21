// GET /api/agents/[handle] — public agent profile + listings + verification timeline + tenant reviews
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
  const reviews = await db.review.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
  });

  // rating distribution 1..5 + average (server-computed so every client agrees)
  const dist = [0, 0, 0, 0, 0];
  for (const r of reviews) dist[Math.min(5, Math.max(1, r.stars)) - 1]++;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : agent.rating;

  return NextResponse.json({
    agent: toAgentDTO(agent),
    listings: listings.map(toListingDTO),
    verifications: verifications.map((v) => ({ docType: v.docType, status: v.status })),
    reviews: reviews.map((r) => ({
      id: r.id,
      authorHandle: r.authorHandle,
      stars: r.stars,
      text: r.text,
      verifiedStay: r.verifiedStay,
      helpful: r.helpful,
      reply: r.reply,
      repliedAt: r.repliedAt,
      createdAt: r.createdAt,
    })),
    ratingSummary: { count: reviews.length, avg: Math.round(avg * 10) / 10, dist },
  });
}
