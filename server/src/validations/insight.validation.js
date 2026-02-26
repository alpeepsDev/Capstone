import { z } from "zod";

export const insightQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .optional(),
});

export const insightHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional(),
});
