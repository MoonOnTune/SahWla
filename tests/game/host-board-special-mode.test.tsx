import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameBoard } from "@/components/game/figma/GameBoard";
import { GameProvider, useGame } from "@/components/game/figma/GameContext";
import { SpecialModeProvider, useSpecialMode } from "@/components/game/figma/SpecialModeContext";
import type { RoomSnapshot } from "@/lib/game/room-types";

const snapshot: RoomSnapshot = {
  id: "room-1",
  roomCode: "ROOM42",
  mode: "SPECIAL",
  status: "ACTIVE",
  phase: "BOARD",
  dailyDoubleEnabled: true,
  currentTurnTeam: "A",
  currentRound: 2,
  pendingSuggestedPickId: "pick-1",
  selectedPickId: null,
  boardCategories: ["العلوم"],
  board: [
    {
      name: "العلوم",
      type: "normal",
      tiles: [
        { pickId: "pick-1", value: 200, used: false },
        { pickId: "pick-2", value: 400, used: false },
      ],
    },
  ],
  teams: [
    {
      key: "A",
      name: "الصقور",
      color: "#06b6d4",
      colorLight: "#22d3ee",
      score: 400,
      correctStreak: 2,
      connectedCount: 3,
      captainParticipantId: "captain-a",
      participants: [
        {
          id: "captain-a",
          nickname: "أحمد",
          role: "CAPTAIN",
          team: "A",
          connectedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
        },
      ],
    },
    {
      key: "B",
      name: "النجوم",
      color: "#d946ef",
      colorLight: "#e879f9",
      score: 200,
      correctStreak: 0,
      connectedCount: 2,
      captainParticipantId: "captain-b",
      participants: [
        {
          id: "captain-b",
          nickname: "سارة",
          role: "CAPTAIN",
          team: "B",
          connectedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
        },
      ],
    },
  ],
  visibleEvents: [
    {
      id: "event-1",
      team: "A",
      type: "POINT_THEFT",
      message: "تم تفعيل سرقة النقاط",
      createdAt: new Date().toISOString(),
    },
  ],
};

function BoardHarness() {
  const game = useGame();
  const special = useSpecialMode();

  useEffect(() => {
    game.setGameMode("SPECIAL");
    game.setCategories([
      {
        name: "العلوم",
        questions: [
          { question: "سؤال ١", answer: "جواب ١", value: 200, pickId: "pick-1" },
          { question: "سؤال ٢", answer: "جواب ٢", value: 400, pickId: "pick-2" },
        ],
      },
    ]);
    special.setHostSnapshot(snapshot);
    special.setRoomCode("ROOM42");
  }, []);

  return <GameBoard />;
}

describe("host board special mode", () => {
  it("shows pending suggested tile and connected counts in special mode", async () => {
    render(
      <GameProvider initialScreen="board" activeSessionId="session-1" questionBankByCategory={{}}>
        <SpecialModeProvider>
          <BoardHarness />
        </SpecialModeProvider>
      </GameProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("3 متصل")).toBeInTheDocument();
      expect(screen.getByText("2 متصل")).toBeInTheDocument();
      expect(screen.getByText("القائد: أحمد")).toBeInTheDocument();
      expect(screen.getByText("القائد: سارة")).toBeInTheDocument();
      expect(screen.getByText("اقتراح معلق")).toBeInTheDocument();
      expect(screen.getByText("تم تفعيل سرقة النقاط")).toBeInTheDocument();
    });
  });

  it("does not render hidden ability inventory on host board", async () => {
    render(
      <GameProvider initialScreen="board" activeSessionId="session-1" questionBankByCategory={{}}>
        <SpecialModeProvider>
          <BoardHarness />
        </SpecialModeProvider>
      </GameProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("SHIELD")).not.toBeInTheDocument();
      expect(screen.queryByText("DOUBLE_POINTS")).not.toBeInTheDocument();
    });
  });
});
