"use client";
// KEJA HALISI — client API helpers
import type { ListingDTO, ListingQuery, AgentDTO, MarketPulse, HomeStats, AuditDTO, LeadDTO, PaymentDTO, ProjectDTO } from "@/lib/types";

function qs(query: Record<string, unknown>): string {
  const p = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === false) return;
    p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function fetchListings(query: ListingQuery = {}): Promise<ListingDTO[]> {
  const res = await fetch(`/api/listings${qs(query as Record<string, unknown>)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load listings");
  return res.json();
}

export async function fetchListing(id: string): Promise<ListingDTO> {
  const res = await fetch(`/api/listings/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Listing not found");
  return res.json();
}

export async function fetchAgents(): Promise<AgentDTO[]> {
  const res = await fetch("/api/agents", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load agents");
  return res.json();
}

export async function fetchAgentProfile(handle: string): Promise<{ agent: AgentDTO; listings: ListingDTO[]; verifications: { docType: string; status: string }[] }> {
  const res = await fetch(`/api/agents/${encodeURIComponent(handle)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Agent not found");
  return res.json();
}

export async function fetchMarketPulse(): Promise<MarketPulse> {
  const res = await fetch("/api/market-pulse", { cache: "no-store" });
  return res.json();
}

export async function fetchHomeStats(): Promise<HomeStats> {
  const res = await fetch("/api/stats", { cache: "no-store" });
  return res.json();
}

export async function submitReport(listingId: string, reason: string, details: string) {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, reason, details }),
  });
  if (!res.ok) throw new Error("Report failed");
  return res.json() as Promise<{ reportsCount: number; autoHidden: boolean }>;
}

export async function logLead(listingId: string, action: string) {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, action }),
  });
  if (!res.ok) throw new Error("Lead failed");
  return res.json() as Promise<{ phoneMasked: string; phone: string }>;
}

export async function sendOtp(phone: string): Promise<{ demoCode: string }> {
  const res = await fetch("/api/verify/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error("OTP send failed");
  return res.json();
}

export async function checkOtp(phone: string, code: string): Promise<{ verified: boolean; phoneAgeMonths: number }> {
  const res = await fetch("/api/verify/otp/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) throw new Error("OTP check failed");
  return res.json();
}

export async function submitVerification(payload: {
  phone: string; tiktokHandle: string; role: string; docs: string[]; mandateEstates?: string[];
}): Promise<{ status: string }> {
  const res = await fetch("/api/verify/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Verification submit failed");
  return res.json();
}

export async function parseCaption(url: string): Promise<{ price: number; beds: string; estate: string; road: string; valid: boolean }> {
  const res = await fetch("/api/ai/parse-caption", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Parse failed");
  return res.json();
}

export async function submitListing(payload: Record<string, unknown>): Promise<{ id: string; publishState: string; aiFlags: { type: string; label: string; severity: string }[] }> {
  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Submit failed");
  return res.json();
}

export async function toggleListingStatus(id: string, status: string) {
  const res = await fetch(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Toggle failed");
  return res.json();
}

export async function updateListingPrice(id: string, price: number, deposit?: number) {
  const res = await fetch(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price, deposit }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Price update failed");
  }
  return res.json() as Promise<{ id: string; price: number; deposit: number }>;
}

export async function relistListing(id: string) {
  const res = await fetch(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "relist" }),
  });
  if (!res.ok) throw new Error("Relist failed");
  return res.json() as Promise<{ id: string; status: string; expiresAt: string }>;
}

export type FairPrice = {
  price: number;
  band: "bait" | "below" | "fair" | "above" | "high";
  verdict: { label: string; tone: "ok" | "warn" | "scam"; note: string };
  stats: { min: number; p25: number; median: number; p75: number; max: number };
  compCount: number;
  scope: "estate" | "sub-county" | "borough" | "seed-average";
  estate: string;
  beds: string;
};

export async function fetchFairPrice(estate: string, beds: string, price: number, exclude?: string): Promise<FairPrice> {
  const res = await fetch(
    `/api/market/fair-price?estate=${encodeURIComponent(estate)}&beds=${encodeURIComponent(beds)}&price=${price}${exclude ? `&exclude=${exclude}` : ""}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Fair price unavailable");
  return res.json();
}

export async function reviewAgent(agentId: string, decision: "verified" | "rejected", reason?: string) {
  const res = await fetch("/api/admin/review-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, decision, reason }),
  });
  if (!res.ok) throw new Error("Review failed");
  return res.json();
}

export async function reviewListing(listingId: string, decision: "approved" | "rejected", reason?: string) {
  const res = await fetch("/api/admin/review-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, decision, reason }),
  });
  if (!res.ok) throw new Error("Review failed");
  return res.json();
}

export async function fetchAdminQueue(): Promise<{
  pendingAgents: AgentDTO[];
  flaggedListings: ListingDTO[];
  pendingListings: ListingDTO[];
  reports: { id: string; reason: string; details: string | null; createdAt: string; listing: { title: string; estate: string } }[];
  audits: AuditDTO[];
}> {
  const res = await fetch("/api/admin/queue", { cache: "no-store" });
  if (!res.ok) throw new Error("Admin queue failed");
  return res.json();
}

export async function fetchDeveloperDashboard(handle?: string): Promise<{ developer: ProjectDTO; leads: LeadDTO[]; payments: PaymentDTO[] }> {
  const res = await fetch(`/api/dashboard/developer${qs({ handle })}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Dashboard failed");
  return res.json();
}

export async function toggleUnit(unitId: string, status: string) {
  const res = await fetch("/api/dashboard/units", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unitId, status }),
  });
  if (!res.ok) throw new Error("Unit toggle failed");
  return res.json();
}

export async function stkPush(payload: { phone: string; amount: number; plan: string; kind: string }): Promise<{ id: string; receipt: string }> {
  const res = await fetch("/api/payments/stk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("STK failed");
  return res.json();
}

export async function fetchMarketTrends(): Promise<{ borough: string; subCounty: string; avgPrice: number; count: number }[]> {
  const res = await fetch("/api/market-trends", { cache: "no-store" });
  return res.json();
}

export async function runCron(job: "expire-listings" | "nudge-availability"): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/cron/${job}`, { method: "POST" });
  return res.json();
}
