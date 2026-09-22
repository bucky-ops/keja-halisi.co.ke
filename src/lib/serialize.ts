// KEJA HALISI — server-side serialization: Prisma rows → public DTOs
// SECURITY RULE: private vault fields (idEncrypted, selfieUrl, mandateLetterUrl,
// exactNumberEnc) and raw phone are NEVER included in public DTOs.
import type { Agent, Listing, AuditEvent, Lead, Payment, Unit, Developer } from "@prisma/client";
import type { AgentDTO, ListingDTO, AiFlag, AuditDTO, LeadDTO, PaymentDTO, ProjectDTO, UnitDTO } from "@/lib/types";

type AgentLike = Omit<Agent, "idEncrypted" | "selfieUrl" | "mandateLetterUrl" | "userId" | "badge">;

export function toAgentDTO(a: Agent): AgentDTO {
  return {
    id: a.id,
    role: a.role as AgentDTO["role"],
    phone: a.phone,
    tiktokHandle: a.tiktokHandle,
    verificationStatus: a.verificationStatus as AgentDTO["verificationStatus"],
    responseTime: a.responseTime,
    rating: a.rating,
    listingsCount: a.listingsCount,
    reportsCount: a.reportsCount,
    bio: a.bio,
    verifiedSince: a.verifiedSince?.toISOString() ?? null,
    mandateEstates: a.mandateEstates ? (JSON.parse(a.mandateEstates) as string[]) : null,
    mandateExpiry: a.mandateExpiry?.toISOString() ?? null,
  };
}

export function toListingDTO(l: Listing & { poster: Agent }): ListingDTO {
  const weather = (() => {
    try { return JSON.parse(l.weatherCache ?? "{}") as { temp?: number; note?: string }; } catch { return {}; }
  })();
  return {
    id: l.id,
    title: l.title,
    tiktokUrl: l.tiktokUrl,
    videoId: l.videoId,
    thumbnailLink: l.thumbnailLink,
    embedHtmlLink: l.embedHtmlLink,
    authorLink: l.authorLink,
    sourceState: l.sourceState,
    role: l.role,
    estate: l.estate,
    subCounty: l.subCounty,
    borough: l.borough,
    road: l.road,
    price: l.price,
    deposit: l.deposit,
    beds: l.beds,
    status: l.status as ListingDTO["status"],
    publishState: l.publishState as ListingDTO["publishState"],
    amenities: safeParse(l.amenities, []),
    lat: l.lat,
    lng: l.lng,
    distanceToRoadM: l.distanceToRoadM,
    weather: { temp: weather.temp ?? 22, note: weather.note ?? "usual, rainy Mar-May" },
    photos: safeParse(l.photos, []),
    aiFlags: safeParse(l.aiFlags, []) as AiFlag[],
    reportsCount: l.reportsCount,
    fee: l.fee,
    freshH: l.freshH,
    responseTime: l.responseTime,
    sizeSqm: l.sizeSqm,
    floor: l.floor,
    views: l.views,
    expiresAt: l.expiresAt.toISOString(),
    createdAt: l.createdAt.toISOString(),
    poster: toAgentDTO(l.poster),
  };
}

export function toAuditDTO(e: AuditEvent): AuditDTO {
  return {
    id: e.id,
    actor: e.actor,
    action: e.action,
    object: e.object,
    objectId: e.objectId,
    timestamp: e.timestamp.toISOString(),
    metadata: e.metadata ? safeParse(e.metadata, null) : null,
  };
}

export function toLeadDTO(l: Lead & { listing?: { title: string; estate: string } }): LeadDTO {
  return {
    id: l.id,
    listingId: l.listingId,
    action: l.action,
    phoneMasked: l.phoneMasked,
    createdAt: l.createdAt.toISOString(),
    listing: l.listing ?? undefined,
  };
}

export function toPaymentDTO(p: Payment): PaymentDTO {
  return {
    id: p.id,
    kind: p.kind,
    plan: p.plan,
    amount: p.amount,
    phone: p.phone,
    status: p.status,
    receipt: p.receipt,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toUnitDTO(u: Unit): UnitDTO {
  return {
    id: u.id,
    code: u.code,
    beds: u.beds,
    price: u.price,
    status: u.status,
    expiresAt: u.expiresAt?.toISOString() ?? null,
  };
}

export function toProjectDTO(d: Developer & { units: Unit[] }): ProjectDTO {
  return {
    id: d.id,
    companyName: d.companyName,
    proofStatus: d.proofStatus,
    projects: safeParse(d.projects, []),
    units: d.units.map(toUnitDTO),
  };
}

export function safeParse<T>(json: string | null | undefined, fallback: T): T {
  try {
    return json ? (JSON.parse(json) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** log to audit_events — append-only; there is no update/delete path anywhere */
export async function audit(db: { auditEvent: { create: (args: { data: { actor?: string; action: string; object: string; objectId?: string; metadata?: string } }) => Promise<unknown> } }, data: { actor?: string; action: string; object: string; objectId?: string; metadata?: Record<string, unknown> }) {
  await db.auditEvent.create({
    data: {
      actor: data.actor,
      action: data.action,
      object: data.object,
      objectId: data.objectId,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  });
}
