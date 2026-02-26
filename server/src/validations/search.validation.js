import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z
    .string({ required_error: "Search query is required" })
    .min(1, "Search query cannot be empty")
    .max(200, "Search query is too long (max 200 characters)"),
});
