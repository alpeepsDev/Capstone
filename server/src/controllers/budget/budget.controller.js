import prisma from "../../config/database.js";
import { encrypt, decrypt } from "../../utils/encryption.js";

/**
 * Get budget information for a project
 */
export const getBudget = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        totalBudget: true,
        budgetCategories: {
          include: {
            expenses: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Decrypt data
    if (project.budgetCategories) {
      project.budgetCategories = project.budgetCategories.map((cat) => ({
        ...cat,
        name: decrypt(cat.name),
        expenses: cat.expenses
          ? cat.expenses.map((exp) => ({
              ...exp,
              description: decrypt(exp.description),
            }))
          : [],
      }));
    }

    res.json({
      success: true,
      data: {
        totalBudget: project.totalBudget,
        categories: project.budgetCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project total budget
 */
export const updateTotalBudget = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { totalBudget } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    if (
      totalBudget === undefined ||
      totalBudget === null ||
      isNaN(parseFloat(totalBudget))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid total budget amount is required",
      });
    }

    const newTotal = parseFloat(totalBudget);

    // Use transaction to ensure data consistency
    const updatedProject = await prisma.$transaction(async (tx) => {
      // 1. Get current project with category allocations
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          budgetCategories: true,
        },
      });

      if (!project) {
        throw new Error("Project not found"); // Will be caught below
      }

      // 2. Calculate currently allocated amount
      const currentAllocated = project.budgetCategories.reduce(
        (sum, cat) => sum + cat.allocated,
        0,
      );

      // 3. Verify new total budget isn't less than what's already allocated
      if (newTotal < currentAllocated) {
        const error = new Error(
          `Cannot reduce budget below allocated amount (Allocated: ${currentAllocated})`,
        );
        error.code = "BUDGET_CONSTRAINT";
        throw error;
      }

      // 4. Update if safe
      return await tx.project.update({
        where: { id: projectId },
        data: { totalBudget: newTotal },
      });
    });

    res.json({
      success: true,
      data: { totalBudget: updatedProject.totalBudget },
    });
  } catch (error) {
    // Handle specific constraint error
    if (error.code === "BUDGET_CONSTRAINT") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle record not found
    if (error.message === "Project not found" || error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    next(error);
  }
};

/**
 * Add a budget category
 */
export const addCategory = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;

    const category = await prisma.budgetCategory.create({
      data: {
        name: encrypt(name),
        color,
        projectId,
      },
    });

    // Decrypt for response
    category.name = decrypt(category.name);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a budget category allocation
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { allocated } = req.body;
    const newAllocation = parseFloat(allocated);

    if (isNaN(newAllocation) || newAllocation < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid allocation amount is required",
      });
    }

    const updatedCategory = await prisma.$transaction(async (tx) => {
      // 1. Get the category to find its project ID and current state
      const category = await tx.budgetCategory.findUnique({
        where: { id: categoryId },
        include: {
          project: {
            include: {
              budgetCategories: true,
            },
          },
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      // 2. Calculate total allocated EXCLUDING this category
      const project = category.project;
      const otherCategoriesAllocated = project.budgetCategories
        .filter((c) => c.id !== categoryId)
        .reduce((sum, c) => sum + c.allocated, 0);

      // 3. Verify new allocation fits within total budget
      if (otherCategoriesAllocated + newAllocation > project.totalBudget) {
        const available = project.totalBudget - otherCategoriesAllocated;
        const error = new Error(
          `Allocation exceeds remaining budget. Available: ${available}`,
        );
        error.code = "BUDGET_EXCEEDED";
        throw error;
      }

      // 4. Update if safe
      return await tx.budgetCategory.update({
        where: { id: categoryId },
        data: { allocated: newAllocation },
      });
    });

    res.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    if (error.code === "BUDGET_EXCEEDED") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Category not found") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    next(error);
  }
};

/**
 * Remove a budget category
 */
export const removeCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    await prisma.budgetCategory.delete({
      where: { id: categoryId },
    });

    res.json({
      success: true,
      message: "Category removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an expense to a category
 */
export const addExpense = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { description, amount } = req.body;
    const expenseAmount = parseFloat(amount);

    if (!description || isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Description and valid positive amount are required",
      });
    }

    const expense = await prisma.$transaction(async (tx) => {
      // 1. Get category with its current expenses
      const category = await tx.budgetCategory.findUnique({
        where: { id: categoryId },
        include: {
          expenses: true,
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      // 2. Calculate current spending
      const currentSpent = category.expenses.reduce(
        (sum, e) => sum + e.amount,
        0,
      );

      // 3. Verify new expense doesn't exceed allocation
      if (currentSpent + expenseAmount > category.allocated) {
        const remaining = category.allocated - currentSpent;
        const error = new Error(
          `Expense exceeds category allocation. Remaining: ${remaining}`,
        );
        error.code = "ALLOCATION_EXCEEDED";
        throw error;
      }

      // 4. Create expense if safe
      return await tx.budgetExpense.create({
        data: {
          description: encrypt(description),
          amount: expenseAmount,
          categoryId,
        },
      });
    });

    // Decrypt for response
    expense.description = decrypt(expense.description);

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    if (error.code === "ALLOCATION_EXCEEDED") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Category not found") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    next(error);
  }
};

/**
 * Remove an expense
 */
export const removeExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    await prisma.budgetExpense.delete({
      where: { id: expenseId },
    });

    res.json({
      success: true,
      message: "Expense removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
