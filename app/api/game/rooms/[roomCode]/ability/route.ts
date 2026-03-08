import { NextResponse } from "next/server";
import { broadcastRoomUpdated, readTeamDeviceToken, roomErrorResponse } from "@/lib/game/room-http";
import { useRoomAbility } from "@/lib/game/room-service";
import { useAbilitySchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await context.params;
  const deviceToken = await readTeamDeviceToken(roomCode);

  if (!deviceToken) {
    return NextResponse.json({ error: "Missing team device token" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = useAbilitySchema.safeParse({
    roomCode,
    abilityType: body.abilityType,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const snapshot = await useRoomAbility({
      roomCode,
      deviceToken,
      abilityType: parsed.data.abilityType,
    });

    await broadcastRoomUpdated(roomCode);

    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return roomErrorResponse(error);
  }
}
