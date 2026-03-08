import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

describe("room schema contract", () => {
  it("exposes special mode room models", () => {
    expect(Prisma.ModelName.GameSession).toBe("GameSession");
    expect(Prisma.ModelName.GameRoom).toBe("GameRoom");
    expect(Prisma.ModelName.GameRoomTeam).toBe("GameRoomTeam");
  });
});
