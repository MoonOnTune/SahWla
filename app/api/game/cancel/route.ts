import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";

export const runtime = "nodejs";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await prisma.gameSession.updateMany({
    where: {
      user_id: userId,
      status: "ACTIVE",
    },
    data: {
      status: "CANCELLED",
      ended_at: now,
    },
  });

  return NextResponse.json({ cancelled_sessions: result.count }, { status: 200 });
}
