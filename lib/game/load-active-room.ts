import { prisma } from "@/lib/db";
import { buildHostRoomSnapshot, type RoomSnapshotSource } from "@/lib/game/room-snapshot";
import type { RoomSnapshot } from "@/lib/game/room-types";

export async function loadActiveRoom(gameSessionId: string): Promise<RoomSnapshot | null> {
  const room = await prisma.gameRoom.findUnique({
    where: { game_session_id: gameSessionId },
    include: {
      teams: true,
      participants: true,
      abilities: true,
      chatMessages: true,
      events: {
        orderBy: { created_at: "asc" },
        take: 20,
      },
    },
  });

  if (!room) {
    return null;
  }

  const picks = await prisma.gameQuestionPick.findMany({
    where: {
      game_session_id: gameSessionId,
      category_name: { in: room.board_categories },
    },
    orderBy: [{ category_name: "asc" }, { slot_index: "asc" }],
    select: {
      id: true,
      category_name: true,
      value: true,
      slot_index: true,
      used_at: true,
    },
  });

  const snapshotSource: RoomSnapshotSource = {
    ...room,
    picks,
  };

  return buildHostRoomSnapshot(snapshotSource);
}
