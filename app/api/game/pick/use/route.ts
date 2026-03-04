import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { markPickUsedSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = markPickUsedSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const pick = await prisma.gameQuestionPick.findUnique({
    where: { id: parsed.data.pickId },
    select: {
      id: true,
      gameSession: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!pick || pick.gameSession.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.gameQuestionPick.updateMany({
    where: {
      id: parsed.data.pickId,
      used_at: null,
    },
    data: {
      used_at: new Date(),
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
