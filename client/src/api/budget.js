import api from "./index.js";

export const budgetApi = {
  // Get budget for a project
  getBudget: async (projectId) => {
    const response = await api.get(`/budget/${projectId}`);
    return response.data;
  },

  // Update total budget
  updateTotalBudget: async (projectId, totalBudget) => {
    const response = await api.put(`/budget/${projectId}/total`, {
      totalBudget,
    });
    return response.data;
  },

  // Add a category
  addCategory: async (projectId, categoryData) => {
    const response = await api.post(
      `/budget/${projectId}/categories`,
      categoryData,
    );
    return response.data;
  },

  // Update category allocation
  updateCategory: async (categoryId, allocated) => {
    const response = await api.put(`/budget/categories/${categoryId}`, {
      allocated,
    });
    return response.data;
  },

  // Remove category
  removeCategory: async (categoryId) => {
    const response = await api.delete(`/budget/categories/${categoryId}`);
    return response.data;
  },

  // Add expense
  addExpense: async (categoryId, expenseData) => {
    const response = await api.post(
      `/budget/categories/${categoryId}/expenses`,
      expenseData,
    );
    return response.data;
  },

  // Remove expense
  removeExpense: async (expenseId) => {
    const response = await api.delete(`/budget/expenses/${expenseId}`);
    return response.data;
  },
};
