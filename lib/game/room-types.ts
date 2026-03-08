import type { GameAbilityType, GameMode, GameParticipantRole, GameRoomPhase, GameRoomStatus, GameTeamKey } from "@prisma/client";

export type RealtimeAudience = "host" | "team";

export interface RoomAbilityView {
  id: string;
  type: GameAbilityType;
  unlockedRound: number;
  consumedAt: string | null;
}

export interface RoomParticipantView {
  id: string;
  nickname: string;
  role: GameParticipantRole;
  team: GameTeamKey;
  connectedAt: string;
  lastSeenAt: string;
}

export interface RoomTeamView {
  key: GameTeamKey;
  name: string;
  color: string;
  colorLight: string;
  score: number;
  correctStreak: number;
  connectedCount: number;
  captainParticipantId: string | null;
  participants: RoomParticipantView[];
  abilities?: RoomAbilityView[];
}

export interface RoomChatMessageView {
  id: string;
  participantId: string;
  nickname: string;
  message: string;
  createdAt: string;
}

export interface RoomEventView {
  id: string;
  team: GameTeamKey | null;
  type: string;
  message: string;
  createdAt: string;
}

export interface RoomSnapshot {
  id: string;
  roomCode: string;
  mode: GameMode;
  status: GameRoomStatus;
  phase: GameRoomPhase;
  dailyDoubleEnabled: boolean;
  currentTurnTeam: GameTeamKey;
  currentRound: number;
  pendingSuggestedPickId: string | null;
  selectedPickId: string | null;
  teams: RoomTeamView[];
  visibleEvents: RoomEventView[];
}

export interface TeamRoomSnapshot extends RoomSnapshot {
  self: RoomParticipantView;
  chat: RoomChatMessageView[];
}
