import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/require-user";
import { createSpecialModeRoom } from "@/lib/game/room-service";
import { roomErrorResponse } from "@/lib/game/room-http";
import { createRoomSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createRoomSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const snapshot = await createSpecialModeRoom({
      ownerUserId: userId,
      gameSessionId: parsed.data.gameSessionId,
      categoryNames: parsed.data.categoryNames,
      dailyDoubleEnabled: parsed.data.dailyDoubleEnabled,
      teams: parsed.data.teams,
    });

    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}
