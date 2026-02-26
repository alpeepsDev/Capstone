import { z } from "zod";

export const updatePreferencesSchema = z.object({
  enableProactiveNotifs: z.boolean().optional(),
  enableAutoAssignment: z.boolean().optional(),
  enableAutoEscalation: z.boolean().optional(),
  deadlineWarningDays: z
    .array(z.number().int().min(1, "Warning days must be at least 1"))
    .optional(),
  preferredInsightTypes: z.array(z.string().min(1)).optional(),
  weeklyReportDay: z
    .number()
    .int()
    .min(0)
    .max(6, "Day must be 0-6 (Sun-Sat)")
    .nullable()
    .optional(),
  weeklyReportTime: z.string().nullable().optional(),
  notificationQuietHours: z.object({}).passthrough().nullable().optional(),
});
