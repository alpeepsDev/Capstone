import api from "./index";

const BASE = "/ai-preferences";

export const getAIPreferences = async () => {
  const response = await api.get(BASE);
  return response.data;
};

export const updateAIPreferences = async (data) => {
  const response = await api.put(BASE, data);
  return response.data;
};

export const resetAIPreferences = async () => {
  const response = await api.post(`${BASE}/reset`);
  return response.data;
};
