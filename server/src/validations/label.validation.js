import { z } from "zod";

export const createLabelSchema = z.object({
  name: z
    .string({ required_error: "Label name is required" })
    .min(1, "Label name cannot be empty")
    .max(50, "Label name must be less than 50 characters"),
  color: z
    .string({ required_error: "Color is required" })
    .min(1, "Color cannot be empty")
    .max(20, "Color must be less than 20 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  projectId: z.string().optional(),
  isGlobal: z.boolean().optional().default(false),
});

export const updateLabelSchema = z.object({
  name: z
    .string()
    .min(1, "Label name cannot be empty")
    .max(50, "Label name must be less than 50 characters")
    .optional(),
  color: z
    .string()
    .min(1, "Color cannot be empty")
    .max(20, "Color must be less than 20 characters")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
});

export const addLabelToTaskSchema = z.object({
  labelId: z
    .string({ required_error: "Label ID is required" })
    .min(1, "Label ID is required"),
});
