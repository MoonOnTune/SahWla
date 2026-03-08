import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamControllerView } from "@/components/game/figma/TeamControllerView";
import type { TeamRoomSnapshot } from "@/lib/game/room-types";

const memberSnapshot: TeamRoomSnapshot = {
  id: "room-1",
  roomCode: "ROOM42",
  mode: "SPECIAL",
  status: "ACTIVE",
  phase: "BOARD",
  dailyDoubleEnabled: true,
  currentTurnTeam: "A",
  currentRound: 3,
  pendingSuggestedPickId: null,
  selectedPickId: null,
  boardCategories: ["العلوم"],
  board: [
    {
      name: "العلوم",
      type: "normal",
      tiles: [
        { pickId: "pick-1", value: 200, used: false },
        { pickId: "pick-2", value: 400, used: true },
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
          id: "member-a",
          nickname: "مها",
          role: "MEMBER",
          team: "A",
          connectedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
        },
      ],
      abilities: [
        { id: "ability-1", type: "SHIELD", unlockedRound: 1, consumedAt: null },
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
      participants: [],
    },
  ],
  visibleEvents: [],
  self: {
    id: "member-a",
    nickname: "مها",
    role: "MEMBER",
    team: "A",
    connectedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  },
  chat: [],
};

describe("team controller view", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows nickname join form before participant is connected", () => {
    render(<TeamControllerView initialRoomCode="ROOM42" initialTeam="A" initialSnapshot={null} />);

    expect(screen.getByText("الانضمام إلى الفريق")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("اكتب اسمك")).toBeInTheDocument();
  });

  it("keeps captain-only actions disabled for regular members", () => {
    render(<TeamControllerView initialRoomCode="ROOM42" initialTeam="A" initialSnapshot={memberSnapshot} />);

    expect(screen.getByText("مها")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "اقتراح السؤال 200" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "استخدم SHIELD" })).not.toBeInTheDocument();
  });

  it("polls the latest uncached snapshot while connected", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/presence")) {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      if (url.includes("/leave")) {
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      }

      if (url.includes("/snapshot")) {
        return {
          ok: true,
          json: async () => memberSnapshot,
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TeamControllerView initialRoomCode="ROOM42" initialTeam="A" initialSnapshot={memberSnapshot} />);

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          input === "/api/game/rooms/ROOM42/snapshot" &&
          init &&
          typeof init === "object" &&
          "cache" in init &&
          "method" in init &&
          init.cache === "no-store" &&
          init.method === "GET",
      ),
    ).toBe(true);
  });
});
