// GET /api/market-trends — sub-county market pulse: avg price + count
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [listings, estates] = await Promise.all([
    db.listing.findMany({ where: { publishState: "approved" }, select: { subCounty: true, price: true } }),
    db.estate.findMany({ select: { subCounty: true, borough: true, avgPrice: true, name: true } }),
  ]);

  const trends = estates.map((e) => {
    const inSub = listings.filter((l) => l.subCounty === e.subCounty);
    const estateListings = listings.filter((l) => l.subCounty === e.subCounty);
    const live = estateListings.length > 0
      ? Math.round(estateListings.reduce((a, l) => a + l.price, 0) / estateListings.length)
      : e.avgPrice;
    void inSub;
    return {
      borough: e.borough,
      subCounty: e.subCounty,
      estate: e.name,
      avgPrice: live,
      count: estateListings.length,
    };
  });

  return NextResponse.json(trends);
}
