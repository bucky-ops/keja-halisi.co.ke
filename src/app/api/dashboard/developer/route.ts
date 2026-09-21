// GET /api/dashboard/developer — projects, units, leads, payments (masked phones)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toProjectDTO, toLeadDTO, toPaymentDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle") || "@syokimau_developer";
  const agent = await db.agent.findUnique({
    where: { tiktokHandle: handle },
    include: { developer: { include: { units: { orderBy: { code: "asc" } } } } },
  });
  if (!agent?.developer) return NextResponse.json({ error: "Developer not found" }, { status: 404 });

  const [listings, payments] = await Promise.all([
    db.listing.findMany({
      where: { posterId: agent.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { poster: true },
    }),
    db.payment.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const leads = await db.lead.findMany({
    where: { listingId: { in: listings.map((l) => l.id) } },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { listing: { select: { title: true, estate: true } } },
  });

  return NextResponse.json({
    developer: toProjectDTO(agent.developer),
    leads: leads.map(toLeadDTO),
    payments: payments.map(toPaymentDTO),
  });
}
