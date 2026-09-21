// POST /api/verify/otp/send — Africa's Talking OTP mock (returns demo code)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || !/^(\+?254|0)7\d{8}$/.test(String(phone).replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Enter a valid Kenyan number 07XXXXXXXX" }, { status: 400 });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.otp.create({
    data: {
      phone: String(phone).replace(/\s/g, ""),
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  await audit(db, { actor: "system", action: "otp.sent", object: "otp", metadata: { phone: `07****${String(phone).slice(-3)}` } });
  // Demo mode: return the code (production: sent via Africa's Talking SMS)
  return NextResponse.json({ demoCode: code, channel: "africastalking-sms (mock)" });
}
