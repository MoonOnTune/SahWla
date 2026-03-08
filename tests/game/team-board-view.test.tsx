import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamBoardView } from "@/components/game/figma/TeamBoardView";
import type { TeamRoomSnapshot } from "@/lib/game/room-types";

const snapshot: TeamRoomSnapshot = {
  id: "room-1",
  roomCode: "ROOM42",
  mode: "SPECIAL",
  status: "ACTIVE",
  phase: "BOARD",
  dailyDoubleEnabled: true,
  currentTurnTeam: "A",
  currentRound: 4,
  pendingSuggestedPickId: null,
  selectedPickId: null,
  boardCategories: ["العلوم", "تاريخ"],
  board: [
    {
      name: "العلوم",
      type: "normal",
      tiles: [
        { pickId: "pick-1", value: 200, used: false },
        { pickId: "pick-2", value: 400, used: false },
      ],
    },
    {
      name: "تاريخ",
      type: "normal",
      tiles: [
        { pickId: "pick-3", value: 200, used: true },
        { pickId: "pick-4", value: 400, used: false },
      ],
    },
  ],
  teams: [
    {
      key: "A",
      name: "الصقور",
      color: "#06b6d4",
      colorLight: "#22d3ee",
      score: 0,
      correctStreak: 0,
      connectedCount: 2,
      captainParticipantId: "captain-a",
      participants: [],
      abilities: [],
    },
    {
      key: "B",
      name: "النجوم",
      color: "#d946ef",
      colorLight: "#e879f9",
      score: 0,
      correctStreak: 0,
      connectedCount: 1,
      captainParticipantId: "captain-b",
      participants: [],
    },
  ],
  visibleEvents: [],
  self: {
    id: "captain-a",
    nickname: "أحمد",
    role: "CAPTAIN",
    team: "A",
    connectedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  },
  chat: [],
};

describe("team board view", () => {
  it("renders the full board as horizontally scrollable category columns", () => {
    const onSuggest = vi.fn();

    render(<TeamBoardView snapshot={snapshot} canSuggest onSuggest={onSuggest} />);

    expect(screen.getByLabelText("لوحة الفريق")).toBeInTheDocument();
    expect(screen.getByText("العلوم")).toBeInTheDocument();
    expect(screen.getByText("تاريخ")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "اقتراح السؤال 200" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "اقتراح السؤال 400" })).toHaveLength(2);
    expect(screen.getAllByText("✓")).toHaveLength(1);
  });
});
