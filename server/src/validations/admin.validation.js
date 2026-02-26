import { z } from "zod";

export const updateRateLimitSchema = z.object({
  limit: z
    .number({
      required_error: "Limit is required",
      invalid_type_error: "Limit must be a number",
    })
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1"),
});

export const createEndpointRateLimitSchema = z.object({
  endpoint: z
    .string({ required_error: "Endpoint is required" })
    .min(1, "Endpoint cannot be empty"),
  method: z
    .string({ required_error: "Method is required" })
    .min(1, "Method cannot be empty"),
  limit: z
    .number({
      required_error: "Limit is required",
      invalid_type_error: "Limit must be a number",
    })
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1"),
  window: z
    .number()
    .int()
    .min(1, "Window must be at least 1 second")
    .optional(),
});

export const updateEndpointRateLimitSchema = z.object({
  limit: z.number().int().min(1, "Limit must be at least 1").optional(),
  window: z
    .number()
    .int()
    .min(1, "Window must be at least 1 second")
    .optional(),
  enabled: z.boolean().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: "isActive is required",
    invalid_type_error: "isActive must be a boolean",
  }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "USER"], {
    errorMap: () => ({ message: "Role must be one of: ADMIN, MANAGER, USER" }),
  }),
});

export const setUserRateLimitSchema = z.object({
  limit: z
    .number({
      required_error: "Limit is required",
      invalid_type_error: "Limit must be a number",
    })
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1"),
  window: z
    .number()
    .int()
    .min(1, "Window must be at least 1 second")
    .optional(),
  enabled: z.boolean().optional(),
});
