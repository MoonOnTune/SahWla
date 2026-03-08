import type { GameAbilityType } from "@prisma/client";

export const ABILITY_POOL: GameAbilityType[] = [
  "STEAL",
  "DOUBLE_POINTS",
  "SHIELD",
  "BONUS_PICK",
  "POINT_THEFT",
];

export class AbilityRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbilityRuleError";
  }
}

export interface GrantedAbility {
  type: GameAbilityType;
  unlockedRound: number;
}

export interface AbilityAvailabilityInput {
  currentRound: number;
  unlockedRound: number;
  consumedAt: Date | string | null;
}

export interface PointTheftInput {
  amount: number;
  sourceScore: number;
  targetScore: number;
  targetShieldCount: number;
}

export interface PointTheftResult {
  blocked: boolean;
  sourceScore: number;
  targetScore: number;
  targetShieldCount: number;
}

export function pickRandomAbility(random = Math.random): GameAbilityType {
  return ABILITY_POOL[Math.floor(random() * ABILITY_POOL.length)] ?? ABILITY_POOL[0];
}

export function grantAbilityForCorrectStreak({
  streak,
  currentRound,
  randomAbility = () => pickRandomAbility(),
}: {
  streak: number;
  currentRound: number;
  randomAbility?: () => GameAbilityType;
}): GrantedAbility | null {
  if (streak < 3 || streak % 3 !== 0) {
    return null;
  }

  return {
    type: randomAbility(),
    unlockedRound: currentRound + 1,
  };
}

export function isAbilityAvailableThisRound({
  currentRound,
  unlockedRound,
  consumedAt,
}: AbilityAvailabilityInput): boolean {
  return currentRound >= unlockedRound && consumedAt === null;
}

export function assertAbilityUseAllowed({
  currentRound,
  lastUsedRound,
  unlockedRound,
  consumedAt,
}: {
  currentRound: number;
  lastUsedRound: number | null;
  unlockedRound: number;
  consumedAt: Date | string | null;
}): void {
  if (lastUsedRound === currentRound) {
    throw new AbilityRuleError("ABILITY_ALREADY_USED_THIS_ROUND");
  }

  if (!isAbilityAvailableThisRound({ currentRound, unlockedRound, consumedAt })) {
    throw new AbilityRuleError("ABILITY_NOT_AVAILABLE");
  }
}

export function applyPointTheft({
  amount,
  sourceScore,
  targetScore,
  targetShieldCount,
}: PointTheftInput): PointTheftResult {
  if (targetShieldCount > 0) {
    return {
      blocked: true,
      sourceScore,
      targetScore,
      targetShieldCount: targetShieldCount - 1,
    };
  }

  const stolenPoints = Math.min(amount, targetScore);

  return {
    blocked: false,
    sourceScore: sourceScore + stolenPoints,
    targetScore: targetScore - stolenPoints,
    targetShieldCount,
  };
}
