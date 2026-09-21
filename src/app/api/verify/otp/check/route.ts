export const dynamic = "force-dynamic";
// POST /api/verify/otp/check — verify code + Truecaller phone-age mock (>6 months)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();
  const normalized = String(phone ?? "").replace(/\s/g, "");
  const otp = await db.otp.findFirst({
    where: { phone: normalized, verified: false, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.code !== String(code)) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }
  await db.otp.update({ where: { id: otp.id }, data: { verified: true } });
  await audit(db, { actor: "system", action: "otp.verified", object: "otp", metadata: { phone: `07****${normalized.slice(-3)}` } });

  // Truecaller mock: phone number age > 6 months → trusted
  const phoneAgeMonths = 6 + (normalized.slice(-2).charCodeAt(0) % 12);
  return NextResponse.json({ verified: true, phoneAgeMonths, truecaller: phoneAgeMonths > 6 ? "trusted" : "young" });
}
