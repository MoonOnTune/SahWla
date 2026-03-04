import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { gameStartSchema } from "@/lib/validation/api";
import { createRandomGameQuestionPicks } from "@/lib/game/picks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = gameStartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const gameSession = await prisma.$transaction(async (tx) => {
      await tx.creditWallet.upsert({
        where: { user_id: userId },
        create: { user_id: userId, balance: 0 },
        update: {},
      });

      const updated = await tx.creditWallet.updateMany({
        where: {
          user_id: userId,
          balance: { gte: 1 },
        },
        data: {
          balance: { decrement: 1 },
        },
      });

      if (updated.count !== 1) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      const session = await tx.gameSession.create({
        data: {
          user_id: userId,
          status: "ACTIVE",
          metadata: (parsed.data.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      await createRandomGameQuestionPicks(tx, session.id);

      await tx.creditLedger.create({
        data: {
          user_id: userId,
          delta: -1,
          reason: "GAME_START",
          ref_type: "GAME_SESSION",
          ref_id: session.id,
        },
      });

      return session;
    });

    return NextResponse.json({ game_session_id: gameSession.id }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith("MISSING_QUESTIONS:")) {
      const [, categoryName, value] = error.message.split(":");
      return NextResponse.json(
        {
          error: `Missing questions for category '${categoryName}' at value ${value}. Import question bank first.`,
        },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message.startsWith("INSUFFICIENT_QUESTIONS:")) {
      const [, categoryName, value, required, available] = error.message.split(":");
      return NextResponse.json(
        {
          error: `Not enough questions for category '${categoryName}' at value ${value}. Required ${required}, available ${available}.`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Could not start game" }, { status: 500 });
  }
}
