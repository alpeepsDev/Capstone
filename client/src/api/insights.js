import api from "./index";

/**
 * Nova AI Insights API
 * Handles all insight-related API calls
 */

// Get active insights for current user
export const getInsights = async (limit = 5) => {
  const response = await api.get(`/insights?limit=${limit}`);
  return response.data;
};

// Get insight history with pagination
export const getInsightHistory = async (page = 1, limit = 20) => {
  const response = await api.get(
    `/insights/history?page=${page}&limit=${limit}`,
  );
  return response.data;
};

// Manually trigger insight generation
export const generateInsights = async () => {
  const response = await api.post("/insights/generate");
  return response.data;
};

// Dismiss an insight
export const dismissInsight = async (insightId) => {
  const response = await api.put(`/insights/${insightId}/dismiss`);
  return response.data;
};

// Mark insight as acted upon
export const markInsightAction = async (insightId) => {
  const response = await api.put(`/insights/${insightId}/action`);
  return response.data;
};

// Get insight statistics
export const getInsightStats = async () => {
  const response = await api.get("/insights/stats");
  return response.data;
};
