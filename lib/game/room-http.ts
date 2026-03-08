import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHostRoomChannel, getTeamRoomChannel, publishRealtimeEvent } from "@/lib/game/realtime";
import { getTeamDeviceCookieName, normalizeTeamDeviceToken } from "@/lib/game/team-device";
import { RoomRuleError } from "@/lib/game/room-service";

const CONFLICT_ERRORS = new Set([
  "NO_PENDING_SUGGESTION",
  "QUESTION_NOT_IN_PROGRESS",
  "SUGGESTION_NOT_ALLOWED_IN_CURRENT_PHASE",
  "PENDING_SUGGESTION_ALREADY_EXISTS",
  "QUESTION_ALREADY_IN_PROGRESS",
  "PICK_ALREADY_USED",
  "PICK_NOT_ON_BOARD",
  "NOT_YOUR_TURN",
  "ABILITY_NOT_ALLOWED_IN_CURRENT_PHASE",
  "ABILITY_NOT_FOUND",
  "ABILITY_ALREADY_USED_THIS_ROUND",
  "ABILITY_NOT_AVAILABLE",
  "BOARD_REQUIRES_SIX_CATEGORIES",
]);

export function roomRuleStatus(error: unknown): number {
  if (!(error instanceof RoomRuleError)) {
    return 500;
  }

  if (error.message === "ROOM_NOT_FOUND") {
    return 404;
  }

  if (error.message === "CAPTAIN_ONLY_ACTION") {
    return 403;
  }

  if (error.message === "PARTICIPANT_NOT_FOUND") {
    return 401;
  }

  if (CONFLICT_ERRORS.has(error.message)) {
    return 409;
  }

  return 400;
}

export function roomErrorResponse(error: unknown): NextResponse {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Unknown room error" },
    { status: roomRuleStatus(error) },
  );
}

export async function readTeamDeviceToken(roomCode: string): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeTeamDeviceToken(cookieStore.get(getTeamDeviceCookieName(roomCode))?.value);
}

export async function broadcastRoomUpdated(roomCode: string): Promise<void> {
  await Promise.all([
    publishRealtimeEvent({
      channel: getHostRoomChannel(roomCode),
      event: "room.updated",
      payload: { roomCode },
    }),
    publishRealtimeEvent({
      channel: getTeamRoomChannel(roomCode, "A"),
      event: "room.updated",
      payload: { roomCode, team: "A" },
    }),
    publishRealtimeEvent({
      channel: getTeamRoomChannel(roomCode, "B"),
      event: "room.updated",
      payload: { roomCode, team: "B" },
    }),
  ]);
}
