// KEJA HALISI — shared client types + API types

export type VerificationStatus = "pending" | "verified" | "rejected" | "gold" | "caretaker";
export type ListingStatus = "Available" | "Taken" | "Reserved" | "Expired";
export type PublishState = "draft" | "pending_review" | "approved" | "rejected" | "expired";
export type Role = "Agent" | "Owner" | "Developer" | "Caretaker";

export interface AgentDTO {
  id: string;
  role: Role;
  phone: string;
  tiktokHandle: string;
  verificationStatus: VerificationStatus;
  responseTime: number;
  rating: number;
  listingsCount: number;
  reportsCount: number;
  bio: string | null;
  verifiedSince: string | null;
  mandateEstates: string[] | null;
  mandateExpiry: string | null;
}

export interface AiFlag {
  type: string;
  label: string;
  severity: "red" | "amber" | "blue";
}

export interface ListingDTO {
  id: string;
  title: string;
  tiktokUrl: string;
  estate: string;
  subCounty: string;
  borough: string;
  road: string | null;
  price: number;
  deposit: number;
  beds: string;
  status: ListingStatus;
  publishState: PublishState;
  amenities: string[];
  lat: number;
  lng: number;
  distanceToRoadM: number;
  weather: { temp: number; note: string };
  photos: string[];
  aiFlags: AiFlag[];
  reportsCount: number;
  fee: boolean;
  freshH: number;
  responseTime: number;
  sizeSqm: number | null;
  floor: string | null;
  views: number;
  expiresAt: string;
  createdAt: string;
  poster: AgentDTO;
}

export interface MarketPulse {
  verifiedToday: number;
  scamsBlocked: number;
  avgResponse: number;
  freshListings: number;
}

export interface HomeStats {
  verifiedAgents: number;
  units: number;
  scamsBlocked: number;
}

export interface LeadDTO {
  id: string;
  listingId: string;
  action: string;
  phoneMasked: string;
  createdAt: string;
  listing?: { title: string; estate: string };
}

export interface UnitDTO {
  id: string;
  code: string;
  beds: string;
  price: number;
  status: string;
  expiresAt: string | null;
}

export interface ProjectDTO {
  id: string;
  companyName: string;
  proofStatus: string;
  projects: { name: string; location: string; totalUnits: number }[];
  units: UnitDTO[];
}

export interface AuditDTO {
  id: string;
  actor: string | null;
  action: string;
  object: string;
  objectId: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface PaymentDTO {
  id: string;
  kind: string;
  plan: string | null;
  amount: number;
  phone: string | null;
  status: string;
  receipt: string | null;
  createdAt: string;
}

export interface ListingQuery {
  q?: string;
  borough?: string;
  subCounty?: string;
  estate?: string;
  beds?: string;
  minPrice?: number;
  maxPrice?: number;
  fresh?: boolean;
  noFee?: boolean;
  verified?: boolean;
  available?: boolean;
  sort?: "fresh" | "price_asc" | "price_desc" | "response";
  limit?: number;
}
