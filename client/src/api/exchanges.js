import api from "./index.js";

export const exchangesApi = {
  // Create task exchange
  createExchange: async (exchangeData) => {
    const response = await api.post("/exchanges", exchangeData);
    return response.data;
  },

  // Get user's exchange requests (sent and received)
  getUserExchanges: async () => {
    const response = await api.get("/exchanges");
    return response.data;
  },

  // Get all exchanges for manager's projects (manager-only)
  getProjectExchanges: async () => {
    const response = await api.get("/exchanges/project");
    return response.data;
  },

  // Get exchanges for a specific task
  getTaskExchanges: async (taskId) => {
    const response = await api.get(`/exchanges/task/${taskId}`);
    return response.data;
  },

  // Accept exchange request
  acceptExchange: async (exchangeId, responseNote = "") => {
    const response = await api.put(`/exchanges/${exchangeId}/accept`, {
      responseNote,
    });
    return response.data;
  },

  // Reject exchange request
  rejectExchange: async (exchangeId, responseNote = "") => {
    const response = await api.put(`/exchanges/${exchangeId}/reject`, {
      responseNote,
    });
    return response.data;
  },

  // Cancel exchange request (by requester)
  cancelExchange: async (exchangeId) => {
    const response = await api.put(`/exchanges/${exchangeId}/cancel`);
    return response.data;
  },

  // Get single exchange details
  getExchange: async (exchangeId) => {
    const response = await api.get(`/exchanges/${exchangeId}`);
    return response.data;
  },
};
