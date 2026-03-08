import { describe, expect, it } from "vitest";
import {
  AbilityRuleError,
  applyPointTheft,
  assertAbilityUseAllowed,
  grantAbilityForCorrectStreak,
  isAbilityAvailableThisRound,
} from "@/lib/game/ability-engine";

describe("ability engine", () => {
  it("grants one hidden ability every three consecutive correct answers", () => {
    const granted = grantAbilityForCorrectStreak({
      streak: 3,
      currentRound: 4,
      randomAbility: () => "BONUS_PICK",
    });

    expect(granted).toEqual({
      type: "BONUS_PICK",
      unlockedRound: 5,
    });
  });

  it("consumes shield before point theft takes effect", () => {
    const result = applyPointTheft({
      amount: 200,
      targetShieldCount: 1,
      sourceScore: 800,
      targetScore: 600,
    });

    expect(result).toEqual({
      blocked: true,
      sourceScore: 800,
      targetScore: 600,
      targetShieldCount: 0,
    });
  });

  it("rejects use before the ability unlock round", () => {
    expect(
      isAbilityAvailableThisRound({
        currentRound: 2,
        unlockedRound: 3,
        consumedAt: null,
      }),
    ).toBe(false);
  });

  it("rejects a second ability in the same round", () => {
    expect(assertAbilityUseAllowed).toBeTypeOf("function");
    expect(() =>
      assertAbilityUseAllowed({
        currentRound: 4,
        lastUsedRound: 4,
        unlockedRound: 2,
        consumedAt: null,
      }),
    ).toThrow(AbilityRuleError);
  });
});
