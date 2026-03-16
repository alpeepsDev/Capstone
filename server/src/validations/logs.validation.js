import { z } from "zod";

export const clientLogSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z
    .string({ required_error: "Message is required" })
    .min(1, "Message is required")
    .max(2000, "Message is too long"),
  context: z.unknown().optional(),
  url: z.string().max(2048).optional(),
  ts: z.union([z.number().int().nonnegative(), z.string()]).optional(),
});

