import { z } from "zod";

export const createFilterSchema = z.object({
  name: z
    .string({ required_error: "Filter name is required" })
    .min(1, "Filter name cannot be empty")
    .max(100, "Filter name must be less than 100 characters"),
  criteria: z
    .object({}, { required_error: "Criteria is required" })
    .passthrough(),
  projectId: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

export const updateFilterSchema = z.object({
  name: z
    .string()
    .min(1, "Filter name cannot be empty")
    .max(100, "Filter name must be less than 100 characters")
    .optional(),
  criteria: z.object({}).passthrough().optional(),
  isPublic: z.boolean().optional(),
});
