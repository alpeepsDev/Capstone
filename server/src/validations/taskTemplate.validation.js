import { z } from "zod";

const taskTypeEnum = z.enum(["TASK", "STORY", "BUG", "EPIC", "SUBTASK"], {
  errorMap: () => ({
    message: "Invalid task type. Use: TASK, STORY, BUG, EPIC, or SUBTASK",
  }),
});

const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
  errorMap: () => ({
    message: "Invalid priority. Use: LOW, MEDIUM, HIGH, or URGENT",
  }),
});

export const createTemplateSchema = z.object({
  name: z
    .string({ required_error: "Template name is required" })
    .min(1, "Template name cannot be empty")
    .max(100, "Template name must be less than 100 characters"),
  taskType: taskTypeEnum,
  description: z.string().max(500, "Description is too long").optional(),
  projectId: z.string().optional(),
  priority: taskPriorityEnum.optional(),
  template: z.object({}).passthrough().optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100, "Template name must be less than 100 characters")
    .optional(),
  description: z.string().max(500, "Description is too long").optional(),
  taskType: taskTypeEnum.optional(),
  priority: taskPriorityEnum.optional(),
  template: z.object({}).passthrough().optional(),
});

export const createFromTemplateSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title is too long")
    .optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  description: z.string().optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.string().optional(),
});
