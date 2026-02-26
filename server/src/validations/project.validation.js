import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Project name is required" })
    .min(1, "Project name cannot be empty")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  memberIds: z.array(z.string()).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name cannot be empty")
    .max(100, "Project name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const projectIdParamSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

export const addMemberSchema = z.object({
  userId: z
    .string({ required_error: "User ID is required" })
    .min(1, "User ID is required"),
});
