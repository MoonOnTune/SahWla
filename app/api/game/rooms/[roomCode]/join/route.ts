import { NextResponse } from "next/server";
import { createTeamDeviceToken, getTeamDeviceCookieName } from "@/lib/game/team-device";
import { joinRoom } from "@/lib/game/room-service";
import { broadcastRoomUpdated, roomErrorResponse } from "@/lib/game/room-http";
import { joinRoomSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = joinRoomSchema.safeParse({
    roomCode,
    team: body.team,
    nickname: body.nickname,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const deviceToken = createTeamDeviceToken();

  try {
    const snapshot = await joinRoom({
      roomCode,
      team: parsed.data.team,
      nickname: parsed.data.nickname,
      deviceToken,
    });

    await broadcastRoomUpdated(roomCode);

    const response = NextResponse.json(snapshot, { status: 200 });
    response.cookies.set({
      name: getTeamDeviceCookieName(roomCode),
      value: deviceToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    return roomErrorResponse(error);
  }
}
