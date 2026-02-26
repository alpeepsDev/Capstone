import { z } from "zod";

const taskStatusEnum = z.enum(
  ["PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"],
  { errorMap: () => ({ message: "Invalid task status" }) },
);

const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
  errorMap: () => ({
    message: "Invalid priority. Use: LOW, MEDIUM, HIGH, or URGENT",
  }),
});

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters"),
  projectId: z
    .string({ required_error: "Project ID is required" })
    .min(1, "Project ID is required"),
  description: z.string().max(5000, "Description is too long").optional(),
  assigneeId: z.string().optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(5000, "Description is too long")
    .nullable()
    .optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  changeNote: z.string().max(500, "Change note is too long").optional(),
  timeRemaining: z.number().int().min(0).optional(),
  timeSpent: z.number().int().min(0).optional(),
  storyPoints: z.number().int().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  taskType: z.enum(["TASK", "STORY", "BUG", "EPIC", "SUBTASK"]).optional(),
  parentTaskId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
});

export const moveTaskSchema = z.object({
  status: taskStatusEnum,
  position: z.number().int().min(0).nullable().optional(),
});

export const assignTaskSchema = z.object({
  assigneeId: z
    .string({ required_error: "Assignee ID is required" })
    .min(1, "Assignee ID is required"),
});

export const addCommentSchema = z.object({
  content: z
    .string({ required_error: "Comment content is required" })
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long (max 2000 characters)"),
});

export const taskIdParamSchema = z.object({
  id: z.string().min(1, "Task ID is required"),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});
