import { z } from "zod";

export const createWorklogSchema = z.object({
  taskId: z
    .string({ required_error: "Task ID is required" })
    .min(1, "Task ID is required"),
  timeSpent: z
    .number({
      required_error: "Time spent is required",
      invalid_type_error: "Time spent must be a number",
    })
    .int("Time spent must be a whole number")
    .min(1, "Time spent must be at least 1 minute"),
  date: z.string().optional(),
  description: z
    .string()
    .max(500, "Description is too long (max 500 characters)")
    .optional(),
  timeRemaining: z
    .number()
    .int()
    .min(0, "Time remaining cannot be negative")
    .optional(),
});

export const updateWorklogSchema = z.object({
  timeSpent: z
    .number({
      required_error: "Time spent is required",
      invalid_type_error: "Time spent must be a number",
    })
    .int("Time spent must be a whole number")
    .min(1, "Time spent must be at least 1 minute"),
  date: z.string().optional(),
  description: z
    .string()
    .max(500, "Description is too long (max 500 characters)")
    .optional(),
  timeRemaining: z
    .number()
    .int()
    .min(0, "Time remaining cannot be negative")
    .optional(),
});
