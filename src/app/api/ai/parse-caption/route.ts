// POST /api/ai/parse-caption — Gemini Vision caption parse (mock) + TikTok link validation
import { NextRequest, NextResponse } from "next/server";

const ESTATES = ["Kileleshwa", "Lavington", "Kasarani", "Zimmerman", "Roysambu", "Syokimau", "Utawala", "Buruburu", "Umoja", "Pipeline", "Kayole", "South C", "Ngara", "Kangemi", "Kawangware"];
const ROADS: Record<string, string> = {
  Kileleshwa: "Othaya Rd", Lavington: "James Gichuru Rd", Kasarani: "Mwiki Rd", Zimmerman: "Kamiti Rd",
  Roysambu: "Lumumba Dr", Syokimau: "Airport Rd", Utawala: "Eastern Bypass", Buruburu: "Mumias South Rd",
  Umoja: "Moi Dr", Pipeline: "Pipeline Rd", Kayole: "Kayole Spine Rd", "South C": "Muhoho Ave",
  Ngara: "Park Rd", Kangemi: "Waiyaki Way", Kawangware: "Ngong Rd",
};

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const link = String(url ?? "");

  if (!link.includes("tiktok.com/@") || !/\/video\//.test(link)) {
    return NextResponse.json({ error: "Invalid TikTok link — must be tiktok.com/@handle/video/..." }, { status: 400 });
  }

  // Mock Gemini Vision extraction (deterministic-ish from URL hash)
  const hash = Math.abs(link.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const estate = ESTATES[hash % ESTATES.length];
  const beds = ["Bedsitter", "1BR", "1BR", "2BR"][hash % 4];
  const priceRanges: Record<string, [number, number]> = {
    Bedsitter: [7000, 12000], "1BR": [12000, 35000], "2BR": [18000, 45000],
  };
  const [lo, hi] = priceRanges[beds];
  const price = lo + (hash % 12) * ((hi - lo) / 12);

  return NextResponse.json({
    valid: true,
    price: Math.round(price / 500) * 500,
    beds,
    estate,
    road: ROADS[estate] ?? "Main Rd",
  });
}
