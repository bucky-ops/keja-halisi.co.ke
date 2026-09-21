export const dynamic = "force-dynamic";
// POST /api/ai/estate-blurb — LLM estate orientation guide (Gemini-class model)
// Server-only SDK call with deterministic offline fallback + in-memory cache.
// lang: "en" (default) | "sheng" — Nairobi Sheng-English street mix for round-10 toggle.
import { NextRequest, NextResponse } from "next/server";

type BlurbLang = "en" | "sheng";

// local memory cache — `${estate}:${lang}` → blurb (process lifetime)
const cache = new Map<string, { text: string; source: "ai" | "offline" }>();

function offlineBlurb(estate: string, lang: BlurbLang): string {
  // deterministic, estate-flavoured template used when the LLM is unreachable
  const seed = estate.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (lang === "sheng") {
    const vibes = [
      "ni mtaa wa poa, quiet sana na barabara zina miti",
      "ni place ya kubambika — stack za nyumba na matatu kila mahali",
      "ni mix poa ya walk-ups na gated courts, bei iko sawa",
      "ni family mtaa — Sunday asubuhi ni calm sana",
      "ni mtaa wa vijana — kibanda coffee na boda stage kila corner",
    ];
    const water = ["county water inakuja most days, lakini uliza borehole backup", "blocks nyingi zina borehole na tanks, maji iko poa", "maji hushuka pressure weekends — tank ni lazima"];
    const transport = ["matatu za CBD zinachukua 20-35 minutes nje ya rush hour", "uko boda hop moja na barabara kuu, 15-40 min town", "stage za direct zipo, huwa haingoji zaidi ya dakika 10"];
    return `${estate} ${vibes[seed % vibes.length]}. Ukiwa viewing, thibitisha hali ya maji — ${water[seed % water.length]} — na ujielekeze commute ya jioni: ${transport[seed % transport.length]}. Njoo usiku mara moja kabla ya kulipa deposit; angalia gate, taa na drainage.`;
  }
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
  const body = await req.json().catch(() => ({ estate: "", lang: "en" }));
  const key = String(body.estate ?? "").trim().slice(0, 40) || "Nairobi";
  const lang: BlurbLang = body.lang === "sheng" ? "sheng" : "en";
  const cacheKey = `${key}:${lang}`;

  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json({ ...cached, lang });

  try {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const system =
      lang === "sheng"
        ? "You are a concise Nairobi estate guide for a rental anti-scam platform. Write EXACTLY 2 sentences (max 45 words) about the estate IN NAIROBI SHENG (Swahili-English street mix as actually spoken in Nairobi, e.g. 'mtaa', 'poa', 'kibanda', 'bambika'): 1) vibe/housing stock, 2) one practical thing a renter should verify during a viewing (maji, commute, security, drainage). Keep it natural street talk but respectful and clear. No emojis, no markdown, no disclaimers."
        : "You are a concise Nairobi estate guide for a rental anti-scam platform. Write EXACTLY 2 sentences (max 45 words) about the estate: 1) vibe/housing stock, 2) one practical thing a renter should verify during a viewing (water, commute, security, drainage). Warm, factual, Sheng-friendly but professional. No emojis, no markdown, no disclaimers.";
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Estate: ${key}, Nairobi, Kenya.` },
      ],
      temperature: 0.6,
      max_tokens: 120,
    });
    const text = (completion.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    if (!text || text.length < 30) throw new Error("empty blurb");
    const payload = { text, source: "ai" as const, lang };
    cache.set(cacheKey, { text, source: "ai" });
    return NextResponse.json(payload);
  } catch {
    // offline / no key — deterministic fallback keeps the trust UX alive
    const payload = { text: offlineBlurb(key, lang), source: "offline" as const, lang };
    cache.set(cacheKey, { text: payload.text, source: "offline" });
    return NextResponse.json(payload);
  }
}
