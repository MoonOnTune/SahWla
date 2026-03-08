import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameProvider, useGame } from "@/components/game/figma/GameContext";
import { SpecialModeProvider, useSpecialMode } from "@/components/game/figma/SpecialModeContext";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <GameProvider initialScreen="categories" activeSessionId="session-1" questionBankByCategory={{}}>
      <SpecialModeProvider>{children}</SpecialModeProvider>
    </GameProvider>
  );
}

describe("mode-aware game context", () => {
  it("starts in classic mode by default", () => {
    const { result } = renderHook(
      () => ({
        game: useGame(),
        special: useSpecialMode(),
      }),
      { wrapper },
    );

    expect(result.current.game.gameMode).toBe("CLASSIC");
    expect(result.current.game.dailyDoubleEnabled).toBe(true);
    expect(result.current.special.roomCode).toBeNull();
  });

  it("stores special mode room metadata separately from classic teams state", () => {
    const { result } = renderHook(
      () => ({
        game: useGame(),
        special: useSpecialMode(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.game.setGameMode("SPECIAL");
      result.current.special.setRoomCode("ROOM42");
      result.current.special.setPendingSuggestedPickId("pick-1");
    });

    expect(result.current.game.teams[0].nameAr).toBe("الفريق أ");
    expect(result.current.special.roomCode).toBe("ROOM42");
    expect(result.current.special.pendingSuggestedPickId).toBe("pick-1");
  });

  it("ignores classic local storage when hydrating a special mode room", () => {
    window.localStorage.setItem(
      "sah_wala_game_state",
      JSON.stringify({
        gameMode: "CLASSIC",
        dailyDoubleEnabled: true,
        screen: "board",
        categories: [],
        teams: [
          {
            name: "Classic A",
            nameAr: "كلاسيك أ",
            score: 0,
            playerCount: 1,
            playerNames: [],
            color: "#06b6d4",
            colorLight: "#22d3ee",
          },
          {
            name: "Classic B",
            nameAr: "كلاسيك ب",
            score: 0,
            playerCount: 1,
            playerNames: [],
            color: "#d946ef",
            colorLight: "#e879f9",
          },
        ],
        currentTurn: 1,
        selectedQuestion: null,
        questionPhase: "showing",
        usedTiles: [],
      }),
    );

    const specialWrapper = ({ children }: { children: ReactNode }) => (
      <GameProvider
        initialScreen="board"
        initialGameMode="SPECIAL"
        initialCategories={[
          {
            name: "رياضة",
            questions: [
              {
                question: "سؤال",
                answer: "جواب",
                value: 200,
                pickId: "pick-1",
                questionId: "question-1",
              },
            ],
          },
        ]}
        activeSessionId="session-1"
        questionBankByCategory={{}}
      >
        <SpecialModeProvider>{children}</SpecialModeProvider>
      </GameProvider>
    );

    const { result } = renderHook(() => useGame(), { wrapper: specialWrapper });

    expect(result.current.gameMode).toBe("SPECIAL");
    expect(result.current.screen).toBe("board");
    expect(result.current.categories[0]?.name).toBe("رياضة");
    expect(result.current.teams[0].nameAr).toBe("الفريق أ");
  });
});
