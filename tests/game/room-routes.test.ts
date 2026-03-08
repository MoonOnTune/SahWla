import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomRuleError } from "@/lib/game/room-service";

const {
  requireUserIdMock,
  suggestRoomTileMock,
  confirmRoomSuggestionMock,
  readTeamDeviceTokenMock,
  broadcastRoomUpdatedMock,
} = vi.hoisted(() => ({
  requireUserIdMock: vi.fn(),
  suggestRoomTileMock: vi.fn(),
  confirmRoomSuggestionMock: vi.fn(),
  readTeamDeviceTokenMock: vi.fn(),
  broadcastRoomUpdatedMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: requireUserIdMock,
}));

vi.mock("@/lib/game/room-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/game/room-service")>("@/lib/game/room-service");

  return {
    ...actual,
    suggestRoomTile: suggestRoomTileMock,
    confirmRoomSuggestion: confirmRoomSuggestionMock,
  };
});

vi.mock("@/lib/game/room-http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/game/room-http")>("@/lib/game/room-http");

  return {
    ...actual,
    readTeamDeviceToken: readTeamDeviceTokenMock,
    broadcastRoomUpdated: broadcastRoomUpdatedMock,
  };
});

describe("room routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    readTeamDeviceTokenMock.mockResolvedValue("device-1");
    broadcastRoomUpdatedMock.mockResolvedValue(undefined);
  });

  it("blocks non-captains from suggesting a tile", async () => {
    suggestRoomTileMock.mockRejectedValue(new RoomRuleError("CAPTAIN_ONLY_ACTION"));

    const { POST } = await import("@/app/api/game/rooms/[roomCode]/suggest/route");
    const response = await POST(
      new Request("http://localhost/api/game/rooms/ROOM1/suggest", {
        method: "POST",
        body: JSON.stringify({
          roomCode: "ROOM1",
          categoryIndex: 0,
          questionIndex: 0,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ roomCode: "ROOM1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("blocks host confirmation when there is no pending suggestion", async () => {
    requireUserIdMock.mockResolvedValue("user-1");
    confirmRoomSuggestionMock.mockRejectedValue(new RoomRuleError("NO_PENDING_SUGGESTION"));

    const { POST } = await import("@/app/api/game/rooms/[roomCode]/confirm/route");
    const response = await POST(
      new Request("http://localhost/api/game/rooms/ROOM1/confirm", {
        method: "POST",
        body: JSON.stringify({ roomCode: "ROOM1" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ roomCode: "ROOM1" }) },
    );

    expect(response.status).toBe(409);
  });
});
