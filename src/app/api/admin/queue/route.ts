// GET /api/admin/queue — verification queue, flagged listings, reports, audit trail
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAgentDTO, toListingDTO, toAuditDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const [pendingAgents, flaggedListings, pendingListings, reports, audits] = await Promise.all([
    db.agent.findMany({ where: { verificationStatus: "pending" }, include: { verifications: true } }),
    db.listing.findMany({ where: { reportsCount: { gte: 1 } }, include: { poster: true }, orderBy: { reportsCount: "desc" } }),
    db.listing.findMany({ where: { publishState: "pending_review" }, include: { poster: true } }),
    db.report.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { listing: { select: { title: true, estate: true } } } }),
    db.auditEvent.findMany({ orderBy: { timestamp: "desc" }, take: 20 }),
  ]);

  return NextResponse.json({
    pendingAgents: pendingAgents.map((a) => ({ ...toAgentDTO(a), _verifications: a.verifications.map((v) => ({ docType: v.docType, status: v.status })) })),
    flaggedListings: flaggedListings.map(toListingDTO),
    pendingListings: pendingListings.map(toListingDTO),
    reports: reports.map((r) => ({
      id: r.id, reason: r.reason, details: r.details, createdAt: r.createdAt.toISOString(),
      listing: r.listing ?? { title: "", estate: "" },
    })),
    audits: audits.map(toAuditDTO),
  });
}
