import { NextResponse } from "next/server";
import { broadcastRoomUpdated, readTeamDeviceToken, roomErrorResponse } from "@/lib/game/room-http";
import { disconnectRoomParticipant } from "@/lib/game/room-service";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await context.params;
  const deviceToken = await readTeamDeviceToken(roomCode);

  if (!deviceToken) {
    return NextResponse.json({ error: "Missing team device token" }, { status: 401 });
  }

  try {
    await disconnectRoomParticipant({
      roomCode,
      deviceToken,
    });
    await broadcastRoomUpdated(roomCode);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}
