export const dynamic = "force-dynamic";
// POST /api/ai/parse-caption — TikTok link parse via oEmbed retrieval + demo mock fallback
//
// Contract (kept EXACTLY, additive `source` field only — the PostView wizard's
// parseCaption() client consumes { price, beds, estate, road, valid }):
//   { valid: boolean, price: number, beds: string, estate: string, road: string,
//     source: "oembed" | "mock" }
//
// New behavior: resolve the TikTok link through the link-only retrieval engine
// (tiktok.com/oembed metadata only — never video bytes). If the oEmbed fetch
// succeeds (source "oembed"), parsed caption values are returned with valid:true.
// If oEmbed is unreachable (sandbox/offline, link 404), we fall back to the
// original deterministic demo mock below so the wizard stays fully functional.

import { NextRequest, NextResponse } from "next/server";
import { resolveLinkObject } from "@/lib/retrieval";

const ESTATES = ["Kileleshwa", "Lavington", "Kasarani", "Zimmerman", "Roysambu", "Syokimau", "Utawala", "Buruburu", "Umoja", "Pipeline", "Kayole", "South C", "Ngara", "Kangemi", "Kawangware"];
const ROADS: Record<string, string> = {
  Kileleshwa: "Othaya Rd", Lavington: "James Gichuru Rd", Kasarani: "Mwiki Rd", Zimmerman: "Kamiti Rd",
  Roysambu: "Lumumba Dr", Syokimau: "Airport Rd", Utawala: "Eastern Bypass", Buruburu: "Mumias South Rd",
  Umoja: "Moi Dr", Pipeline: "Pipeline Rd", Kayole: "Kayole Spine Rd", "South C": "Muhoho Ave",
  Ngara: "Park Rd", Kangemi: "Waiyaki Way", Kawangware: "Ngong Rd",
};

/** Deterministic demo mock (offline fallback) — logic preserved from the original route. */
function mockParse(link: string) {
  const hash = Math.abs(link.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const estate = ESTATES[hash % ESTATES.length];
  const beds = ["Bedsitter", "1BR", "1BR", "2BR"][hash % 4];
  const priceRanges: Record<string, [number, number]> = {
    Bedsitter: [7000, 12000], "1BR": [12000, 35000], "2BR": [18000, 45000],
  };
  const [lo, hi] = priceRanges[beds];
  const price = lo + (hash % 12) * ((hi - lo) / 12);

  return {
    valid: true,
    price: Math.round(price / 500) * 500,
    beds,
    estate,
    road: ROADS[estate] ?? "Main Rd",
    source: "mock" as const,
  };
}

export async function POST(req: NextRequest) {
  let body: { url?: unknown; tiktokUrl?: unknown } = {};
  try {
    body = (await req.json()) as { url?: unknown; tiktokUrl?: unknown };
  } catch {
    // fall through — link stays "" and the 400 contract below applies
  }
  const link = String(body?.url ?? body?.tiktokUrl ?? "");

  if (!link.includes("tiktok.com/@") || !/\/video\//.test(link)) {
    return NextResponse.json({ error: "Invalid TikTok link — must be tiktok.com/@handle/video/..." }, { status: 400 });
  }

  const resolved = await resolveLinkObject(link);
  if (resolved.source === "oembed") {
    return NextResponse.json({
      valid: true,
      price: resolved.price,
      beds: resolved.beds,
      estate: resolved.estate,
      road: resolved.road,
      source: "oembed" as const,
    });
  }

  // oEmbed unreachable (sandbox/offline) or link removed → deterministic demo mock
  return NextResponse.json(mockParse(link));
}
