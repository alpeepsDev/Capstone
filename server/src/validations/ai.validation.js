import { z } from "zod";

export const askNovaSchema = z.object({
  query: z
    .string({
      required_error: "Query is required",
      invalid_type_error: "Query must be a string",
    })
    .min(1, "Query cannot be empty")
    .max(500, "Query is too long (max 500 characters)"),
});

export const proofreadSchema = z.object({
  text: z
    .string({
      required_error: "Text is required",
      invalid_type_error: "Text must be a string",
    })
    .min(1, "Text cannot be empty")
    .max(2000, "Text is too long (max 2000 characters)"),
});
