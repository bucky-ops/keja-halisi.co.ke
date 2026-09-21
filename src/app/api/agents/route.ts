// GET /api/agents — agent directory (public fields only)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAgentDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = await db.agent.findMany({ orderBy: { verificationStatus: "asc" } });
  return NextResponse.json(agents.map(toAgentDTO));
}
