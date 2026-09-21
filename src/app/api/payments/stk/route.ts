export const dynamic = "force-dynamic";
// POST /api/payments/stk — M-Pesa Daraja STK Push SIMULATION (no real payment)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const { phone, amount, plan, kind } = await req.json();
  if (!phone || !amount) return NextResponse.json({ error: "phone and amount required" }, { status: 400 });

  const payment = await db.payment.create({
    data: {
      kind: kind === "escrow" ? "escrow" : "subscription",
      plan: plan ?? "Pro Subscription",
      amount: Number(amount),
      phone,
      status: "success",
      receipt: `KH-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
    },
  });

  await audit(db, {
    actor: phone,
    action: "payment.stk_simulated",
    object: "payment",
    objectId: payment.id,
    metadata: { amount, plan, till: "123456", note: "no real payment was made" },
  });

  return NextResponse.json({ id: payment.id, receipt: payment.receipt });
}
