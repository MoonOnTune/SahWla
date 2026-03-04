import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createRandomGameQuestionPicks } from "../lib/game/picks";
import {
  GAME_CATEGORY_NAMES,
  GAME_POINT_VALUES,
  GAME_POINT_VALUE_SLOTS,
} from "../lib/game/catalog";

const prisma = new PrismaClient();

function expectedPicksPerSession(): number {
  return GAME_CATEGORY_NAMES.length * GAME_POINT_VALUE_SLOTS.length;
}

async function createSessionWithPicks(userId: string): Promise<{
  sessionId: string;
  picks: Array<{
    category_name: string;
    value: number;
    slot_index: number;
    question_id: string;
    question: {
      question_text: string;
      answer_text: string;
    };
  }>;
}> {
  return prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.create({
      data: {
        user_id: userId,
        status: "ACTIVE",
        metadata: { source: "verify-game-picks" },
      },
      select: { id: true },
    });

    await createRandomGameQuestionPicks(tx, session.id);

    const picks = await tx.gameQuestionPick.findMany({
      where: { game_session_id: session.id },
      orderBy: [{ category_name: "asc" }, { value: "asc" }, { slot_index: "asc" }],
      select: {
        category_name: true,
        value: true,
        slot_index: true,
        question_id: true,
        question: {
          select: {
            question_text: true,
            answer_text: true,
          },
        },
      },
    });

    await tx.gameSession.delete({
      where: { id: session.id },
    });

    return { sessionId: session.id, picks };
  });
}

function keyForTile(
  item: {
    category_name: string;
    value: number;
    slot_index: number;
  },
): string {
  return `${item.category_name}::${item.value}::${item.slot_index}`;
}

async function main() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@sahwala.local";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`Demo user not found for email '${email}'. Seed users first.`);
  }

  const coverage = await prisma.question.groupBy({
    by: ["category_name", "value"],
    where: {
      active: true,
      category_name: { in: GAME_CATEGORY_NAMES },
      value: { in: GAME_POINT_VALUES },
    },
    _count: { _all: true },
  });

  const coverageMap = new Map<string, number>();
  for (const row of coverage) {
    coverageMap.set(`${row.category_name}::${row.value}`, row._count._all);
  }

  const coverageErrors: string[] = [];
  for (const categoryName of GAME_CATEGORY_NAMES) {
    for (const value of GAME_POINT_VALUES) {
      const count = coverageMap.get(`${categoryName}::${value}`) ?? 0;
      if (count <= 0) {
        coverageErrors.push(`${categoryName} @ ${value}`);
      }
    }
  }
  if (coverageErrors.length > 0) {
    throw new Error(`Missing active question coverage for: ${coverageErrors.join(", ")}`);
  }

  const first = await createSessionWithPicks(user.id);
  const second = await createSessionWithPicks(user.id);
  const expected = expectedPicksPerSession();

  if (first.picks.length !== expected) {
    throw new Error(`Session ${first.sessionId} picks=${first.picks.length}, expected=${expected}`);
  }
  if (second.picks.length !== expected) {
    throw new Error(`Session ${second.sessionId} picks=${second.picks.length}, expected=${expected}`);
  }

  const emptyContent = first.picks.filter(
    (pick) =>
      pick.question.question_text.trim().length === 0 ||
      pick.question.answer_text.trim().length === 0,
  );
  if (emptyContent.length > 0) {
    throw new Error(`Found ${emptyContent.length} picks with empty question/answer text.`);
  }

  const firstByTile = new Map(first.picks.map((pick) => [keyForTile(pick), pick.question_id]));
  const secondByTile = new Map(second.picks.map((pick) => [keyForTile(pick), pick.question_id]));
  let sameTiles = 0;
  for (const [tileKey, questionId] of firstByTile.entries()) {
    if (secondByTile.get(tileKey) === questionId) {
      sameTiles += 1;
    }
  }

  console.log("Verification passed.");
  console.log(`- Expected picks/session: ${expected}`);
  console.log(`- Session A picks: ${first.picks.length}`);
  console.log(`- Session B picks: ${second.picks.length}`);
  console.log(`- Same tile/question matches across two sessions: ${sameTiles}/${expected}`);
}

main()
  .catch((error) => {
    console.error("Verification failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
