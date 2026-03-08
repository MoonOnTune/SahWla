import { describe, expect, it } from "vitest";
import { joinRoomSchema, suggestTileSchema } from "@/lib/validation/api";

describe("special mode validation", () => {
  it("requires room, team, and nickname on join", () => {
    expect(joinRoomSchema).toBeDefined();
    expect(joinRoomSchema.safeParse({ roomCode: "", team: "A", nickname: "" }).success).toBe(false);
  });

  it("requires category and tile coordinates for suggestions", () => {
    expect(suggestTileSchema).toBeDefined();
    expect(suggestTileSchema.safeParse({ roomCode: "ROOM1" }).success).toBe(false);
  });
});
