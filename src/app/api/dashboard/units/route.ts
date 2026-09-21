export const dynamic = "force-dynamic";
// PATCH /api/dashboard/units — toggle unit availability (with confirm on client)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/serialize";

export async function PATCH(req: NextRequest) {
  const { unitId, status } = await req.json();
  if (!unitId || !["Available", "Taken", "Reserved"].includes(status)) {
    return NextResponse.json({ error: "unitId and valid status required" }, { status: 400 });
  }
  const unit = await db.unit.update({ where: { id: unitId }, data: { status } });
  await audit(db, { actor: "developer", action: `unit.marked_${status.toLowerCase()}`, object: "unit", objectId: unitId, metadata: { code: unit.code } });
  return NextResponse.json({ ok: true, unit });
}
