import type { GameAbilityType, GameParticipantRole, GameRoomPhase, GameTeamKey } from "@prisma/client";
import { grantAbilityForCorrectStreak } from "@/lib/game/ability-engine";

export class RoomRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomRuleError";
  }
}

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
