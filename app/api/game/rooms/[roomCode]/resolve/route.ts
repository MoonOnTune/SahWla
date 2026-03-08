import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/require-user";
import { broadcastRoomUpdated, roomErrorResponse } from "@/lib/game/room-http";
import { resolveRoomQuestion } from "@/lib/game/room-service";
import { resolveQuestionSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ roomCode: string }> }) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = resolveQuestionSchema.safeParse({
    roomCode,
    winningTeam: body.winningTeam ?? null,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const snapshot = await resolveRoomQuestion({
      roomCode,
      ownerUserId: userId,
      winningTeam: parsed.data.winningTeam,
    });

    await broadcastRoomUpdated(roomCode);

    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}
