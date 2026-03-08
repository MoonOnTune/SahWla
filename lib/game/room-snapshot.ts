import type { GameAbilityType, GameParticipantRole, GameTeamKey } from "@prisma/client";
import { WALA_KALMA_CATEGORY_NAME } from "@/lib/game/catalog";
import type {
  RoomBoardCategoryView,
  RoomChatMessageView,
  RoomParticipantView,
  RoomSnapshot,
  RoomTeamView,
  TeamRoomSnapshot,
} from "@/lib/game/room-types";

export interface RoomSnapshotSource {
  id: string;
  room_code: string;
  mode: "CLASSIC" | "SPECIAL";
  status: "SETUP" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  phase: "QR" | "BOARD" | "QUESTION" | "ANSWER" | "WINNER";
  daily_double_enabled: boolean;
  current_turn_team: GameTeamKey;
  current_round: number;
  pending_suggested_pick_id: string | null;
  selected_pick_id: string | null;
  board_categories: string[];
  teams: Array<{
    team_key: GameTeamKey;
    name: string;
    color: string;
    color_light: string;
    score: number;
    correct_streak: number;
    captain_participant_id: string | null;
  }>;
  participants: Array<{
    id: string;
    nickname: string;
    role: GameParticipantRole;
    team_key: GameTeamKey;
    connected_at: Date;
    last_seen_at: Date;
    disconnected_at: Date | null;
  }>;
  abilities: Array<{
    id: string;
    team_key: GameTeamKey;
    ability_type: GameAbilityType;
    unlocked_round: number;
    consumed_at: Date | null;
  }>;
  chatMessages: Array<{
    id: string;
    team_key: GameTeamKey;
    participant_id: string;
    message: string;
    created_at: Date;
  }>;
  events: Array<{
    id: string;
    team_key: GameTeamKey | null;
    event_type: string;
    message: string;
    created_at: Date;
  }>;
  picks: Array<{
    id: string;
    category_name: string;
    value: number;
    slot_index: number;
    used_at: Date | null;
  }>;
}

function toParticipantView(participant: RoomSnapshotSource["participants"][number]): RoomParticipantView {
  return {
    id: participant.id,
    nickname: participant.nickname,
    role: participant.role,
    team: participant.team_key,
    connectedAt: participant.connected_at.toISOString(),
    lastSeenAt: participant.last_seen_at.toISOString(),
  };
}

function buildBoard(room: RoomSnapshotSource): RoomBoardCategoryView[] {
  return room.board_categories.map((categoryName) => ({
    name: categoryName,
    type: categoryName === WALA_KALMA_CATEGORY_NAME ? "walakalma" : "normal",
    tiles: room.picks
      .filter((pick) => pick.category_name === categoryName)
      .sort((left, right) => left.slot_index - right.slot_index)
      .map((pick) => ({
        pickId: pick.id,
        value: pick.value,
        used: pick.used_at !== null,
      })),
  }));
}

const CONNECTED_PARTICIPANT_WINDOW_MS = 45_000;

function isParticipantConnected(
  participant: RoomSnapshotSource["participants"][number],
  now = Date.now(),
): boolean {
  if (participant.disconnected_at) {
    return false;
  }

  return participant.last_seen_at.getTime() >= now - CONNECTED_PARTICIPANT_WINDOW_MS;
}

function buildTeams(room: RoomSnapshotSource, viewerTeam?: GameTeamKey): RoomTeamView[] {
  const now = Date.now();

  return room.teams
    .slice()
    .sort((left, right) => left.team_key.localeCompare(right.team_key))
    .map((team) => {
      const participants = room.participants.filter((participant) => participant.team_key === team.team_key);
      const connectedParticipants = participants.filter((participant) => isParticipantConnected(participant, now));
      const abilities =
        viewerTeam && viewerTeam === team.team_key
          ? room.abilities
              .filter((ability) => ability.team_key === team.team_key)
              .map((ability) => ({
                id: ability.id,
                type: ability.ability_type,
                unlockedRound: ability.unlocked_round,
                consumedAt: ability.consumed_at?.toISOString() ?? null,
              }))
          : undefined;

      return {
        key: team.team_key,
        name: team.name,
        color: team.color,
        colorLight: team.color_light,
        score: team.score,
        correctStreak: team.correct_streak,
        connectedCount: connectedParticipants.length,
        captainParticipantId: team.captain_participant_id,
        participants: participants.map(toParticipantView),
        abilities,
      };
    });
}

function buildVisibleChat(room: RoomSnapshotSource, team: GameTeamKey): RoomChatMessageView[] {
  const nicknamesByParticipantId = new Map(room.participants.map((participant) => [participant.id, participant.nickname]));

  return room.chatMessages
    .filter((message) => message.team_key === team)
    .sort((left, right) => left.created_at.getTime() - right.created_at.getTime())
    .map((message) => ({
      id: message.id,
      participantId: message.participant_id,
      nickname: nicknamesByParticipantId.get(message.participant_id) ?? "لاعب",
      message: message.message,
      createdAt: message.created_at.toISOString(),
    }));
}

export function buildHostRoomSnapshot(room: RoomSnapshotSource): RoomSnapshot {
  return {
    id: room.id,
    roomCode: room.room_code,
    mode: room.mode,
    status: room.status,
    phase: room.phase,
    dailyDoubleEnabled: room.daily_double_enabled,
    currentTurnTeam: room.current_turn_team,
    currentRound: room.current_round,
    pendingSuggestedPickId: room.pending_suggested_pick_id,
    selectedPickId: room.selected_pick_id,
    boardCategories: room.board_categories,
    board: buildBoard(room),
    teams: buildTeams(room),
    visibleEvents: room.events
      .slice()
      .sort((left, right) => left.created_at.getTime() - right.created_at.getTime())
      .map((event) => ({
        id: event.id,
        team: event.team_key,
        type: event.event_type,
        message: event.message,
        createdAt: event.created_at.toISOString(),
      })),
  };
}

export function buildTeamRoomSnapshot(
  room: RoomSnapshotSource,
  participantId: string,
  team: GameTeamKey,
): TeamRoomSnapshot {
  const self = room.participants.find((participant) => participant.id === participantId);

  if (!self) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  return {
    ...buildHostRoomSnapshot({
      ...room,
      abilities: room.abilities.filter((ability) => ability.team_key === team),
      chatMessages: room.chatMessages.filter((message) => message.team_key === team),
    }),
    teams: buildTeams(room, team),
    self: toParticipantView(self),
    chat: buildVisibleChat(room, team),
  };
}
