import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  role: z
    .enum(["USER", "ADMIN", "MODERATOR", "MANAGER"])
    .default("USER")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN", "MODERATOR", "MANAGER"], {
    errorMap: () => ({
      message: "Role must be one of: USER, ADMIN, MODERATOR, MANAGER",
    }),
  }),
});

export const userIdSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});
