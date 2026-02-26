import express from "express";
import { auth } from "../../middleware/auth.js";
import * as budgetController from "../../controllers/budget/budget.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  updateBudgetSchema,
  addCategorySchema,
  updateCategorySchema,
  addExpenseSchema,
} from "../../validations/budget.validation.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Budget routes
router.get("/:projectId", budgetController.getBudget);
router.put(
  "/:projectId/total",
  validateRequest(updateBudgetSchema),
  budgetController.updateTotalBudget,
);
router.post(
  "/:projectId/categories",
  validateRequest(addCategorySchema),
  budgetController.addCategory,
);
router.put(
  "/categories/:categoryId",
  validateRequest(updateCategorySchema),
  budgetController.updateCategory,
);
router.delete("/categories/:categoryId", budgetController.removeCategory);
router.post(
  "/categories/:categoryId/expenses",
  validateRequest(addExpenseSchema),
  budgetController.addExpense,
);
router.delete("/expenses/:expenseId", budgetController.removeExpense);

export default router;
