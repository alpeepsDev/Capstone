import { z } from "zod";

export const updateBudgetSchema = z.object({
  totalBudget: z
    .number({
      required_error: "Total budget is required",
      invalid_type_error: "Total budget must be a number",
    })
    .min(0, "Total budget cannot be negative"),
});

export const addCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .min(1, "Category name cannot be empty")
    .max(100, "Category name must be less than 100 characters"),
  color: z
    .string({ required_error: "Color is required" })
    .min(1, "Color cannot be empty")
    .max(20, "Color must be less than 20 characters"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name cannot be empty")
    .max(100, "Category name must be less than 100 characters")
    .optional(),
  allocated: z
    .number()
    .min(0, "Allocated amount cannot be negative")
    .optional(),
  color: z.string().max(20, "Color must be less than 20 characters").optional(),
});

export const addExpenseSchema = z.object({
  description: z
    .string({ required_error: "Description is required" })
    .min(1, "Description cannot be empty")
    .max(200, "Description must be less than 200 characters"),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0"),
});
