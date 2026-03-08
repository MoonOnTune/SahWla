import { describe, expect, it } from "vitest";
import { buildHostRoomSnapshot, type RoomSnapshotSource } from "@/lib/game/room-snapshot";

describe("room snapshot", () => {
  it("counts only active participants as connected", () => {
    const now = Date.now();
    const snapshot = buildHostRoomSnapshot({
      id: "room-1",
      room_code: "ROOM42",
      mode: "SPECIAL",
      status: "ACTIVE",
      phase: "BOARD",
      daily_double_enabled: true,
      current_turn_team: "A",
      current_round: 4,
      pending_suggested_pick_id: null,
      selected_pick_id: null,
      board_categories: ["العلوم"],
      teams: [
        {
          team_key: "A",
          name: "الصقور",
          color: "#06b6d4",
          color_light: "#22d3ee",
          score: 400,
          correct_streak: 2,
          captain_participant_id: "captain-a",
        },
        {
          team_key: "B",
          name: "النجوم",
          color: "#d946ef",
          color_light: "#e879f9",
          score: 200,
          correct_streak: 1,
          captain_participant_id: "captain-b",
        },
      ],
      participants: [
        {
          id: "captain-a",
          nickname: "أحمد",
          role: "CAPTAIN",
          team_key: "A",
          connected_at: new Date(now - 60_000),
          last_seen_at: new Date(now),
          disconnected_at: null,
        },
        {
          id: "member-a-stale",
          nickname: "مها",
          role: "MEMBER",
          team_key: "A",
          connected_at: new Date(now - 120_000),
          last_seen_at: new Date(now - 120_000),
          disconnected_at: null,
        },
        {
          id: "captain-b",
          nickname: "سارة",
          role: "CAPTAIN",
          team_key: "B",
          connected_at: new Date(now - 90_000),
          last_seen_at: new Date(now),
          disconnected_at: new Date(now - 1_000),
        },
      ],
      abilities: [],
      chatMessages: [],
      events: [],
      picks: [
        {
          id: "pick-1",
          category_name: "العلوم",
          value: 200,
          slot_index: 0,
          used_at: null,
        },
      ],
    } satisfies RoomSnapshotSource);

    expect(snapshot.teams.find((team) => team.key === "A")?.connectedCount).toBe(1);
    expect(snapshot.teams.find((team) => team.key === "B")?.connectedCount).toBe(0);
  });
});
