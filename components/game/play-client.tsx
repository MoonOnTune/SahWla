"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ShieldAlert, ShoppingCart, ArrowRight, Home } from "lucide-react";
import { GameProvider, useGame, type Category, type SelectedQuestion, type Team } from "@/components/game/figma/GameContext";
import { SpecialModeProvider } from "@/components/game/figma/SpecialModeContext";
import { CategorySetup } from "@/components/game/figma/CategorySetup";
import { TeamSetup } from "@/components/game/figma/TeamSetup";
import { QrShareScreen } from "@/components/game/figma/QrShareScreen";
import { GameBoard } from "@/components/game/figma/GameBoard";
import { QuestionView } from "@/components/game/figma/QuestionView";
import { WalaKalmaView } from "@/components/game/figma/WalaKalmaView";
import { WinnerScreen } from "@/components/game/figma/WinnerScreen";
import type { GameQuestionBankByCategory } from "@/lib/game/picks";
import type { RoomSnapshot } from "@/lib/game/room-types";

function buildSpecialModeCategories(
  questionBankByCategory: GameQuestionBankByCategory,
  activeRoomSnapshot: RoomSnapshot | null | undefined,
): Category[] {
  if (!activeRoomSnapshot) {
    return [];
  }

  return activeRoomSnapshot.board.map((category) => ({
    name: category.name,
    type: category.type,
    questions: (questionBankByCategory[category.name] ?? []).map((item) => ({
      question: item.question,
      answer: item.answer,
      value: item.value,
      pickId: item.pickId,
      questionId: item.questionId,
    })),
  }));
}

function buildSpecialModeTeams(activeRoomSnapshot: RoomSnapshot | null | undefined): [Team, Team] | undefined {
  if (!activeRoomSnapshot) {
    return undefined;
  }

  const teamA = activeRoomSnapshot.teams.find((team) => team.key === "A");
  const teamB = activeRoomSnapshot.teams.find((team) => team.key === "B");

  if (!teamA || !teamB) {
    return undefined;
  }

  return [
    {
      name: "Team A",
      nameAr: teamA.name,
      score: teamA.score,
      playerCount: teamA.connectedCount,
      playerNames: teamA.participants.map((participant) => participant.nickname),
      color: teamA.color,
      colorLight: teamA.colorLight,
    },
    {
      name: "Team B",
      nameAr: teamB.name,
      score: teamB.score,
      playerCount: teamB.connectedCount,
      playerNames: teamB.participants.map((participant) => participant.nickname),
      color: teamB.color,
      colorLight: teamB.colorLight,
    },
  ];
}

function findSelectedQuestion(
  categories: Category[],
  activeRoomSnapshot: RoomSnapshot | null | undefined,
): SelectedQuestion | null {
  const selectedPickId = activeRoomSnapshot?.selectedPickId;

  if (!selectedPickId) {
    return null;
  }

  for (const [catIndex, category] of categories.entries()) {
    const qIndex = category.questions.findIndex((question) => question.pickId === selectedPickId);
    if (qIndex >= 0) {
      return { catIndex, qIndex };
    }
  }

  return null;
}

function GameScreens() {
  const { screen, resetGame } = useGame();
  const router = useRouter();

  const handleNewGame = useCallback(() => {
    localStorage.removeItem("sah_wala_game_state");
    resetGame();
    router.push("/");
    router.refresh();
  }, [resetGame, router]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="size-full"
      >
        {screen === "categories" && <CategorySetup />}
        {screen === "teams" && <TeamSetup />}
        {screen === "qr" && <QrShareScreen />}
        {screen === "board" && <GameBoard />}
        {screen === "question" && <QuestionView />}
        {screen === "walakalma" && <WalaKalmaView />}
        {screen === "winner" && <WinnerScreen onNewGame={handleNewGame} />}
      </motion.div>
    </AnimatePresence>
  );
}

type Props = {
  hasActiveSession: boolean;
  canStartGame: boolean;
  activeSessionId?: string;
  questionBankByCategory?: GameQuestionBankByCategory;
  activeRoomSnapshot?: RoomSnapshot | null;
};

export function PlayClient({ hasActiveSession, activeSessionId, questionBankByCategory, activeRoomSnapshot }: Props) {
  const router = useRouter();
  const specialModeCategories = useMemo(
    () => buildSpecialModeCategories(questionBankByCategory ?? {}, activeRoomSnapshot),
    [activeRoomSnapshot, questionBankByCategory],
  );
  const specialModeTeams = useMemo(() => buildSpecialModeTeams(activeRoomSnapshot), [activeRoomSnapshot]);
  const specialModeSelectedQuestion = useMemo(
    () => findSelectedQuestion(specialModeCategories, activeRoomSnapshot),
    [activeRoomSnapshot, specialModeCategories],
  );

  const initialSpecialScreen = useMemo(() => {
    if (!activeRoomSnapshot) {
      return "categories" as const;
    }

    if (activeRoomSnapshot.phase === "QR") {
      return "qr" as const;
    }

    if (activeRoomSnapshot.phase === "QUESTION" && specialModeSelectedQuestion) {
      const selectedCategory = specialModeCategories[specialModeSelectedQuestion.catIndex];
      return selectedCategory?.type === "walakalma" ? "walakalma" : "question";
    }

    if (activeRoomSnapshot.phase === "WINNER") {
      return "winner" as const;
    }

    return "board" as const;
  }, [activeRoomSnapshot, specialModeCategories, specialModeSelectedQuestion]);

  if (!hasActiveSession) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <ShieldAlert className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl text-white mb-4" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>
            لا توجد جلسة لعب نشطة
          </h2>
          <p className="text-white/50 mb-8" style={{ fontFamily: "Cairo, sans-serif" }}>
            تحتاج لبدء لعبة جديدة من المتجر أولاً
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/shop")}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                boxShadow: "0 0 30px rgba(6, 182, 212, 0.3)",
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                fontSize: "1.2rem",
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              الذهاب للمتجر
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 transition-all cursor-pointer"
              style={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
            >
              <ArrowRight className="w-4 h-4" />
              رجوع
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <GameProvider
      initialScreen={initialSpecialScreen}
      initialGameMode={activeRoomSnapshot ? "SPECIAL" : "CLASSIC"}
      initialDailyDoubleEnabled={activeRoomSnapshot?.dailyDoubleEnabled ?? true}
      initialCategories={specialModeCategories}
      initialTeams={specialModeTeams}
      initialCurrentTurn={activeRoomSnapshot?.currentTurnTeam === "B" ? 1 : 0}
      initialSelectedQuestion={specialModeSelectedQuestion}
      initialQuestionPhase={activeRoomSnapshot?.selectedPickId ? "timerA" : "showing"}
      activeSessionId={activeSessionId ?? ""}
      questionBankByCategory={questionBankByCategory ?? {}}
    >
      <SpecialModeProvider
        initialRoomCode={activeRoomSnapshot?.roomCode ?? null}
        initialHostSnapshot={activeRoomSnapshot ?? null}
      >
        <div className="size-full" style={{ fontFamily: "Cairo, sans-serif" }}>
          <button
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            aria-label="الخروج للقائمة الرئيسية"
            title="الخروج للقائمة الرئيسية"
            className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/85 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <Home className="w-5 h-5" />
          </button>
          <GameScreens />
        </div>
      </SpecialModeProvider>
    </GameProvider>
  );
}
