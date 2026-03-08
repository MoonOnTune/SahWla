import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/require-user";
import { getHostRoomSnapshot, getTeamRoomSnapshot } from "@/lib/game/room-service";
import { readTeamDeviceToken, roomErrorResponse } from "@/lib/game/room-http";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await context.params;
  const userId = await requireUserId();

  try {
    if (userId) {
      const snapshot = await getHostRoomSnapshot({
        roomCode,
        ownerUserId: userId,
      });
      return NextResponse.json(snapshot, { status: 200 });
    }

    const deviceToken = await readTeamDeviceToken(roomCode);
    if (!deviceToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await getTeamRoomSnapshot({
      roomCode,
      deviceToken,
    });
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}
