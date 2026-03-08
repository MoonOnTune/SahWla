import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { getRealtimeServerClient } from "@/lib/game/realtime";
import { readTeamDeviceToken } from "@/lib/game/room-http";

export const runtime = "nodejs";

function parseChannel(channelName: string): { roomCode: string; kind: "host" | "team"; team?: "A" | "B" } | null {
  const hostMatch = /^private-room-([A-Z0-9_-]+)-host$/.exec(channelName);
  if (hostMatch) {
    return { roomCode: hostMatch[1], kind: "host" };
  }

  const teamMatch = /^private-room-([A-Z0-9_-]+)-team-(A|B)$/.exec(channelName);
  if (teamMatch) {
    return { roomCode: teamMatch[1], kind: "team", team: teamMatch[2] as "A" | "B" };
  }

  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const parsedChannel = parseChannel(channelName);
  if (!parsedChannel) {
    return NextResponse.json({ error: "Invalid channel name" }, { status: 400 });
  }

  const pusher = getRealtimeServerClient();
  if (!pusher) {
    return NextResponse.json({ error: "Realtime is not configured" }, { status: 503 });
  }

  if (parsedChannel.kind === "host") {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await prisma.gameRoom.findUnique({
      where: { room_code: parsedChannel.roomCode },
      select: {
        gameSession: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!room || room.gameSession.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(pusher.authorizeChannel(socketId, channelName), { status: 200 });
  }

  const deviceToken = await readTeamDeviceToken(parsedChannel.roomCode);
  if (!deviceToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = await prisma.gameRoom.findUnique({
    where: { room_code: parsedChannel.roomCode },
    select: { id: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participant = await prisma.gameRoomParticipant.findUnique({
    where: {
      room_id_device_token: {
        room_id: room.id,
        device_token: deviceToken,
      },
    },
    select: {
      id: true,
      team_key: true,
    },
  });

  if (!participant || participant.team_key !== parsedChannel.team) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(pusher.authorizeChannel(socketId, channelName), { status: 200 });
}
