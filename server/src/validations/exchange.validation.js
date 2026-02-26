import { z } from "zod";

export const createExchangeSchema = z.object({
  taskId: z
    .string({ required_error: "Task ID is required" })
    .min(1, "Task ID is required"),
  receiverId: z
    .string({ required_error: "Receiver ID is required" })
    .min(1, "Receiver ID is required"),
  requestNote: z
    .string()
    .max(500, "Request note is too long (max 500 characters)")
    .optional(),
});

export const respondExchangeSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"], {
    errorMap: () => ({ message: "Status must be ACCEPTED or REJECTED" }),
  }),
  responseNote: z
    .string()
    .max(500, "Response note is too long (max 500 characters)")
    .optional(),
});

export const exchangeResponseNoteSchema = z.object({
  responseNote: z
    .string()
    .max(500, "Response note is too long (max 500 characters)")
    .optional(),
});
