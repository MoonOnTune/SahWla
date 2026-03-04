import { z } from "zod";

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
