// POST /api/ai/estate-blurb — LLM estate orientation guide (Gemini-class model)
// Server-only SDK call with deterministic offline fallback + in-memory cache.
import { NextRequest, NextResponse } from "next/server";

// local memory cache — estate → blurb (process lifetime)
const cache = new Map<string, { text: string; source: "ai" | "offline" }>();

function offlineBlurb(estate: string): string {
  // deterministic, estate-flavoured template used when the LLM is unreachable
  const seed = estate.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const vibes = [
    "leafy and quiet with tree-lined access roads",
    "busy and affordable with quick matatu connections",
    "a solid mid-range mix of walk-ups and gated courts",
    "family-friendly with Sunday-morning street calm",
    "young and buzzing — kibanda coffee and boda stages everywhere",
  ];
  const water = ["county water is piped most days, but ask about borehole backup", "most blocks run borehole + storage tanks, so water is steady", "water pressure drops on weekends — a tank is the norm"];
  const transport = ["matatus to the CBD take 20-35 minutes outside rush hour", "you are a short boda hop from the main road, 15-40 min to town", "direct matatu stages mean you rarely wait more than 10 minutes"];
  return `${estate} is ${vibes[seed % vibes.length]}. During the viewing, confirm the water situation — ${water[seed % water.length]} — and test the evening commute: ${transport[seed % transport.length]}. Visit at night once before paying deposit; check the gate, lights and drainage.`;
}

export async function POST(req: NextRequest) {
  const { estate } = await req.json().catch(() => ({ estate: "" }));
  const key = String(estate ?? "").trim().slice(0, 40) || "Nairobi";

  const cached = cache.get(key);
  if (cached) return NextResponse.json(cached);

  try {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a concise Nairobi estate guide for a rental anti-scam platform. Write EXACTLY 2 sentences (max 45 words) about the estate: 1) vibe/housing stock, 2) one practical thing a renter should verify during a viewing (water, commute, security, drainage). Warm, factual, Sheng-friendly but professional. No emojis, no markdown, no disclaimers.",
        },
        { role: "user", content: `Estate: ${key}, Nairobi, Kenya.` },
      ],
      temperature: 0.6,
      max_tokens: 120,
    });
    const text = (completion.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    if (!text || text.length < 30) throw new Error("empty blurb");
    const payload = { text, source: "ai" as const };
    cache.set(key, payload);
    return NextResponse.json(payload);
  } catch {
    // offline / no key — deterministic fallback keeps the trust UX alive
    const payload = { text: offlineBlurb(key), source: "offline" as const };
    cache.set(key, payload);
    return NextResponse.json(payload);
  }
}
