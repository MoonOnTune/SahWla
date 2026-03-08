import { describe, expect, it } from "vitest";
import { RoomRuleError, applyAnswerOutcome, assignParticipantRole, assertSuggestionAllowed } from "@/lib/game/room-service";

describe("room service", () => {
  it("assigns the first player on a team as captain", () => {
    expect(assignParticipantRole({ existingCaptainId: null })).toBe("CAPTAIN");
    expect(assignParticipantRole({ existingCaptainId: "captain-1" })).toBe("MEMBER");
  });

  it("blocks suggestions while another suggestion is pending", () => {
    expect(() =>
      assertSuggestionAllowed({
        roomPhase: "BOARD",
        pendingSuggestedPickId: "pick-1",
        selectedPickId: null,
        isPickUsed: false,
      }),
    ).toThrow(RoomRuleError);
  });

  it("updates streaks and grants an ability after three straight correct answers", () => {
    const result = applyAnswerOutcome({
      currentRound: 6,
      currentTurnTeam: "A",
      winningTeam: "A",
      teamAStreak: 2,
      teamBStreak: 1,
      randomAbility: () => "SHIELD",
    });

    expect(result).toEqual({
      nextTurnTeam: "A",
      teamAStreak: 3,
      teamBStreak: 0,
      grantedAbility: {
        type: "SHIELD",
        unlockedRound: 7,
      },
    });
  });
});
