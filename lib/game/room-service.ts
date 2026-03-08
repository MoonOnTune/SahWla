import type { GameAbilityType, GameParticipantRole, GameRoomPhase, GameTeamKey, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AbilityRuleError,
  applyPointTheft,
  assertAbilityUseAllowed,
  grantAbilityForCorrectStreak,
} from "@/lib/game/ability-engine";
import { generateRoomCode } from "@/lib/game/room-code";
import { buildHostRoomSnapshot, buildTeamRoomSnapshot, type RoomSnapshotSource } from "@/lib/game/room-snapshot";
import type { RoomSnapshot, TeamRoomSnapshot } from "@/lib/game/room-types";

export class RoomRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomRuleError";
  }
}

const TEAM_STYLES = {
  A: { color: "#06b6d4", colorLight: "#22d3ee" },
  B: { color: "#d946ef", colorLight: "#e879f9" },
} satisfies Record<GameTeamKey, { color: string; colorLight: string }>;

const ROOM_RELATIONS = {
  teams: true,
  participants: true,
  abilities: true,
  chatMessages: true,
  events: {
    orderBy: { created_at: "asc" },
    take: 20,
  },
} satisfies Prisma.GameRoomInclude;

type LoadedRoom = Prisma.GameRoomGetPayload<{
  include: typeof ROOM_RELATIONS;
}>;

export function assignParticipantRole({
  existingCaptainId,
}: {
  existingCaptainId: string | null;
}): GameParticipantRole {
  return existingCaptainId ? "MEMBER" : "CAPTAIN";
}

export function assertSuggestionAllowed({
  roomPhase,
  pendingSuggestedPickId,
  selectedPickId,
  isPickUsed,
}: {
  roomPhase: GameRoomPhase;
  pendingSuggestedPickId: string | null;
  selectedPickId: string | null;
  isPickUsed: boolean;
}): void {
  if (roomPhase !== "BOARD") {
    throw new RoomRuleError("SUGGESTION_NOT_ALLOWED_IN_CURRENT_PHASE");
  }

  if (pendingSuggestedPickId) {
    throw new RoomRuleError("PENDING_SUGGESTION_ALREADY_EXISTS");
  }

  if (selectedPickId) {
    throw new RoomRuleError("QUESTION_ALREADY_IN_PROGRESS");
  }

  if (isPickUsed) {
    throw new RoomRuleError("PICK_ALREADY_USED");
  }
}

export function applyAnswerOutcome({
  currentRound,
  currentTurnTeam,
  winningTeam,
  teamAStreak,
  teamBStreak,
  randomAbility,
}: {
  currentRound: number;
  currentTurnTeam: GameTeamKey;
  winningTeam: GameTeamKey | null;
  teamAStreak: number;
  teamBStreak: number;
  randomAbility?: () => GameAbilityType;
}): {
  nextTurnTeam: GameTeamKey;
  teamAStreak: number;
  teamBStreak: number;
  grantedAbility: { type: GameAbilityType; unlockedRound: number } | null;
} {
  if (winningTeam === "A") {
    const nextStreak = teamAStreak + 1;
    return {
      nextTurnTeam: "A",
      teamAStreak: nextStreak,
      teamBStreak: 0,
      grantedAbility: grantAbilityForCorrectStreak({
        streak: nextStreak,
        currentRound,
        randomAbility,
      }),
    };
  }

  if (winningTeam === "B") {
    const nextStreak = teamBStreak + 1;
    return {
      nextTurnTeam: "B",
      teamAStreak: 0,
      teamBStreak: nextStreak,
      grantedAbility: grantAbilityForCorrectStreak({
        streak: nextStreak,
        currentRound,
        randomAbility,
      }),
    };
  }

  return {
    nextTurnTeam: currentTurnTeam === "A" ? "B" : "A",
    teamAStreak: currentTurnTeam === "A" ? 0 : teamAStreak,
    teamBStreak: currentTurnTeam === "B" ? 0 : teamBStreak,
    grantedAbility: null,
  };
}

export function assertAbilityTimingAllowed({
  abilityType,
  roomPhase,
  currentTurnTeam,
  actingTeam,
}: {
  abilityType: GameAbilityType;
  roomPhase: GameRoomPhase;
  currentTurnTeam: GameTeamKey;
  actingTeam: GameTeamKey;
}): void {
  if (abilityType === "STEAL") {
    if (roomPhase !== "QUESTION" && roomPhase !== "ANSWER") {
      throw new RoomRuleError("ABILITY_NOT_ALLOWED_IN_CURRENT_PHASE");
    }

    if (actingTeam === currentTurnTeam) {
      throw new RoomRuleError("NOT_YOUR_TURN");
    }

    return;
  }

  if (actingTeam !== currentTurnTeam) {
    throw new RoomRuleError("NOT_YOUR_TURN");
  }

  if (abilityType === "POINT_THEFT" || abilityType === "SHIELD") {
    if (roomPhase !== "BOARD") {
      throw new RoomRuleError("ABILITY_NOT_ALLOWED_IN_CURRENT_PHASE");
    }

    return;
  }

  if (roomPhase !== "BOARD" && roomPhase !== "QUESTION" && roomPhase !== "ANSWER") {
    throw new RoomRuleError("ABILITY_NOT_ALLOWED_IN_CURRENT_PHASE");
  }
}

async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = generateRoomCode();
    const existing = await prisma.gameRoom.findUnique({
      where: { room_code: roomCode },
      select: { id: true },
    });

    if (!existing) {
      return roomCode;
    }
  }

  throw new RoomRuleError("ROOM_CODE_GENERATION_FAILED");
}

async function loadRoomSourceByCode(roomCode: string): Promise<RoomSnapshotSource | null> {
  const room = await prisma.gameRoom.findUnique({
    where: { room_code: roomCode },
    include: ROOM_RELATIONS,
  });

  if (!room) {
    return null;
  }

  const picks = await prisma.gameQuestionPick.findMany({
    where: {
      game_session_id: room.game_session_id,
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

  return {
    ...room,
    mode: room.mode,
    status: room.status,
    phase: room.phase,
    picks,
  };
}

function getPickIdFromBoard(room: RoomSnapshotSource, categoryIndex: number, questionIndex: number, pickId?: string): string {
  if (pickId) {
    return pickId;
  }

  const categoryName = room.board_categories[categoryIndex];

  if (!categoryName) {
    throw new RoomRuleError("PICK_NOT_ON_BOARD");
  }

  const categoryPicks = room.picks
    .filter((pick) => pick.category_name === categoryName)
    .sort((left, right) => left.slot_index - right.slot_index);
  const pick = categoryPicks[questionIndex];

  if (!pick) {
    throw new RoomRuleError("PICK_NOT_ON_BOARD");
  }

  return pick.id;
}

function getTeamRoundField(team: GameTeamKey): "ability_used_by_a_round" | "ability_used_by_b_round" {
  return team === "A" ? "ability_used_by_a_round" : "ability_used_by_b_round";
}

function getOpponentTeam(team: GameTeamKey): GameTeamKey {
  return team === "A" ? "B" : "A";
}

async function getLoadedRoomByCode(roomCode: string): Promise<LoadedRoom> {
  const room = await prisma.gameRoom.findUnique({
    where: { room_code: roomCode },
    include: ROOM_RELATIONS,
  });

  if (!room) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return room;
}

async function getParticipantByDeviceToken(roomId: string, deviceToken: string) {
  return prisma.gameRoomParticipant.findUnique({
    where: {
      room_id_device_token: {
        room_id: roomId,
        device_token: deviceToken,
      },
    },
  });
}

export async function createSpecialModeRoom({
  ownerUserId,
  gameSessionId,
  categoryNames,
  dailyDoubleEnabled,
  teams,
}: {
  ownerUserId: string;
  gameSessionId: string;
  categoryNames: string[];
  dailyDoubleEnabled: boolean;
  teams?: Array<{ key: GameTeamKey; name: string }>;
}): Promise<RoomSnapshot> {
  if (categoryNames.length !== 6) {
    throw new RoomRuleError("BOARD_REQUIRES_SIX_CATEGORIES");
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: gameSessionId },
    select: {
      id: true,
      user_id: true,
      status: true,
      room: { select: { room_code: true } },
    },
  });

  if (!session || session.user_id !== ownerUserId || session.status !== "ACTIVE") {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  if (session.room?.room_code) {
    const existing = await loadRoomSourceByCode(session.room.room_code);
    if (!existing) {
      throw new RoomRuleError("ROOM_NOT_FOUND");
    }
    return buildHostRoomSnapshot(existing);
  }

  const roomCode = await generateUniqueRoomCode();
  const room = await prisma.gameRoom.create({
    data: {
      game_session_id: gameSessionId,
      mode: "SPECIAL",
      room_code: roomCode,
      status: "ACTIVE",
      phase: "QR",
      daily_double_enabled: dailyDoubleEnabled,
      board_categories: categoryNames,
      teams: {
        create: (teams ?? [
          { key: "A", name: "الفريق أ" },
          { key: "B", name: "الفريق ب" },
        ]).map((team) => ({
          team_key: team.key,
          name: team.name,
          color: TEAM_STYLES[team.key].color,
          color_light: TEAM_STYLES[team.key].colorLight,
        })),
      },
    },
    include: ROOM_RELATIONS,
  });

  const created = await loadRoomSourceByCode(room.room_code);

  if (!created) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildHostRoomSnapshot(created);
}

export async function joinRoom({
  roomCode,
  team,
  nickname,
  deviceToken,
}: {
  roomCode: string;
  team: GameTeamKey;
  nickname: string;
  deviceToken: string;
}): Promise<TeamRoomSnapshot> {
  const room = await getLoadedRoomByCode(roomCode);
  const existingParticipant = await getParticipantByDeviceToken(room.id, deviceToken);
  const existingTeam = room.teams.find((entry) => entry.team_key === (existingParticipant?.team_key ?? team));

  if (!existingTeam) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  let participantId = existingParticipant?.id ?? null;

  await prisma.$transaction(async (tx) => {
    if (existingParticipant) {
      await tx.gameRoomParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          nickname,
          last_seen_at: new Date(),
          disconnected_at: null,
        },
      });
      return;
    }

    const role = assignParticipantRole({ existingCaptainId: existingTeam.captain_participant_id });
    const createdParticipant = await tx.gameRoomParticipant.create({
      data: {
        room_id: room.id,
        team_key: team,
        nickname,
        role,
        device_token: deviceToken,
      },
      select: { id: true },
    });
    participantId = createdParticipant.id;

    if (role === "CAPTAIN") {
      await tx.gameRoomTeam.update({
        where: {
          room_id_team_key: {
            room_id: room.id,
            team_key: team,
          },
        },
        data: {
          captain_participant_id: createdParticipant.id,
        },
      });
    }
  });

  if (!participantId) {
    participantId = existingParticipant?.id ?? null;
  }

  if (!participantId) {
    throw new RoomRuleError("PARTICIPANT_NOT_FOUND");
  }

  const snapshotSource = await loadRoomSourceByCode(roomCode);
  if (!snapshotSource) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildTeamRoomSnapshot(snapshotSource, participantId, existingParticipant?.team_key ?? team);
}

export async function reconnectToRoom({
  roomCode,
  deviceToken,
}: {
  roomCode: string;
  deviceToken: string;
}): Promise<TeamRoomSnapshot> {
  const room = await getLoadedRoomByCode(roomCode);
  const participant = await getParticipantByDeviceToken(room.id, deviceToken);

  if (!participant) {
    throw new RoomRuleError("PARTICIPANT_NOT_FOUND");
  }

  await prisma.gameRoomParticipant.update({
    where: { id: participant.id },
    data: {
      last_seen_at: new Date(),
      disconnected_at: null,
    },
  });

  const snapshotSource = await loadRoomSourceByCode(roomCode);
  if (!snapshotSource) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildTeamRoomSnapshot(snapshotSource, participant.id, participant.team_key);
}

export async function suggestRoomTile({
  roomCode,
  deviceToken,
  categoryIndex,
  questionIndex,
  pickId,
}: {
  roomCode: string;
  deviceToken: string;
  categoryIndex: number;
  questionIndex: number;
  pickId?: string;
}): Promise<RoomSnapshot> {
  const room = await getLoadedRoomByCode(roomCode);
  const participant = await getParticipantByDeviceToken(room.id, deviceToken);

  if (!participant) {
    throw new RoomRuleError("PARTICIPANT_NOT_FOUND");
  }

  if (participant.role !== "CAPTAIN") {
    throw new RoomRuleError("CAPTAIN_ONLY_ACTION");
  }

  if (participant.team_key !== room.current_turn_team) {
    throw new RoomRuleError("NOT_YOUR_TURN");
  }

  const snapshotSource = await loadRoomSourceByCode(roomCode);
  if (!snapshotSource) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  const resolvedPickId = getPickIdFromBoard(snapshotSource, categoryIndex, questionIndex, pickId);
  const boardPick = snapshotSource.picks.find((entry) => entry.id === resolvedPickId);

  assertSuggestionAllowed({
    roomPhase: room.phase,
    pendingSuggestedPickId: room.pending_suggested_pick_id,
    selectedPickId: room.selected_pick_id,
    isPickUsed: Boolean(boardPick?.used_at),
  });

  await prisma.$transaction(async (tx) => {
    await tx.gameRoom.update({
      where: { id: room.id },
      data: {
        pending_suggested_pick_id: resolvedPickId,
      },
    });

    await tx.gameRoomEvent.create({
      data: {
        room_id: room.id,
        team_key: participant.team_key,
        event_type: "PENDING_SUGGESTION",
        message: `${participant.nickname} اقترح سؤالاً جديداً`,
      },
    });
  });

  const updated = await loadRoomSourceByCode(roomCode);
  if (!updated) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildHostRoomSnapshot(updated);
}

export async function confirmRoomSuggestion({
  roomCode,
  ownerUserId,
}: {
  roomCode: string;
  ownerUserId: string;
}): Promise<RoomSnapshot> {
  const room = await prisma.gameRoom.findUnique({
    where: { room_code: roomCode },
    include: {
      gameSession: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!room || room.gameSession.user_id !== ownerUserId) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  if (!room.pending_suggested_pick_id) {
    throw new RoomRuleError("NO_PENDING_SUGGESTION");
  }

  await prisma.$transaction(async (tx) => {
    await tx.gameRoom.update({
      where: { id: room.id },
      data: {
        selected_pick_id: room.pending_suggested_pick_id,
        pending_suggested_pick_id: null,
        phase: "QUESTION",
      },
    });

    await tx.gameRoomEvent.create({
      data: {
        room_id: room.id,
        event_type: "SUGGESTION_CONFIRMED",
        message: "تم تأكيد السؤال من المضيف",
      },
    });
  });

  const updated = await loadRoomSourceByCode(roomCode);
  if (!updated) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildHostRoomSnapshot(updated);
}

export async function sendRoomChatMessage({
  roomCode,
  deviceToken,
  message,
}: {
  roomCode: string;
  deviceToken: string;
  message: string;
}): Promise<TeamRoomSnapshot> {
  const room = await getLoadedRoomByCode(roomCode);
  const participant = await getParticipantByDeviceToken(room.id, deviceToken);

  if (!participant) {
    throw new RoomRuleError("PARTICIPANT_NOT_FOUND");
  }

  await prisma.gameRoomChatMessage.create({
    data: {
      room_id: room.id,
      team_key: participant.team_key,
      participant_id: participant.id,
      message,
    },
  });

  const updated = await loadRoomSourceByCode(roomCode);
  if (!updated) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildTeamRoomSnapshot(updated, participant.id, participant.team_key);
}

export async function useRoomAbility({
  roomCode,
  deviceToken,
  abilityType,
}: {
  roomCode: string;
  deviceToken: string;
  abilityType: GameAbilityType;
}): Promise<TeamRoomSnapshot> {
  const room = await getLoadedRoomByCode(roomCode);
  const participant = await getParticipantByDeviceToken(room.id, deviceToken);

  if (!participant) {
    throw new RoomRuleError("PARTICIPANT_NOT_FOUND");
  }

  if (participant.role !== "CAPTAIN") {
    throw new RoomRuleError("CAPTAIN_ONLY_ACTION");
  }

  const team = room.teams.find((entry) => entry.team_key === participant.team_key);
  const opponentTeam = room.teams.find((entry) => entry.team_key === getOpponentTeam(participant.team_key));
  const ability = room.abilities.find(
    (entry) =>
      entry.team_key === participant.team_key &&
      entry.ability_type === abilityType &&
      entry.consumed_at === null,
  );

  if (!team || !opponentTeam || !ability) {
    throw new RoomRuleError("ABILITY_NOT_FOUND");
  }

  assertAbilityTimingAllowed({
    abilityType,
    roomPhase: room.phase,
    currentTurnTeam: room.current_turn_team,
    actingTeam: participant.team_key,
  });

  const roundField = getTeamRoundField(participant.team_key);

  try {
    assertAbilityUseAllowed({
      currentRound: room.current_round,
      lastUsedRound: room[roundField],
      unlockedRound: ability.unlocked_round,
      consumedAt: ability.consumed_at,
    });
  } catch (error) {
    if (error instanceof AbilityRuleError) {
      throw new RoomRuleError(error.message);
    }
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.gameRoomAbility.update({
      where: { id: ability.id },
      data: {
        consumed_at: new Date(),
      },
    });

    await tx.gameRoom.update({
      where: { id: room.id },
      data: {
        [roundField]: room.current_round,
      },
    });

    if (abilityType === "SHIELD") {
      await tx.gameRoomTeam.update({
        where: {
          room_id_team_key: {
            room_id: room.id,
            team_key: participant.team_key,
          },
        },
        data: {
          shield_count: { increment: 1 },
        },
      });
      return;
    }

    if (abilityType === "DOUBLE_POINTS") {
      await tx.gameRoomTeam.update({
        where: {
          room_id_team_key: {
            room_id: room.id,
            team_key: participant.team_key,
          },
        },
        data: {
          pending_double_points: true,
        },
      });
      return;
    }

    if (abilityType === "BONUS_PICK") {
      await tx.gameRoomTeam.update({
        where: {
          room_id_team_key: {
            room_id: room.id,
            team_key: participant.team_key,
          },
        },
        data: {
          pending_bonus_pick: true,
        },
      });
      return;
    }

    if (abilityType === "STEAL") {
      await tx.gameRoomTeam.update({
        where: {
          room_id_team_key: {
            room_id: room.id,
            team_key: participant.team_key,
          },
        },
        data: {
          pending_steal: true,
        },
      });
      return;
    }

    const pointTheft = applyPointTheft({
      amount: 200,
      sourceScore: team.score,
      targetScore: opponentTeam.score,
      targetShieldCount: opponentTeam.shield_count,
    });

    await tx.gameRoomTeam.update({
      where: {
        room_id_team_key: {
          room_id: room.id,
          team_key: participant.team_key,
        },
      },
      data: {
        score: pointTheft.sourceScore,
      },
    });

    await tx.gameRoomTeam.update({
      where: {
        room_id_team_key: {
          room_id: room.id,
          team_key: opponentTeam.team_key,
        },
      },
      data: {
        score: pointTheft.targetScore,
        shield_count: pointTheft.targetShieldCount,
      },
    });

    await tx.gameRoomEvent.create({
      data: {
        room_id: room.id,
        team_key: participant.team_key,
        event_type: pointTheft.blocked ? "POINT_THEFT_BLOCKED" : "POINT_THEFT",
        message: pointTheft.blocked ? "تم صد سرقة النقاط بالدرع" : "تم تفعيل سرقة النقاط",
      },
    });
  });

  const updated = await loadRoomSourceByCode(roomCode);
  if (!updated) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildTeamRoomSnapshot(updated, participant.id, participant.team_key);
}

export async function resolveRoomQuestion({
  roomCode,
  ownerUserId,
  winningTeam,
}: {
  roomCode: string;
  ownerUserId: string;
  winningTeam: GameTeamKey | null;
}): Promise<RoomSnapshot> {
  const room = await prisma.gameRoom.findUnique({
    where: { room_code: roomCode },
    include: {
      gameSession: {
        select: {
          user_id: true,
        },
      },
      teams: true,
      selectedPick: {
        select: {
          id: true,
          value: true,
        },
      },
    },
  });

  if (!room || room.gameSession.user_id !== ownerUserId) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  if (!room.selected_pick_id || !room.selectedPick) {
    throw new RoomRuleError("QUESTION_NOT_IN_PROGRESS");
  }

  const teamA = room.teams.find((entry) => entry.team_key === "A");
  const teamB = room.teams.find((entry) => entry.team_key === "B");

  if (!teamA || !teamB) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  let resolvedWinner = winningTeam;
  let visibleEvent: { type: string; message: string; team: GameTeamKey | null } | null = null;

  if (!resolvedWinner) {
    const stealingTeam = room.current_turn_team === "A" ? teamB : teamA;
    const defendingTeam = room.current_turn_team === "A" ? teamA : teamB;

    if (stealingTeam.pending_steal) {
      if (defendingTeam.shield_count > 0) {
        await prisma.gameRoomTeam.update({
          where: {
            room_id_team_key: {
              room_id: room.id,
              team_key: defendingTeam.team_key,
            },
          },
          data: {
            shield_count: { decrement: 1 },
          },
        });
        visibleEvent = {
          type: "STEAL_BLOCKED",
          message: "تم صد محاولة السرقة بالدرع",
          team: defendingTeam.team_key,
        };
      } else {
        resolvedWinner = stealingTeam.team_key;
        visibleEvent = {
          type: "STEAL_SUCCESS",
          message: "تم تفعيل السرقة بنجاح",
          team: stealingTeam.team_key,
        };
      }
    }
  }

  const outcome = applyAnswerOutcome({
    currentRound: room.current_round,
    currentTurnTeam: room.current_turn_team,
    winningTeam: resolvedWinner,
    teamAStreak: teamA.correct_streak,
    teamBStreak: teamB.correct_streak,
  });

  const winningTeamRecord =
    resolvedWinner === "A" ? teamA : resolvedWinner === "B" ? teamB : null;
  const pointsAwarded =
    resolvedWinner && winningTeamRecord
      ? room.selectedPick.value * (winningTeamRecord.pending_double_points ? 2 : 1)
      : 0;
  const nextTurnTeam =
    resolvedWinner && winningTeamRecord?.pending_bonus_pick ? resolvedWinner : outcome.nextTurnTeam;

  await prisma.$transaction(async (tx) => {
    await tx.gameQuestionPick.update({
      where: { id: room.selected_pick_id! },
      data: {
        used_at: new Date(),
      },
    });

    await tx.gameRoomTeam.update({
      where: {
        room_id_team_key: {
          room_id: room.id,
          team_key: "A",
        },
      },
      data: {
        score: teamA.score + (resolvedWinner === "A" ? pointsAwarded : 0),
        correct_streak: outcome.teamAStreak,
        pending_double_points: false,
        pending_bonus_pick: false,
        pending_steal: false,
      },
    });

    await tx.gameRoomTeam.update({
      where: {
        room_id_team_key: {
          room_id: room.id,
          team_key: "B",
        },
      },
      data: {
        score: teamB.score + (resolvedWinner === "B" ? pointsAwarded : 0),
        correct_streak: outcome.teamBStreak,
        pending_double_points: false,
        pending_bonus_pick: false,
        pending_steal: false,
      },
    });

    await tx.gameRoom.update({
      where: { id: room.id },
      data: {
        phase: "BOARD",
        selected_pick_id: null,
        current_turn_team: nextTurnTeam,
        current_round: { increment: 1 },
      },
    });

    if (outcome.grantedAbility && resolvedWinner) {
      await tx.gameRoomAbility.create({
        data: {
          room_id: room.id,
          team_key: resolvedWinner,
          ability_type: outcome.grantedAbility.type,
          unlocked_round: outcome.grantedAbility.unlockedRound,
        },
      });
    }

    if (visibleEvent) {
      await tx.gameRoomEvent.create({
        data: {
          room_id: room.id,
          team_key: visibleEvent.team,
          event_type: visibleEvent.type,
          message: visibleEvent.message,
        },
      });
    }
  });

  const remainingUnusedCount = await prisma.gameQuestionPick.count({
    where: {
      game_session_id: room.game_session_id,
      category_name: {
        in: (await prisma.gameRoom.findUnique({
          where: { id: room.id },
          select: { board_categories: true },
        }))?.board_categories ?? [],
      },
      used_at: null,
    },
  });

  if (remainingUnusedCount === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.gameRoomChatMessage.deleteMany({
        where: { room_id: room.id },
      });
      await tx.gameRoom.update({
        where: { id: room.id },
        data: {
          phase: "WINNER",
          status: "COMPLETED",
          ended_at: new Date(),
        },
      });
    });
  }

  const updated = await loadRoomSourceByCode(roomCode);
  if (!updated) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildHostRoomSnapshot(updated);
}

export async function getHostRoomSnapshot({
  roomCode,
  ownerUserId,
}: {
  roomCode: string;
  ownerUserId: string;
}): Promise<RoomSnapshot> {
  const room = await prisma.gameRoom.findUnique({
    where: { room_code: roomCode },
    include: {
      gameSession: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!room || room.gameSession.user_id !== ownerUserId) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  const snapshot = await loadRoomSourceByCode(roomCode);
  if (!snapshot) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildHostRoomSnapshot(snapshot);
}

export async function getTeamRoomSnapshot({
  roomCode,
  deviceToken,
}: {
  roomCode: string;
  deviceToken: string;
}): Promise<TeamRoomSnapshot> {
  const room = await getLoadedRoomByCode(roomCode);
  const participant = await getParticipantByDeviceToken(room.id, deviceToken);

  if (!participant) {
    throw new RoomRuleError("PARTICIPANT_NOT_FOUND");
  }

  const snapshot = await loadRoomSourceByCode(roomCode);
  if (!snapshot) {
    throw new RoomRuleError("ROOM_NOT_FOUND");
  }

  return buildTeamRoomSnapshot(snapshot, participant.id, participant.team_key);
}
