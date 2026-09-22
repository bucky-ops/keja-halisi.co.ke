export const dynamic = "force-dynamic";
// GET /api/listings/resolve?url={tiktokUrl}
//                                  — LIVE LINK-ONLY RESOLUTION (spec STEP 2)
//
// Called the moment a TikTok URL is pasted into /post. Server-side resolution
// chain: tiktok.com/oembed → tikwm metadata mirror → graceful "removed".
// The ONLY things returned are LINKS and DERIVED TAGS — never media bytes.
//
// Response:
// {
//   ok, videoId, tiktokUrl, thumbnailLink, embedHtmlLink, authorLink, title,
//   source: "oembed"|"tikwm"|"removed",
//   parsed: { price, beds, estate, amenities[], fee },   // editable in the UI
//   checks: { bait, repost, fee },                        // yellow/red tags
// }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchOEmbed,
  parseCaptionToLinkObject,
  removedLinkObject,
  extractVideoId,
} from "@/lib/retrieval";
import { baitPriceCheck, feeDetect, repostCheck, validateTikTokUrl } from "@/lib/link-validate";

export async function GET(req: NextRequest) {
  const tiktokUrl = (req.nextUrl.searchParams.get("url") ?? "").trim();
  const overrideEstate = req.nextUrl.searchParams.get("estate") ?? "";
  const overridePrice = Number(req.nextUrl.searchParams.get("price") ?? 0);

  const gate = validateTikTokUrl(tiktokUrl);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: "Invalid TikTok link — must be tiktok.com/@handle/video/..." },
      { status: 400 },
    );
  }

  // 1 — resolve metadata (LINKS ONLY, TTL-cached 1h)
  const oembed = await fetchOEmbed(tiktokUrl);
  const caption = oembed?.title ?? "";
  const linkObject = oembed
    ? parseCaptionToLinkObject(caption, tiktokUrl, oembed)
    : removedLinkObject(tiktokUrl);

  const price = overridePrice || linkObject.price || 0;
  const estateName = overrideEstate || linkObject.estate || "";

  // 2 — input validations
  const bait = baitPriceCheck(price, estateName, linkObject.beds);
  const fee = linkObject.fee || feeDetect(caption);

  // 3 — repost check against the live link index (videoId already posted?)
  let repost = { repost: false, matchHandle: "", pct: 0, label: "" };
  try {
    const existing = await db.listing.findFirst({
      where: { videoId: gate.videoId },
      include: { poster: true },
    });
    repost = repostCheck(gate.videoId, existing);
  } catch {
    // index unavailable → skip repost check, never fail the resolve
  }

  return NextResponse.json({
    ok: Boolean(oembed),
    videoId: gate.videoId,
    tiktokUrl,
    thumbnailLink: linkObject.thumbnailLink,
    embedHtmlLink: linkObject.oembedHtmlLink,
    authorLink: linkObject.authorUrl,
    title: linkObject.title,
    handle: gate.handle,
    source: linkObject.source,
    parsed: {
      price,
      beds: linkObject.beds,
      estate: linkObject.estate,
      amenities: linkObject.amenities,
      fee,
    },
    checks: {
      bait: { bait: bait.bait, pctOfAvg: bait.pctOfAvg, label: bait.label },
      repost,
      fee: { fee, label: fee ? "Fee signal — report if anyone asks payment before viewing" : "" },
    },
  });
}
