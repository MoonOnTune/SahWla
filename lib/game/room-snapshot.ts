import type { GameParticipantRole, GameTeamKey } from "@prisma/client";
import type { RoomParticipantView } from "@/lib/game/room-types";

export function toParticipantView(participant: {
  id: string;
  nickname: string;
  role: GameParticipantRole;
  team_key: GameTeamKey;
  connected_at: Date;
  last_seen_at: Date;
}): RoomParticipantView {
  return {
    id: participant.id,
    nickname: participant.nickname,
    role: participant.role,
    team: participant.team_key,
    connectedAt: participant.connected_at.toISOString(),
    lastSeenAt: participant.last_seen_at.toISOString(),
  };
}
