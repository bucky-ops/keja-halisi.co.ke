export const dynamic = "force-dynamic";
// GET /api/admin/analytics — 14-day trust trend buckets (listings / reports / leads).
// SQLite-friendly: fetch last-14d createdAt rows and bucket in JS (demo dataset is small).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const DAYS = 14;

export async function GET(req: NextRequest) {
if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }
  const now = Date.now();
  // window = the 14 calendar days ENDING today (inclusive) — rows from "today" must land in the last bucket
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (DAYS - 1) * 86_400_000);
  const end = new Date(today.getTime() + 86_400_000);

  const prevStart = new Date(start.getTime() - DAYS * 24 * 3_600_000);

  const [listings, reports, leads, prevListings, prevReports, prevLeads] = await Promise.all([
    db.listing.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { createdAt: true } }),
    db.report.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { createdAt: true } }),
    db.lead.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { createdAt: true } }),
    db.listing.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
    db.report.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
    db.lead.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
  ]);

  const dayLabel = (d: Date) => d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });

  const days: string[] = [];
  for (let i = 0; i < DAYS; i++) {
    days.push(dayLabel(new Date(start.getTime() + i * 24 * 3_600_000)));
  }

  const bucket = (rows: { createdAt: Date }[]) => {
    const arr = new Array(DAYS).fill(0);
    for (const r of rows) {
      const idx = Math.floor((r.createdAt.getTime() - start.getTime()) / 86_400_000);
      if (idx >= 0 && idx < DAYS) arr[idx]++;
    }
    return arr;
  };

  const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

  return NextResponse.json({
    days,
    listings: bucket(listings),
    reports: bucket(reports),
    leads: bucket(leads),
    totals: {
      listings: listings.length,
      reports: reports.length,
      leads: leads.length,
    },
    deltas: {
      listings: pct(listings.length, prevListings),
      reports: pct(reports.length, prevReports),
      leads: pct(leads.length, prevLeads),
    },
  });
}
