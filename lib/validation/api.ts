import { z } from "zod";

export const gameModeSchema = z.enum(["CLASSIC", "SPECIAL"]);
export const gameTeamKeySchema = z.enum(["A", "B"]);
export const gameAbilityTypeSchema = z.enum([
  "STEAL",
  "DOUBLE_POINTS",
  "SHIELD",
  "BONUS_PICK",
  "POINT_THEFT",
]);

export const registerApiSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

export const createCheckoutSchema = z.object({
  productId: z.string().min(1).max(128).optional(),
  quantity: z.number().int().min(1).max(50).optional(),
  couponCode: z.string().trim().min(1).max(32).optional(),
});

export const gameStartSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const markPickUsedSchema = z.object({
  pickId: z.string().min(1).max(128),
});

export const createRoomSchema = z.object({
  gameSessionId: z.string().min(1).max(128),
  mode: gameModeSchema.default("SPECIAL"),
  dailyDoubleEnabled: z.boolean().default(true),
  teams: z
    .tuple([
      z.object({
        key: z.literal("A"),
        name: z.string().trim().min(1).max(80),
      }),
      z.object({
        key: z.literal("B"),
        name: z.string().trim().min(1).max(80),
      }),
    ])
    .optional(),
});

export const joinRoomSchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
  team: gameTeamKeySchema,
  nickname: z.string().trim().min(1).max(32),
});

export const reconnectRoomSchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
  team: gameTeamKeySchema.optional(),
});

export const suggestTileSchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
  categoryIndex: z.number().int().min(0),
  questionIndex: z.number().int().min(0),
  pickId: z.string().min(1).max(128).optional(),
});

export const confirmSuggestionSchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
});

export const sendRoomChatSchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
  message: z.string().trim().min(1).max(300),
});

export const useAbilitySchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
  abilityType: gameAbilityTypeSchema,
});

export const resolveQuestionSchema = z.object({
  roomCode: z.string().trim().min(4).max(16).regex(/^[A-Z0-9_-]+$/),
  winningTeam: gameTeamKeySchema.nullable(),
});
