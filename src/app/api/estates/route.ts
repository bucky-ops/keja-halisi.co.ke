export const dynamic = "force-dynamic";
// GET /api/estates — serves the canonical estates.json catalog
// (59 estates • 6 boroughs × 17 sub-counties • aliasMap • priceBuckets • mainRoads).
// Powers the /post cascading dropdowns and the client inverted index.
import { NextResponse } from "next/server";
import { ESTATES_DATA } from "@/lib/estates-data";

export async function GET() {
  return NextResponse.json(ESTATES_DATA);
}
