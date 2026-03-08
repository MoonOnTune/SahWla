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
});
