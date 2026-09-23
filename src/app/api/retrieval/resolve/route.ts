export const dynamic = "force-dynamic";
// POST /api/retrieval/resolve — link-only resolution (spec section A)
//
// Resolves a TikTok URL into a LinkObject via the retrieval engine. The ONLY
// outbound call is tiktok.com/oembed (metadata) — video/photo bytes are never
// fetched or stored. If the link 404s / oEmbed is unreachable (expected in the
// sandbox), we return source:"removed" with ok:false and HTTP 200 — the UI then
// shows "Source removed" while keeping estate+road context from parsed tags
// (POST accepts an optional `caption` / context tags for that). This route never
// throws a 500.

import { NextRequest, NextResponse } from "next/server";
import { resolveLinkObject, removedLinkObject } from "@/lib/retrieval";

interface ResolveBody {
  tiktokUrl?: unknown;
  url?: unknown;
  caption?: unknown;
  estate?: unknown;
  beds?: unknown;
  price?: unknown;
}

export async function POST(req: NextRequest) {
  let body: ResolveBody = {};
  try {
    body = (await req.json()) as ResolveBody;
  } catch {
    // empty/invalid body → treated as an unresolvable link below (still 200)
  }
  const tiktokUrl = String(body.tiktokUrl ?? body.url ?? "");
  const caption = body.caption === undefined ? undefined : String(body.caption);
  const estate = body.estate === undefined ? undefined : String(body.estate);
  const beds = body.beds === undefined ? undefined : String(body.beds);
  const priceRaw = Number(body.price);
  const price = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : undefined;

  try {
    const linkObject = await resolveLinkObject(tiktokUrl, { caption, estate, beds, price });
    return NextResponse.json({ ok: (linkObject.source === "oembed" || linkObject.source === "tikwm"), linkObject });
  } catch {
    // Total failure — graceful "removed", never a 500.
    const linkObject = removedLinkObject(tiktokUrl);
    return NextResponse.json({ ok: false, linkObject });
  }
}

export async function GET(req: NextRequest) {
  const tiktokUrl = req.nextUrl.searchParams.get("url") ?? "";
  try {
    const linkObject = await resolveLinkObject(tiktokUrl);
    return NextResponse.json({ ok: (linkObject.source === "oembed" || linkObject.source === "tikwm"), linkObject });
  } catch {
    const linkObject = removedLinkObject(tiktokUrl);
    return NextResponse.json({ ok: false, linkObject });
  }
}
