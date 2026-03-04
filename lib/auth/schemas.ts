import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include one uppercase letter")
    .regex(/[a-z]/, "Password must include one lowercase letter")
    .regex(/[0-9]/, "Password must include one number"),
});

export const credentialsLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});
