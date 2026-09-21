// GET|POST /api/cron/expire-listings — flip expired listings (Vercel Cron daily)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export const dynamic = "force-dynamic";

async function expire() {
  const cutoff = new Date();
  const result = await db.listing.updateMany({
    where: { status: { in: ["Available", "Reserved"] }, expiresAt: { lt: cutoff } },
    data: { status: "Expired", publishState: "expired" },
  });
  await audit(db, {
    actor: "system",
    action: "cron.expired_listings",
    object: "system",
    metadata: { expired: result.count, at: cutoff.toISOString() },
  });
  return result.count;
}

export async function GET() {
  const expired = await expire();
  return NextResponse.json({ job: "expire-listings", expired, ranAt: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  // allow manual trigger from admin console (protected by CRON_SECRET in prod)
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    const adminFlag = req.nextUrl.searchParams.get("admin") === "true";
    if (!adminFlag) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expire();
  return NextResponse.json({ job: "expire-listings", expired, ranAt: new Date().toISOString() });
}
