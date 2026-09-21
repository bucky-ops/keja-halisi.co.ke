// GET|POST /api/cron/nudge-availability — "Is keja still available? Reply YES/NO" (Africa's Talking mock)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export const dynamic = "force-dynamic";

async function nudge() {
  const in72h = new Date(Date.now() + 72 * 3600 * 1000);
  const expiring = await db.listing.findMany({
    where: { status: "Available", publishState: "approved", expiresAt: { lte: in72h } },
    include: { poster: true },
  });

  const sms = expiring.map((l) => ({
    to: l.poster.phone.replace(/\D/g, "").slice(-9),
    message: `Is keja still available? Reply YES/NO • ${l.estate} ${l.beds} KES ${l.price.toLocaleString()} • Keja Halisi re-check`,
  }));

  await audit(db, {
    actor: "system",
    action: "cron.nudge_availability",
    object: "system",
    metadata: { nudged: sms.length, channel: "africastalking (mock)" },
  });

  return { nudged: sms.length, sms: sms.slice(0, 10) };
}

export async function GET() {
  const result = await nudge();
  return NextResponse.json({ job: "nudge-availability", ...result, ranAt: new Date().toISOString() });
}

export async function POST() {
  const result = await nudge();
  return NextResponse.json({ job: "nudge-availability", ...result, ranAt: new Date().toISOString() });
}
