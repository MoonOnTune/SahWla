import { NextResponse } from "next/server";
import { getTeamRoomSnapshot, suggestRoomTile } from "@/lib/game/room-service";
import { broadcastRoomUpdated, readTeamDeviceToken, roomErrorResponse } from "@/lib/game/room-http";
import { suggestTileSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await context.params;
  const deviceToken = await readTeamDeviceToken(roomCode);

  if (!deviceToken) {
    return NextResponse.json({ error: "Missing team device token" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = suggestTileSchema.safeParse({
    roomCode,
    categoryIndex: body.categoryIndex,
    questionIndex: body.questionIndex,
    pickId: body.pickId,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await suggestRoomTile({
      roomCode,
      deviceToken,
      categoryIndex: parsed.data.categoryIndex,
      questionIndex: parsed.data.questionIndex,
      pickId: parsed.data.pickId,
    });

    await broadcastRoomUpdated(roomCode);

    const snapshot = await getTeamRoomSnapshot({
      roomCode,
      deviceToken,
    });

    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}
