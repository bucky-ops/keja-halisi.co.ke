// PATCH /api/reviews/[id] — community interactions on tenant reviews
//   { action: "helpful" }              → +1 helpful vote (idempotency per device is a production concern; demo increments)
//   { action: "reply", text }          → agent public reply (simulated verified-poster account in demo)
// Votes never decrement; replies are logged to the append-only audit trail.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { action?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const review = await db.review.findUnique({ where: { id }, include: { agent: true } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  if (body.action === "helpful") {
    const updated = await db.review.update({ where: { id }, data: { helpful: { increment: 1 } } });
    return NextResponse.json({ id: updated.id, helpful: updated.helpful });
  }

  if (body.action === "reply") {
    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Reply text required" }, { status: 400 });
    if (text.length > 280) return NextResponse.json({ error: "Reply too long (max 280 chars)" }, { status: 400 });
    const updated = await db.review.update({
      where: { id },
      data: { reply: text, repliedAt: new Date() },
    });
    // audit trail — replies are public trust surface, so they are logged
    await db.auditEvent.create({
      data: {
        actor: "poster",
        action: "review.replied",
        object: "agent",
        objectId: review.agentId,
        metadata: JSON.stringify({ reviewId: id, author: review.authorHandle, stars: review.stars }),
      },
    });
    return NextResponse.json({ id: updated.id, reply: updated.reply, repliedAt: updated.repliedAt });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
