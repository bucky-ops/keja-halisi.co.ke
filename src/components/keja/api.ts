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

export interface TenantReview {
  id: string;
  authorHandle: string;
  stars: number;
  text: string;
  verifiedStay: boolean;
  helpful: number;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface RatingSummary {
  count: number;
  avg: number;
  dist: number[]; // [1★..5★] counts
}

export async function fetchAgentProfile(handle: string): Promise<{
  agent: AgentDTO;
  listings: ListingDTO[];
  verifications: { docType: string; status: string }[];
  reviews: TenantReview[];
  ratingSummary: RatingSummary;
}> {
  const res = await fetch(`/api/agents/${encodeURIComponent(handle)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Agent not found");
  return res.json();
}

/** +1 helpful vote on a tenant review (demo: increments, no auth) */
export async function voteReviewHelpful(id: string): Promise<{ id: string; helpful: number }> {
  const res = await fetch(`/api/reviews/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "helpful" }),
  });
  if (!res.ok) throw new Error("Vote failed");
  return res.json();
}

/** agent public reply on a tenant review (simulated verified-poster account) */
export async function replyToReview(id: string, text: string): Promise<{ id: string; reply: string; repliedAt: string }> {
  const res = await fetch(`/api/reviews/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reply", text }),
  });
  if (!res.ok) throw new Error("Reply failed");
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

/* ===================== ADMIN AUTH (shared-PIN console gate) ===================== */

export const ADMIN_PIN_KEY = "kh_admin_pin"; // sessionStorage — cleared on tab close

/** Session PIN injected into every admin API call via x-admin-pin header. */
export function adminHeaders(): Record<string, string> {
  const pin = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PIN_KEY) ?? "" : "";
  return pin ? { "x-admin-pin": pin } : {};
}

/** Validate a PIN against the server; store it only when the queue answers 200. */
export async function adminLogin(pin: string): Promise<boolean> {
  const res = await fetch("/api/admin/queue", { cache: "no-store", headers: { "x-admin-pin": pin } });
  if (!res.ok) return false;
  sessionStorage.setItem(ADMIN_PIN_KEY, pin);
  return true;
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_PIN_KEY);
}

export async function reviewAgent(agentId: string, decision: "verified" | "rejected", reason?: string) {
  const res = await fetch("/api/admin/review-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ agentId, decision, reason }),
  });
  if (!res.ok) throw new Error("Review failed");
  return res.json();
}

export async function reviewListing(listingId: string, decision: "approved" | "rejected", reason?: string) {
  const res = await fetch("/api/admin/review-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
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
  const res = await fetch("/api/admin/queue", { cache: "no-store", headers: adminHeaders() });
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
  const res = await fetch(`/api/cron/${job}`, { method: "POST", headers: adminHeaders() });
  return res.json();
}

export interface AdminAnalytics {
  days: string[];
  listings: number[];
  reports: number[];
  leads: number[];
  totals: { listings: number; reports: number; leads: number };
  deltas: { listings: number; reports: number; leads: number };
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const res = await fetch("/api/admin/analytics", { cache: "no-store", headers: adminHeaders() });
  if (!res.ok) throw new Error("Analytics failed");
  return res.json();
}

/* ===================== LINK-ONLY LIVE DATA INPUT (Phase 2) ===================== */

export interface EstatesData {
  version: string;
  boroughs: { id: string; name: string; subCounties: string[] }[];
  subCounties: { name: string; borough: string; boroughId: string }[];
  estates: {
    name: string;
    subCounty: string;
    borough: string;
    lat: number;
    lng: number;
    mainRoad: string;
    mainRoadLat: number;
    mainRoadLng: number;
    priceRange: string;
    avgPrice: Record<string, number>;
  }[];
  aliasMap: Record<string, string>;
  priceBuckets: { id: string; label: string; min: number; max: number }[];
  beds: { id: string; label: string; aliases: string[] }[];
  amenities: { id: string; label: string; keywords: string[] }[];
  mainRoads: { name: string; lat: number; lng: number }[];
}

export async function fetchEstates(): Promise<EstatesData> {
  const res = await fetch("/api/estates", { cache: "no-store" });
  if (!res.ok) throw new Error("Estates catalog failed");
  return res.json();
}

export interface ResolveResponse {
  ok: boolean;
  error?: string;
  videoId: string;
  tiktokUrl: string;
  thumbnailLink: string | null;
  embedHtmlLink: string | null;
  authorLink: string | null;
  title: string | null;
  handle: string;
  source: "oembed" | "tikwm" | "removed" | "pending";
  parsed: { price: number; beds: string; estate: string; amenities: string[]; fee: boolean };
  checks: {
    bait: { bait: boolean; pctOfAvg: number; label: string };
    repost: { repost: boolean; matchHandle: string; pct: number; label: string };
    fee: { fee: boolean; label: string };
  };
}

export async function resolveTikTok(url: string): Promise<ResolveResponse> {
  const res = await fetch(`/api/listings/resolve?url=${encodeURIComponent(url)}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Resolve failed");
  return json as ResolveResponse;
}

export interface CreateListingResponse {
  id: string;
  videoId: string;
  tiktokUrl: string;
  thumbnailLink: string | null;
  embedHtmlLink: string | null;
  status: string;
  publishState: string;
  fee: boolean;
  bait: boolean;
  source: string;
  aiFlags: { type: string; label: string; severity: string }[];
  error?: string;
  detail?: string;
  repostOf?: string;
}

export async function createListing(payload: Record<string, unknown>): Promise<CreateListingResponse> {
  const res = await fetch("/api/listings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error ?? "Create failed"), { payload: json });
  return json as CreateListingResponse;
}

export async function fetchWeather(lat: number, lng: number): Promise<{ tempC: number; note: string } | null> {
  try {
    const res = await fetch(`/api/geo/weather?lat=${lat}&lng=${lng}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { tempC: number; note: string };
  } catch {
    return null;
  }
}

export async function logLeadByVideo(videoId: string, action: "Call" | "WhatsApp" | "TikTok") {
  const res = await fetch("/api/leads/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId, action }),
  });
  return res.json();
}
