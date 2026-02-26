import api from "./index.js";

export const searchApi = {
  globalSearch: async (query) => {
    const response = await api.get(`/search`, {
      params: { query },
    });
    return response.data;
  },
};
