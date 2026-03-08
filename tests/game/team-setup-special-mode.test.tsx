import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameProvider, useGame } from "@/components/game/figma/GameContext";
import { SpecialModeProvider } from "@/components/game/figma/SpecialModeContext";
import { TeamSetup } from "@/components/game/figma/TeamSetup";

function ScreenProbe() {
  const { screen: currentScreen } = useGame();
  return <div data-testid="current-screen">{currentScreen}</div>;
}

function renderTeamSetup() {
  return render(
    <GameProvider initialScreen="teams" activeSessionId="session-1" questionBankByCategory={{}}>
      <SpecialModeProvider>
        <TeamSetup />
        <ScreenProbe />
      </SpecialModeProvider>
    </GameProvider>,
  );
}

describe("team setup special mode", () => {
  it("shows mode selection and the daily double toggle", () => {
    renderTeamSetup();

    expect(screen.getByText("وضع اللعب")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الوضع الكلاسيكي" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الوضع الخاص" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ديلي دبل مفعّل" })).toBeInTheDocument();
  });

  it("routes special mode start to qr share instead of the board", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        roomCode: "ROOM42",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    renderTeamSetup();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "الوضع الخاص" }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ابدأ الجولة" }));
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByTestId("current-screen")).toHaveTextContent("qr");
    });
  });
});
