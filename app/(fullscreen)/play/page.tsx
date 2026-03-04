import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";
import { prisma } from "@/lib/db";
import { PlayClient } from "@/components/game/play-client";
import { createRandomGameQuestionPicks, picksToQuestionBank } from "@/lib/game/picks";

export default async function PlayPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const [activeSession, wallet] = await Promise.all([
    prisma.gameSession.findFirst({
      where: { user_id: userId, status: "ACTIVE" },
      orderBy: { started_at: "desc" },
      select: { id: true },
    }),
    prisma.creditWallet.findUnique({ where: { user_id: userId }, select: { balance: true } }),
  ]);

  if (!activeSession) {
    return <PlayClient hasActiveSession={false} canStartGame={(wallet?.balance ?? 0) >= 1} />;
  }

  const existingPicks = await prisma.gameQuestionPick.findMany({
    where: { game_session_id: activeSession.id },
    select: { id: true },
    take: 1,
  });

  if (existingPicks.length === 0) {
    await prisma.$transaction(async (tx) => {
      await createRandomGameQuestionPicks(tx, activeSession.id);
    });
  }

  const picks = await prisma.gameQuestionPick.findMany({
    where: { game_session_id: activeSession.id },
    orderBy: [{ category_name: "asc" }, { slot_index: "asc" }],
    select: {
      id: true,
      category_name: true,
      slot_index: true,
      value: true,
      question: {
        select: {
          id: true,
          question_text: true,
          answer_text: true,
        },
      },
    },
  });

  const questionBankByCategory = picksToQuestionBank(picks);

  return (
    <PlayClient
      hasActiveSession
      canStartGame={(wallet?.balance ?? 0) >= 1}
      activeSessionId={activeSession.id}
      questionBankByCategory={questionBankByCategory}
    />
  );
}
