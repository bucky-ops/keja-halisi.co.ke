// GET /api/trust/check — SCAM SHIELD: look up an agent by TikTok handle or phone digits
// and return an explainable trust verdict from catalog evidence (verification status,
// viewing-fee signals, community reports, reviews). Nothing here is a guarantee —
// the UI always repeats: never pay before viewing.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export type ShieldVerdict = "safe" | "check" | "danger" | "unknown";

export interface ShieldResult {
  query: string;
  kind: "handle" | "phone";
  verdict: ShieldVerdict;
  /** one-line verdict headline */
  headline: string;
  /** evidence bullets — every claim shows its number */
  notes: string[];
  /** what the renter should do next (checklist per verdict) */
  steps: string[];
  signals: {
    feeListings: number;
    activeListings: number;
    reports: number;
    reviewCount: number;
    avgStars: number;
  };
  agent?: {
    handle: string;
    role: string;
    status: string;
    rating: number;
    listingsCount: number;
    responseTime: number;
    phoneMasked: string;
    verifiedSince: string | null;
  };
  checkedAt: string;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `+254••• ••• ${digits.slice(-3)}`;
}

function scoreAgent(a: {
  verificationStatus: string;
  rating: number;
  feeListings: number;
  reports: number;
  reviewCount: number;
}): { verdict: ShieldVerdict; reasons: string[] } {
  const reasons: string[] = [];
  let danger = 0;
  let check = 0;

  if (a.verificationStatus === "rejected") {
    danger += 2;
    reasons.push("Verification was reviewed and REJECTED by the Keja Halisi team");
  } else if (a.verificationStatus === "pending") {
    check += 1;
    reasons.push("Verification still pending — ID + selfie not yet approved");
  }
  if (a.feeListings > 0) {
    reasons.push(`${a.feeListings} listing${a.feeListings > 1 ? "s" : ""} signal${a.feeListings > 1 ? "" : "s"} a viewing fee — our #1 red flag`);
    if (a.feeListings >= 2) danger += 2;
    else check += 2;
  }
  if (a.reports >= 3) {
    danger += 2;
    reasons.push(`${a.reports} community reports on their listings (3+ = auto-hidden)`);
  } else if (a.reports > 0) {
    check += 1;
    reasons.push(`${a.reports} community report${a.reports > 1 ? "s" : ""} on their listings`);
  }
  if (a.reviewCount >= 2 && a.rating < 3) {
    danger += 1;
    reasons.push(`Tenant reviews average ${a.rating}★ across ${a.reviewCount} stays`);
  } else if (a.reviewCount >= 2 && a.rating < 4) {
    check += 1;
    reasons.push(`Tenant reviews average ${a.rating}★ — mixed experiences`);
  }

  const verdict: ShieldVerdict = danger > 0 ? "danger" : check > 0 ? "check" : "safe";
  return { verdict, reasons };
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: "Provide a TikTok @handle or phone digits" }, { status: 400 });

  const digits = q.replace(/\D/g, "");
  const kind: "handle" | "phone" = /^@/.test(q) || /[a-zA-Z]/.test(q) ? "handle" : digits.length >= 6 ? "phone" : "handle";

  // find agent — handle contains-match (without @), or phone trailing-digits match
  let agent: Awaited<ReturnType<typeof db.agent.findFirst>> = null;
  if (kind === "phone" && digits.length >= 6) {
    const tail = digits.slice(-6);
    agent = await db.agent.findFirst({ where: { phone: { endsWith: tail } } });
  } else {
    const bare = q.replace(/^@/, "").toLowerCase().slice(0, 40);
    agent = await db.agent.findFirst({ where: { tiktokHandle: { contains: bare } } });
  }
  if (!agent && kind === "handle" && digits.length >= 6) {
    // handle query that still carries digits — try the phone index too
    const tail = digits.slice(-6);
    agent = await db.agent.findFirst({ where: { phone: { endsWith: tail } } });
  }

  // audit the lookup (append-only trail — admin sees what renters are checking)
  await db.auditEvent.create({
    data: {
      actor: "renter",
      action: "shield.checked",
      object: agent ? "agent" : "unknown",
      objectId: agent?.id ?? null,
      metadata: JSON.stringify({ q: q.slice(0, 60), kind }),
    },
  });

  if (!agent) {
    const payload: ShieldResult = {
      query: q,
      kind,
      verdict: "unknown",
      headline: "Not in the Keja Halisi catalog",
      notes: [
        "Nobody with that handle/number has been verified by us",
        "Keja Halisi can only vouch for agents inside the green catalog",
      ],
      steps: [
        "Ask the agent to get verified — it takes them one session",
        "Search their TikTok handle on this platform before any payment",
        "Whatever they tell you: no viewing fee before you see the house",
      ],
      signals: { feeListings: 0, activeListings: 0, reports: 0, reviewCount: 0, avgStars: 0 },
      checkedAt: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  }

  // evidence: listings (fee signals), reports, reviews
  const listings = await db.listing.findMany({
    where: { posterId: agent.id },
    select: { fee: true, status: true, publishState: true, reportsCount: true },
  });
  const reviews = await db.review.findMany({ where: { agentId: agent.id }, select: { stars: true } });

  const feeListings = listings.filter((l) => l.fee).length;
  const activeListings = listings.filter((l) => l.status === "Available" && l.publishState === "approved").length;
  const reports = listings.reduce((acc, l) => acc + l.reportsCount, 0);
  const reviewCount = reviews.length;
  const avgStars = reviewCount ? Math.round((reviews.reduce((a, r) => a + r.stars, 0) / reviewCount) * 10) / 10 : 0;

  const { verdict, reasons } = scoreAgent({
    verificationStatus: agent.verificationStatus,
    rating: agent.rating,
    feeListings,
    reports,
    reviewCount,
  });

  const positives: string[] = [];
  if (["verified", "gold", "caretaker"].includes(agent.verificationStatus)) {
    positives.push(`Verification ${agent.verificationStatus.toUpperCase()} — ID + phone + evidence approved`);
  }
  if (feeListings === 0 && listings.length > 0) positives.push(`All ${listings.length} catalog listings are viewing-fee-free`);
  if (reviewCount >= 2 && avgStars >= 4) positives.push(`${reviewCount} tenant reviews average ${avgStars}★`);
  if (agent.reportsCount === 0 && reports === 0) positives.push("Zero community reports on record");

  const stepsByVerdict: Record<ShieldVerdict, string[]> = {
    safe: [
      "Book a viewing — it is free, hakuna kulipa",
      "Still inspect the 5-point evidence checklist on the listing",
      "Pay deposit only after you see the house and sign",
    ],
    check: [
      "Inspect every listing from this agent for fee warnings",
      "Prefer their verified listings and read tenant reviews first",
      "If anyone asks for money before viewing — walk away and report",
    ],
    danger: [
      "Do NOT send any money to this agent",
      "Report the listing if it is still live on the platform",
      "Warn others — share this verdict with your house-hunting group",
    ],
    unknown: [],
  };

  const headlines: Record<ShieldVerdict, string> = {
    safe: "Green — verified and clean on every signal we track",
    check: "Yellow — mixed signals, proceed carefully",
    danger: "Red — multiple scam signals, keep your M-Pesa closed",
    unknown: "Not in the Keja Halisi catalog",
  };

  const payload: ShieldResult = {
    query: q,
    kind,
    verdict,
    headline: headlines[verdict],
    notes: [...positives, ...reasons],
    steps: stepsByVerdict[verdict],
    signals: { feeListings, activeListings, reports, reviewCount, avgStars },
    agent: {
      handle: agent.tiktokHandle,
      role: agent.role,
      status: agent.verificationStatus,
      rating: agent.rating,
      listingsCount: agent.listingsCount,
      responseTime: agent.responseTime,
      phoneMasked: maskPhone(agent.phone),
      verifiedSince: agent.verifiedSince ? agent.verifiedSince.toISOString() : null,
    },
    checkedAt: new Date().toISOString(),
  };
  return NextResponse.json(payload);
}
