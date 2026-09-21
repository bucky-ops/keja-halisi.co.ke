/**
 * KEJA HALISI — Database seed
 * 6 boroughs x 17 sub-counties, real Nairobi estates, real KES prices.
 * Run: bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const BOROUGHS: Record<string, string[]> = {
  Western: ["Westlands", "Dagoretti North", "Dagoretti South"],
  Southern: ["Langata", "Kibra"],
  Central: ["Starehe", "Kamukunji", "Mathare"],
  Eastern: ["Embakasi North", "Embakasi West", "Embakasi Central"],
  "South Eastern": ["Embakasi South", "Embakasi East", "Makadara"],
  Northern: ["Ruaraka", "Roysambu", "Kasarani"],
};

// [name, subCounty, borough, lat, lng, avgPrice]
const ESTATES: [string, string, string, number, number, number][] = [
  ["Kileleshwa", "Westlands", "Western", -1.2921, 36.7833, 32000],
  ["Lavington", "Westlands", "Western", -1.279, 36.7706, 42000],
  ["Parklands", "Westlands", "Western", -1.2621, 36.8182, 30000],
  ["Kangemi", "Westlands", "Western", -1.2889, 36.7517, 9000],
  ["Kawangware", "Dagoretti North", "Western", -1.2939, 36.7589, 8000],
  ["Riruta", "Dagoretti South", "Western", -1.3011, 36.7483, 11000],
  ["Ngong Road", "Dagoretti South", "Western", -1.3067, 36.7644, 16000],
  ["Karen", "Langata", "Southern", -1.3197, 36.7078, 55000],
  ["South C", "Langata", "Southern", -1.3003, 36.8101, 28000],
  ["Langata", "Langata", "Southern", -1.3401, 36.7517, 36000],
  ["Kibera", "Kibra", "Southern", -1.3133, 36.7894, 5500],
  ["Ngara", "Starehe", "Central", -1.2731, 36.8306, 16000],
  ["Pangani", "Starehe", "Central", -1.2667, 36.8333, 18000],
  ["Eastleigh", "Kamukunji", "Central", -1.2767, 36.8444, 13000],
  ["Mathare North", "Mathare", "Central", -1.2589, 36.8672, 9000],
  ["Umoja", "Embakasi East", "Eastern", -1.2856, 36.8939, 13000],
  ["Buruburu", "Makadara", "Eastern", -1.2883, 36.8767, 18000],
  ["Donholm", "Embakasi Central", "Eastern", -1.2919, 36.8817, 15000],
  ["Kayole", "Embakasi East", "Eastern", -1.2806, 36.9089, 8000],
  ["Pipeline", "Embakasi South", "South Eastern", -1.3064, 36.8944, 8500],
  ["Utawala", "Embakasi East", "South Eastern", -1.2983, 36.9122, 12000],
  ["Syokimau", "Embakasi South", "South Eastern", -1.3186, 36.9278, 18000],
  ["Mlolongo", "Makadara", "South Eastern", -1.3472, 36.9422, 14000],
  ["Kasarani", "Kasarani", "Northern", -1.2226, 36.8965, 13000],
  ["Roysambu", "Roysambu", "Northern", -1.2439, 36.8833, 12000],
  ["Zimmerman", "Roysambu", "Northern", -1.2303, 36.8817, 11000],
  ["Githurai", "Ruaraka", "Northern", -1.2267, 36.9067, 7000],
  ["Mwiki", "Kasarani", "Northern", -1.2139, 36.9006, 10000],
  ["Kahawa West", "Roysambu", "Northern", -1.1939, 36.8906, 13000],
];

// Agents: role, handle, phone, status, responseTime(min), rating, bio
const AGENTS: {
  role: string; handle: string; phone: string; status: string; responseTime: number;
  rating: number; bio: string; mandateEstates?: string[]; mandateExpiry?: string;
}[] = [
  { role: "Agent", handle: "@keja_kile", phone: "+254712345001", status: "verified", responseTime: 8, rating: 4.8, bio: "Niko na keja fiti Kile, Lavi na Syokimau. No viewing fee, kuja uone mwenyewe." },
  { role: "Agent", handle: "@keja_hunter_nairobi", phone: "+254712345002", status: "verified", responseTime: 10, rating: 4.9, bio: "Verified agent • Westlands & Kasarani corridor. Fresh listings daily." },
  { role: "Developer", handle: "@syokimau_developer", phone: "+254712345003", status: "gold", responseTime: 12, rating: 4.9, bio: "Syokimau Heights • 20 units • Title deed ready • M-Pesa Till 123456." },
  { role: "Caretaker", handle: "@kasa_homes", phone: "+254712345004", status: "caretaker", responseTime: 6, rating: 4.7, bio: "Careta for Kileleshwa Green Court • Mandate verified by owner.", mandateEstates: ["Kileleshwa", "Lavington"], mandateExpiry: "2026-03-01" },
  { role: "Owner", handle: "@east_hub", phone: "+254712345005", status: "verified", responseTime: 15, rating: 4.6, bio: "Direct owner • Utawala • No commission, no viewing fee." },
  { role: "Agent", handle: "@eastlands_homes", phone: "+254712345006", status: "verified", responseTime: 14, rating: 4.5, bio: "Eastlands specialist • Umoja, Buruburu, Donholm, Kayole." },
  { role: "Agent", handle: "@utawala_keys", phone: "+254712345007", status: "verified", responseTime: 11, rating: 4.7, bio: "Utawala & Pipeline keys • Water 24/7 guaranteed units." },
  { role: "Agent", handle: "@roy_homes", phone: "+254712345008", status: "verified", responseTime: 16, rating: 4.4, bio: "Roysambu, Zimmerman, TRM area • Family units." },
  { role: "Agent", handle: "@lavi_living", phone: "+254712345009", status: "verified", responseTime: 9, rating: 4.8, bio: "Lavington & Kileleshwa premium 1BR/2BR • Fibre + borehole." },
  { role: "Agent", handle: "@pending_agent_ke", phone: "+254712345010", status: "pending", responseTime: 25, rating: 4.2, bio: "Verification under review • 1 report open." },
];

const now = Date.now();
const H = 3600 * 1000;
const D = 24 * H;

// 18 listings
const LISTINGS: {
  title: string; estate: string; sub: string; borough: string; road: string;
  price: number; deposit: number; beds: string; freshH: number; response: number;
  fee: boolean; status: string; publish: string; verified: boolean;
  agent: string; amenities: string[]; distance: number; size: number; floor: string;
}[] = [
  { title: "1BR Garden Apartment • Natural Light", estate: "Kileleshwa", sub: "Westlands", borough: "Western", road: "Othaya Rd", price: 35000, deposit: 35000, beds: "1BR", freshH: 2, response: 8, fee: false, status: "Available", publish: "approved", verified: true, agent: "@keja_kile", amenities: ["Water 24/7", "Parking", "Security", "Fibre", "Borehole"], distance: 350, size: 45, floor: "2nd Floor" },
  { title: "Bedsitter • Water 24/7 • Tiled", estate: "Syokimau", sub: "Embakasi South", borough: "South Eastern", road: "Airport Rd", price: 12000, deposit: 12000, beds: "Bedsitter", freshH: 5, response: 12, fee: false, status: "Available", publish: "approved", verified: true, agent: "@kasa_homes", amenities: ["Water 24/7", "CCTV", "Parking", "Tokens"], distance: 420, size: 22, floor: "Ground" },
  { title: "2BR Ensuite • Parking • Near Kamiti Rd", estate: "Zimmerman", sub: "Roysambu", borough: "Northern", road: "Kamiti Rd", price: 28000, deposit: 28000, beds: "2BR", freshH: 26, response: 22, fee: true, status: "Available", publish: "approved", verified: false, agent: "@pending_agent_ke", amenities: ["Parking", "Water", "Security"], distance: 300, size: 68, floor: "1st Floor" },
  { title: "Studio Executive • Balcony View", estate: "Roysambu", sub: "Roysambu", borough: "Northern", road: "Lumumba Dr", price: 18000, deposit: 18000, beds: "Bedsitter", freshH: 1, response: 5, fee: false, status: "Available", publish: "approved", verified: true, agent: "@syokimau_developer", amenities: ["Fibre", "Balcony", "Lift", "Backup Water"], distance: 200, size: 28, floor: "4th Floor" },
  { title: "1BR Spacious • Near TRM Mall", estate: "Kasarani", sub: "Kasarani", borough: "Northern", road: "Mwiki Rd", price: 22000, deposit: 22000, beds: "1BR", freshH: 14, response: 18, fee: false, status: "Taken", publish: "approved", verified: true, agent: "@keja_hunter_nairobi", amenities: ["Water 24/7", "Parking", "Security"], distance: 500, size: 40, floor: "2nd Floor" },
  { title: "2BR Master Ensuite • Buruburu Phase 2", estate: "Buruburu", sub: "Makadara", borough: "Eastern", road: "Mumias South Rd", price: 32000, deposit: 32000, beds: "2BR", freshH: 3, response: 9, fee: false, status: "Available", publish: "approved", verified: true, agent: "@eastlands_homes", amenities: ["Water 24/7", "Parking", "Security", "Borehole", "Fibre"], distance: 260, size: 75, floor: "1st Floor" },
  { title: "Bedsitter • Langata • Secure Gate", estate: "Langata", sub: "Langata", borough: "Southern", road: "Langata Rd", price: 15000, deposit: 15000, beds: "Bedsitter", freshH: 48, response: 35, fee: true, status: "Available", publish: "approved", verified: false, agent: "@pending_agent_ke", amenities: ["Security", "Water"], distance: 600, size: 20, floor: "Ground" },
  { title: "3BR Bungalow • Own Compound", estate: "Karen", sub: "Langata", borough: "Southern", road: "Bogani East Rd", price: 85000, deposit: 85000, beds: "3BR", freshH: 6, response: 11, fee: false, status: "Available", publish: "approved", verified: true, agent: "@east_hub", amenities: ["Garden", "Parking x2", "Borehole", "Staff Quarters", "Security"], distance: 800, size: 160, floor: "Own Compound" },
  { title: "1BR • Kilimani Edge • Rooftop Gym", estate: "Kileleshwa", sub: "Westlands", borough: "Western", road: "Laikipia Rd", price: 40000, deposit: 40000, beds: "1BR", freshH: 20, response: 14, fee: false, status: "Available", publish: "approved", verified: true, agent: "@lavi_living", amenities: ["Gym", "Rooftop", "Lift", "Fibre", "Parking"], distance: 320, size: 48, floor: "6th Floor" },
  { title: "Bedsitter • Kasarani • New Build", estate: "Kasarani", sub: "Kasarani", borough: "Northern", road: "Sunton Rd", price: 8000, deposit: 8000, beds: "Bedsitter", freshH: 0.5, response: 4, fee: false, status: "Available", publish: "approved", verified: true, agent: "@kasa_homes", amenities: ["Water 24/7", "Tokens", "Security", "Tiles"], distance: 150, size: 18, floor: "1st Floor" },
  { title: "2BR • Umoja • Water + Security", estate: "Umoja", sub: "Embakasi East", borough: "Eastern", road: "Moi Dr", price: 25000, deposit: 25000, beds: "2BR", freshH: 30, response: 28, fee: true, status: "Available", publish: "approved", verified: false, agent: "@pending_agent_ke", amenities: ["Water", "Security", "Parking"], distance: 380, size: 65, floor: "2nd Floor" },
  { title: "1BR • South C • Quiet Estate", estate: "South C", sub: "Langata", borough: "Southern", road: "Muhoho Ave", price: 30000, deposit: 30000, beds: "1BR", freshH: 8, response: 7, fee: false, status: "Available", publish: "approved", verified: true, agent: "@east_hub", amenities: ["Water 24/7", "Parking", "Security", "Fibre"], distance: 280, size: 46, floor: "3rd Floor" },
  { title: "1BR • Near Eastern Bypass • New Paint", estate: "Utawala", sub: "Embakasi East", borough: "South Eastern", road: "Eastern Bypass", price: 12000, deposit: 12000, beds: "1BR", freshH: 4, response: 11, fee: false, status: "Available", publish: "approved", verified: true, agent: "@utawala_keys", amenities: ["Water 24/7", "CCTV", "Own Meter"], distance: 50, size: 38, floor: "2nd Floor" },
  { title: "Bedsitter • Pipeline • High Turnover", estate: "Pipeline", sub: "Embakasi South", borough: "South Eastern", road: "Pipeline Rd", price: 8500, deposit: 8500, beds: "Bedsitter", freshH: 22, response: 10, fee: false, status: "Available", publish: "approved", verified: true, agent: "@utawala_keys", amenities: ["Water", "Security", "Tokens"], distance: 120, size: 19, floor: "Ground" },
  { title: "1BR Premium • Lavington Green", estate: "Lavington", sub: "Westlands", borough: "Western", road: "James Gichuru Rd", price: 42000, deposit: 42000, beds: "1BR", freshH: 7, response: 9, fee: false, status: "Available", publish: "approved", verified: true, agent: "@lavi_living", amenities: ["Balcony", "Parking", "Water 24/7", "Fibre", "Gym"], distance: 200, size: 52, floor: "3rd Floor" },
  { title: "Bedsitter • Ngara • CBD Edge", estate: "Ngara", sub: "Starehe", borough: "Central", road: "Park Rd", price: 14000, deposit: 14000, beds: "Bedsitter", freshH: 12, response: 7, fee: false, status: "Available", publish: "approved", verified: true, agent: "@keja_hunter_nairobi", amenities: ["Fibre", "Water", "Security"], distance: 180, size: 21, floor: "2nd Floor" },
  { title: "1BR • Ngong Rd • Near Matatu Stage", estate: "Ngong Road", sub: "Dagoretti South", borough: "Western", road: "Ngong Rd", price: 16000, deposit: 16000, beds: "1BR", freshH: 9, response: 15, fee: false, status: "Available", publish: "approved", verified: true, agent: "@keja_kile", amenities: ["Water", "Tokens", "Security"], distance: 90, size: 34, floor: "1st Floor" },
  { title: "2BR • Kahawa West • Thika Rd Corridor", estate: "Kahawa West", sub: "Roysambu", borough: "Northern", road: "Thika Rd", price: 26000, deposit: 26000, beds: "2BR", freshH: 28, response: 17, fee: false, status: "Available", publish: "approved", verified: true, agent: "@roy_homes", amenities: ["Parking", "Water", "Security", "Borehole"], distance: 450, size: 70, floor: "1st Floor" },
];

async function main() {
  console.log("Clearing existing data...");
  await db.payment.deleteMany();
  await db.lead.deleteMany();
  await db.report.deleteMany();
  await db.unit.deleteMany();
  await db.developer.deleteMany();
  await db.verification.deleteMany();
  await db.listing.deleteMany();
  await db.auditEvent.deleteMany();
  await db.otp.deleteMany();
  await db.agent.deleteMany();
  await db.estate.deleteMany();

  console.log("Seeding estates — 6 boroughs x 17 sub-counties...");
  for (const [name, subCounty, borough, lat, lng, avgPrice] of ESTATES) {
    await db.estate.create({ data: { name, subCounty, borough, lat, lng, avgPrice } });
  }

  console.log("Seeding agents...");
  const agentMap = new Map<string, string>();
  for (const a of AGENTS) {
    const created = await db.agent.create({
      data: {
        role: a.role,
        phone: a.phone,
        tiktokHandle: a.handle,
        verificationStatus: a.status,
        responseTime: a.responseTime,
        rating: a.rating,
        bio: a.bio,
        mandateEstates: a.mandateEstates ? JSON.stringify(a.mandateEstates) : undefined,
        mandateExpiry: a.mandateExpiry ? new Date(a.mandateExpiry) : undefined,
        verifiedSince: a.status === "verified" || a.status === "gold" || a.status === "caretaker" ? new Date("2026-01-15") : null,
        idEncrypted: a.status !== "pending" ? `vault://verification-docs/${a.handle}/id.enc` : null,
        selfieUrl: a.status !== "pending" ? `vault://verification-docs/${a.handle}/selfie.enc` : null,
        mandateLetterUrl: a.role === "Caretaker" ? `vault://mandate-letters/${a.handle}/mandate.enc` : null,
      },
    });
    agentMap.set(a.handle, created.id);
  }

  console.log("Seeding listings...");
  const listingIds: string[] = [];
  for (let i = 0; i < LISTINGS.length; i++) {
    const L = LISTINGS[i];
    const estate = ESTATES.find((e) => e[0] === L.estate)!;
    const agentId = agentMap.get(L.agent)!;
    const created = await db.listing.create({
      data: {
        posterId: agentId,
        title: L.title,
        tiktokUrl: `https://www.tiktok.com/@${L.agent.replace("@", "")}/video/74${(7300000000000000 + i * 137).toString()}`,
        estate: L.estate,
        subCounty: L.sub,
        borough: L.borough,
        road: L.road,
        price: L.price,
        deposit: L.deposit,
        beds: L.beds,
        status: L.status,
        publishState: L.publish,
        amenities: JSON.stringify(L.amenities),
        lat: estate[3] + (Math.random() - 0.5) * 0.004,
        lng: estate[4] + (Math.random() - 0.5) * 0.004,
        distanceToRoadM: L.distance,
        weatherCache: JSON.stringify({ temp: 22 + Math.round(Math.random() * 3), note: "usual, rainy Mar-May" }),
        photos: JSON.stringify([1, 2, 3].map((n) => `listing-${i + 1}-photo${n}`)),
        aiFlags: JSON.stringify(
          L.fee ? [{ type: "fee_signal", label: "Viewing-fee signal in caption", severity: "red" }] :
          !L.verified ? [{ type: "unverified", label: "Poster unverified", severity: "amber" }] : []
        ),
        fee: L.fee,
        freshH: Math.round(L.freshH),
        responseTime: L.response,
        sizeSqm: L.size,
        floor: L.floor,
        views: 40 + Math.floor(Math.random() * 400),
        exactNumberEnc: `vault://doors/${i + 1}/house-number.enc`,
        expiresAt: new Date(now + (7 * D - L.freshH * H)),
        createdAt: new Date(now - L.freshH * H),
      },
    });
    listingIds.push(created.id);
  }

  console.log("Seeding developer project + units...");
  const devAgentId = agentMap.get("@syokimau_developer")!;
  const dev = await db.developer.create({
    data: {
      agentId: devAgentId,
      companyName: "Syokimau Heights Ltd",
      proofStatus: "verified",
      projects: JSON.stringify([{ name: "Syokimau Heights", location: "Syokimau • Airport Rd", totalUnits: 20 }]),
    },
  });
  const unitCodes = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "C1", "C2", "D1"];
  for (let i = 0; i < unitCodes.length; i++) {
    const beds = ["Bedsitter", "1BR", "1BR", "2BR", "Bedsitter", "1BR", "2BR", "Bedsitter", "1BR", "2BR"][i];
    const price = beds === "Bedsitter" ? 9500 : beds === "1BR" ? 18000 : 28000;
    await db.unit.create({
      data: {
        developerId: dev.id,
        code: unitCodes[i],
        beds,
        price,
        status: i % 4 === 1 ? "Taken" : "Available",
        expiresAt: new Date(now + (12 + i * 6) * H),
      },
    });
  }

  console.log("Seeding verifications...");
  const vDefs: [string, string, string][] = [
    ["@keja_kile", "otp", "verified"], ["@keja_kile", "id_selfie", "verified"], ["@keja_kile", "referral", "verified"],
    ["@kasa_homes", "otp", "verified"], ["@kasa_homes", "id_selfie", "verified"], ["@kasa_homes", "mandate_letter", "verified"],
    ["@syokimau_developer", "otp", "verified"], ["@syokimau_developer", "id_selfie", "verified"], ["@syokimau_developer", "title_deed", "verified"], ["@syokimau_developer", "kra_pin", "verified"],
    ["@pending_agent_ke", "otp", "verified"], ["@pending_agent_ke", "id_selfie", "pending"],
  ];
  for (const [handle, docType, status] of vDefs) {
    await db.verification.create({
      data: { agentId: agentMap.get(handle)!, docType, status, reviewer: status === "verified" ? "admin" : null, reviewedAt: status === "verified" ? new Date(now - 20 * D) : null },
    });
  }

  console.log("Seeding reports (Umoja 2BR already has 2 to demo 3-strike)...");
  await db.report.create({ data: { listingId: listingIds[10], reason: "ViewingFee", details: "Agent aliniomba fee kabla sijaona nyumba", createdAt: new Date(now - 26 * H) } });
  await db.report.create({ data: { listingId: listingIds[10], reason: "FakePrice", details: "Price does not match video", createdAt: new Date(now - 5 * H) } });
  await db.report.create({ data: { listingId: listingIds[6], reason: "Taken", details: "Nilipiga simu, imeisha", createdAt: new Date(now - 2 * H) } });
  await db.listing.update({ where: { id: listingIds[10] }, data: { reportsCount: 2 } });
  await db.listing.update({ where: { id: listingIds[6] }, data: { reportsCount: 1 } });

  console.log("Seeding leads...");
  const leadDefs: [number, string, string, number][] = [
    [0, "call", "07** *** 123", 2], [0, "whatsapp", "07** *** 891", 5], [15, "call", "07** *** 456", 26],
    [1, "whatsapp", "07** *** 220", 8], [9, "call", "07** *** 774", 1],
  ];
  for (const [idx, action, masked, hoursAgo] of leadDefs) {
    await db.lead.create({ data: { listingId: listingIds[idx], action, phoneMasked: masked, createdAt: new Date(now - hoursAgo * H) } });
  }

  console.log("Seeding audit events...");
  const audits: [string, string, string, string][] = [
    ["admin", "listing.approved", "listing", listingIds[0]],
    ["ai", "fee_signal.detected", "listing", listingIds[2]],
    ["ai", "evidence_checklist.incomplete", "listing", listingIds[10]],
    ["admin", "caretaker.mandate_verified", "agent", agentMap.get("@kasa_homes")!],
    ["system", "cron.expired_listings", "system", ""],
    ["user", "report.submitted", "listing", listingIds[10]],
  ];
  for (let i = 0; i < audits.length; i++) {
    const [actor, action, object, objectId] = audits[i];
    await db.auditEvent.create({ data: { actor, action, object, objectId, timestamp: new Date(now - i * 37 * 60000), metadata: JSON.stringify({ source: "seed" }) } });
  }

  const counts = {
    estates: await db.estate.count(),
    agents: await db.agent.count(),
    listings: await db.listing.count(),
    units: await db.unit.count(),
    leads: await db.lead.count(),
    reports: await db.report.count(),
    audits: await db.auditEvent.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
