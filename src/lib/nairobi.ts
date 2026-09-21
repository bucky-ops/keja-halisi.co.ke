// KEJA HALISI — Nairobi coverage model: 6 boroughs x 17 sub-counties (configurable)

export const BOROUGHS: Record<string, string[]> = {
  Western: ["Westlands", "Dagoretti North", "Dagoretti South"],
  Southern: ["Langata", "Kibra"],
  Central: ["Starehe", "Kamukunji", "Mathare"],
  Eastern: ["Embakasi North", "Embakasi West", "Embakasi Central"],
  "South Eastern": ["Embakasi South", "Embakasi East", "Makadara"],
  Northern: ["Ruaraka", "Roysambu", "Kasarani"],
};

export const ALL_SUB_COUNTIES: string[] = Object.values(BOROUGHS).flat();

export const BOROUGH_INFO: { name: string; estates: string; price: string }[] = [
  { name: "Western", estates: "Kileleshwa • Lavington • Parklands • Kangemi", price: "1BR 28k-45k" },
  { name: "Southern", estates: "Karen • South C • Langata", price: "50k+ • 22k-35k" },
  { name: "Central", estates: "Ngara • Pangani • Eastleigh", price: "12k-20k • 15k-22k" },
  { name: "Eastern", estates: "Umoja • Buruburu • Donholm", price: "10k-16k • 15k-22k" },
  { name: "South Eastern", estates: "Pipeline • Utawala • Syokimau", price: "7k-12k • 15k-25k" },
  { name: "Northern", estates: "Kasarani • Roysambu • Zimmerman • Githurai", price: "10k-18k • 9k-16k" },
];

export const BEDS_OPTIONS = ["Bedsitter", "1BR", "2BR", "3BR"] as const;
export type Beds = (typeof BEDS_OPTIONS)[number];

export const AMENITY_OPTIONS = ["Water 24/7", "Parking", "Security", "Tokens", "Fibre", "Borehole"] as const;

export const ROLES = ["Agent", "Owner", "Developer", "Caretaker"] as const;
export type Role = (typeof ROLES)[number];

export const REPORT_REASONS = [
  { value: "Taken", label: "House taken / already rented" },
  { value: "FakePrice", label: "Price fake / bait" },
  { value: "ViewingFee", label: "Asks viewing fee before viewing" },
  { value: "LocationFake", label: "Location fake" },
  { value: "AlreadyRented", label: "Already rented — still listed" },
  { value: "Repost", label: "Duplicate / reposted video" },
] as const;

export const EVIDENCE_ITEMS = ["Outside", "Gate", "Inside", "Water running", "Window view"] as const;

export const ROLE_EVIDENCE: Record<Role, { doc: string; extra?: string }> = {
  Agent: { doc: "2 old TikTok videos + 2 referral phones" },
  Owner: { doc: "ID + KPLC bill matching name" },
  Developer: { doc: "Title / Lease document + company reg" },
  Caretaker: { doc: "ID + selfie", extra: "Owner mandate letter + estate permission" },
};

export function kes(n: number): string {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export function kesShort(n: number): string {
  return n >= 1000 ? `KES ${Math.round(n / 100) / 10}k` : `KES ${n}`;
}

export function bedsLabel(beds: string): string {
  return beds;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return "07** *** ***";
  return `07** *** ${digits.slice(-3)}`;
}

export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Demo weather per estate (OpenWeather slot in production)
export function estateWeather(estate: string): { temp: number; note: string } {
  const seed = estate.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const temps = [21, 22, 23, 24, 25];
  return { temp: temps[seed % temps.length], note: "usual, rainy Mar-May" };
}

export function timeAgo(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
