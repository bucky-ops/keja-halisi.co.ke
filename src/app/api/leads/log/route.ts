export const dynamic = "force-dynamic";
// POST /api/leads/log — lead logging by videoId (spec contract)
//
// body: { videoId, action: "Call" | "WhatsApp" | "TikTok" }
// Logs the lead with phone_masked LINK only (never the full number) + writes an
// audit event. The full phone is NOT returned by this endpoint — the client
// completes user-initiated contact via the existing /api/leads flow which logs
// first, then reveals.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

const ACTION_MAP: Record<string, string> = { Call: "call", WhatsApp: "whatsapp", TikTok: "tiktok" };

export async function POST(req: NextRequest) {
  let body: { videoId?: string; listingId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = ACTION_MAP[body.action ?? ""] ?? body.action;
  if (!["call", "whatsapp", "tiktok"].includes(action ?? "")) {
    return NextResponse.json({ error: "action must be Call | WhatsApp | TikTok" }, { status: 400 });
  }

  const listing = body.videoId
    ? await db.listing.findFirst({ where: { videoId: body.videoId }, include: { poster: true } })
    : body.listingId
      ? await db.listing.findUnique({ where: { id: body.listingId }, include: { poster: true } })
      : null;

  if (!listing) return NextResponse.json({ error: "Listing not found for videoId" }, { status: 404 });

  const digits = listing.poster.phone.replace(/\D/g, "");
  const phoneMasked = `07** *** ${digits.slice(-3)}`;

  await db.lead.create({ data: { listingId: listing.id, action, phoneMasked } });
  await audit(db, {
    actor: "user",
    action: `lead.${action}`,
    object: "listing",
    objectId: listing.id,
    metadata: { videoId: listing.videoId ?? "", phoneMasked, estate: listing.estate },
  });

  return NextResponse.json({ ok: true, videoId: listing.videoId, action, phoneMasked });
}
