// GET /api/market/fair-price?estate=&beds=&price=&exclude=
// Anti-bait pricing engine: compares a listing's rent against live comps.
// Tiered matching: same estate + beds → same sub-county + beds → same borough + beds.
// Falls back to the seeded estate average when the catalog is thin.
// Verdict bands (vs median): ≤0.62 bait · ≤0.85 below · ≤1.15 fair · ≤1.4 above · else high
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Band = "bait" | "below" | "fair" | "above" | "high";

const VERDICTS: Record<Band, { label: string; tone: "ok" | "warn" | "scam"; note: string }> = {
  bait: {
    label: "Bait price?",
    tone: "scam",
    note: "Suspiciously cheap vs the estate median. Classic bait pattern — verify on video before any transaction.",
  },
  below: {
    label: "Below market",
    tone: "ok",
    note: "Cheaper than most comps here. Good deal — just confirm it's real with an evidence walkthrough.",
  },
  fair: {
    label: "Fair market price",
    tone: "ok",
    note: "Right in line with what similar kejas go for in this area.",
  },
  above: {
    label: "Above market",
    tone: "warn",
    note: "Priced higher than most comps. Negotiate or ask what justifies the premium (furnishing, fibre, parking).",
  },
  high: {
    label: "Well above market",
    tone: "warn",
    note: "Top of the range for this area. Compare 2-3 similar kejas before committing the deposit.",
  },
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function bandFor(price: number, anchor: number): Band {
  return price <= anchor * 0.62 ? "bait" : price <= anchor * 0.85 ? "below" : price <= anchor * 1.15 ? "fair" : price <= anchor * 1.4 ? "above" : "high";
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const estate = sp.get("estate")?.trim() || "";
  const beds = sp.get("beds")?.trim() || "";
  const price = Number(sp.get("price") || 0);
  const exclude = sp.get("exclude")?.trim() || "";

  if (!estate || !beds || !price) {
    return NextResponse.json({ error: "estate, beds and price are required" }, { status: 400 });
  }

  const base = {
    publishState: "approved" as const,
    status: { not: "Expired" as const },
    id: exclude ? { not: exclude } : undefined,
  };

  const estateRow = await db.estate.findFirst({ where: { name: estate } });

  // tier 1: same estate + same beds
  let comps = await db.listing.findMany({
    where: { ...base, estate, beds },
    select: { price: true, estate: true, subCounty: true, borough: true },
  });
  let scope: "estate" | "sub-county" | "borough" | "seed-average" = "estate";

  // tier 2: same sub-county + beds
  if (comps.length < 3 && estateRow?.subCounty) {
    const wider = await db.listing.findMany({
      where: { ...base, subCounty: estateRow.subCounty, beds, estate: { not: estate } },
      select: { price: true, estate: true, subCounty: true, borough: true },
    });
    if (wider.length > 0) comps = [...comps, ...wider];
    if (comps.length >= 3) scope = "sub-county";
  }

  // tier 3: same borough + beds
  if (comps.length < 3 && estateRow?.borough) {
    const widest = await db.listing.findMany({
      where: { ...base, borough: estateRow.borough, beds, estate: { not: estate } },
      select: { price: true, estate: true, subCounty: true, borough: true },
    });
    if (widest.length > 0) comps = [...comps, ...widest];
    if (comps.length >= 3) scope = "borough";
  }

  // final fallback: seeded estate average scaled by beds type
  // (estate avgPrice ≈ 1BR baseline; calibrated against the seed catalog:
  //  Kasarani 13k → bedsitter ~9.1k, 1BR 13k, 2BR ~20k, 3BR ~26k)
  if (comps.length < 3 && estateRow) {
    const mult = beds === "Bedsitter" ? 0.7 : beds === "1BR" ? 1 : beds === "2BR" ? 1.55 : 2;
    const seeded = Math.round((estateRow.avgPrice * mult) / 500) * 500;
    if (seeded > 0) {
      const band = bandFor(price, seeded);
      return NextResponse.json({
        price,
        band,
        verdict: VERDICTS[band],
        stats: {
          min: Math.round(seeded * 0.8),
          p25: Math.round(seeded * 0.92),
          median: seeded,
          p75: Math.round(seeded * 1.12),
          max: Math.round(seeded * 1.3),
        },
        compCount: 0,
        scope: "seed-average" as const,
        estate,
        beds,
      });
    }
    return NextResponse.json({ error: "No market data for this area yet" }, { status: 404 });
  }

  const prices = comps.map((c) => c.price);
  const med = median(prices);
  const s = [...prices].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const stats = { min: s[0], p25: q(0.25), median: med, p75: q(0.75), max: s[s.length - 1] };

  const band = bandFor(price, med);

  return NextResponse.json({
    price,
    band,
    verdict: VERDICTS[band],
    stats,
    compCount: comps.length,
    scope,
    estate,
    beds,
  });
}
