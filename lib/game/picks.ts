import type { Prisma, PrismaClient } from "@prisma/client";
import { GAME_CATEGORY_NAMES, GAME_POINT_VALUE_SLOTS, GAME_POINT_VALUES } from "@/lib/game/catalog";

export type GameQuestionBankItem = {
  pickId: string;
  questionId: string;
  value: number;
  question: string;
  answer: string;
};

export type GameQuestionBankByCategory = Record<string, GameQuestionBankItem[]>;

type DbClient = PrismaClient | Prisma.TransactionClient;

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

function ensureBankContainer(): GameQuestionBankByCategory {
  const bank: GameQuestionBankByCategory = {};
  for (const categoryName of GAME_CATEGORY_NAMES) {
    bank[categoryName] = [];
  }
  return bank;
}

export function picksToQuestionBank(
  picks: Array<{
    id: string;
    category_name: string;
    slot_index: number;
    value: number;
    question: {
      id: string;
      question_text: string;
      answer_text: string;
    };
  }>,
): GameQuestionBankByCategory {
  const bank = ensureBankContainer();
  const slotIndexByPickId = new Map<string, number>();

  for (const pick of picks) {
    slotIndexByPickId.set(pick.id, pick.slot_index);

    if (!bank[pick.category_name]) {
      bank[pick.category_name] = [];
    }

    bank[pick.category_name].push({
      pickId: pick.id,
      questionId: pick.question.id,
      value: pick.value,
      question: pick.question.question_text,
      answer: pick.question.answer_text,
    });
  }

  for (const categoryName of Object.keys(bank)) {
    bank[categoryName] = bank[categoryName].slice().sort((a, b) => {
      const aIndex = slotIndexByPickId.get(a.pickId) ?? 0;
      const bIndex = slotIndexByPickId.get(b.pickId) ?? 0;
      return aIndex - bIndex;
    });
  }

  return bank;
}

export async function createRandomGameQuestionPicks(
  tx: DbClient,
  gameSessionId: string,
): Promise<void> {
  const allCandidates = await tx.question.findMany({
    where: {
      active: true,
      category_name: { in: GAME_CATEGORY_NAMES },
      value: { in: GAME_POINT_VALUES },
    },
    select: {
      id: true,
      category_name: true,
      value: true,
    },
  });

  const candidateMap = new Map<string, string[]>();

  for (const candidate of allCandidates) {
    const key = `${candidate.category_name}::${candidate.value}`;
    const existing = candidateMap.get(key);
    if (existing) {
      existing.push(candidate.id);
    } else {
      candidateMap.set(key, [candidate.id]);
    }
  }

  const picks: Array<{
    game_session_id: string;
    category_name: string;
    value: number;
    slot_index: number;
    question_id: string;
  }> = [];

  const slotIndexesByValue = new Map<number, number[]>();
  for (const [slotIndex, value] of GAME_POINT_VALUE_SLOTS.entries()) {
    const slotIndexes = slotIndexesByValue.get(value);
    if (slotIndexes) {
      slotIndexes.push(slotIndex);
    } else {
      slotIndexesByValue.set(value, [slotIndex]);
    }
  }

  for (const categoryName of GAME_CATEGORY_NAMES) {
    for (const [value, slotIndexes] of slotIndexesByValue.entries()) {
      const key = `${categoryName}::${value}`;
      const pool = candidateMap.get(key) ?? [];

      if (pool.length === 0) {
        throw new Error(`MISSING_QUESTIONS:${categoryName}:${value}`);
      }
      if (pool.length < slotIndexes.length) {
        throw new Error(`INSUFFICIENT_QUESTIONS:${categoryName}:${value}:${slotIndexes.length}:${pool.length}`);
      }

      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = randomIndex(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      for (const [pickIndex, slotIndex] of slotIndexes.entries()) {
        picks.push({
          game_session_id: gameSessionId,
          category_name: categoryName,
          value,
          slot_index: slotIndex,
          question_id: shuffled[pickIndex],
        });
      }
    }
  }

  await tx.gameQuestionPick.deleteMany({
    where: { game_session_id: gameSessionId },
  });

  await tx.gameQuestionPick.createMany({
    data: picks,
  });
}
