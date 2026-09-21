// POST /api/verify/submit — role-aware verification submission (pending → admin queue)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

const ROLE_DOCS: Record<string, string[]> = {
  Agent: ["otp", "id_selfie", "referral"],
  Owner: ["otp", "id_selfie", "kplc_bill"],
  Developer: ["otp", "id_selfie", "title_deed"],
  Caretaker: ["otp", "id_selfie", "mandate_letter"],
};

export async function POST(req: NextRequest) {
  const { phone, tiktokHandle, role, docs, mandateEstates } = await req.json();

  if (!phone || !tiktokHandle || !ROLE_DOCS[role]) {
    return NextResponse.json({ error: "phone, tiktokHandle and a valid role are required" }, { status: 400 });
  }
  const handle = String(tiktokHandle).startsWith("@") ? tiktokHandle : `@${tiktokHandle}`;

  const existing = await db.agent.findUnique({ where: { tiktokHandle: handle } });
  if (existing && existing.verificationStatus !== "pending") {
    return NextResponse.json({ error: "This handle is already verified" }, { status: 409 });
  }

  const agent = existing
    ? await db.agent.update({
        where: { tiktokHandle: handle },
        data: {
          role,
          phone,
          verificationStatus: "pending",
          ...(role === "Caretaker" && mandateEstates
            ? { mandateEstates: JSON.stringify(mandateEstates), mandateLetterUrl: `vault://mandate-letters/${handle}/mandate.enc` }
            : {}),
        },
      })
    : await db.agent.create({
        data: {
          role,
          phone,
          tiktokHandle: handle,
          verificationStatus: "pending",
          idEncrypted: `vault://verification-docs/${handle}/id.enc`,
          selfieUrl: `vault://verification-docs/${handle}/selfie.enc`,
          ...(role === "Caretaker" && mandateEstates
            ? { mandateEstates: JSON.stringify(mandateEstates), mandateLetterUrl: `vault://mandate-letters/${handle}/mandate.enc` }
            : {}),
        },
      });

  const requiredDocs = ROLE_DOCS[role] as string[];
  for (const docType of requiredDocs) {
    const provided = docs?.includes?.(docType) ?? true; // demo: uploads simulated client-side
    await db.verification.create({
      data: {
        agentId: agent.id,
        docType,
        status: provided ? "pending" : "missing",
        storageRef: `vault://verification-docs/${handle}/${docType}.enc`,
      },
    });
  }

  await audit(db, {
    actor: handle,
    action: "verification.submitted",
    object: "agent",
    objectId: agent.id,
    metadata: { role, docs: requiredDocs, mandateEstates },
  });

  return NextResponse.json({
    status: "pending",
    message: "Verification submitted • OTP + ID/selfie + evidence review queued • Under review 2h — you will get SMS",
  });
}
