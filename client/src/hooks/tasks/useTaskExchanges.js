import { useState, useEffect, useCallback } from "react";
import { exchangesApi } from "../../api/exchanges.js";

export const useTaskExchanges = (userId = null) => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exchangesApi.getUserExchanges();
      const fetchedExchanges = response.data || response; // Handle both response formats
      setExchanges(Array.isArray(fetchedExchanges) ? fetchedExchanges : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Failed to fetch exchanges:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestExchange = async (exchangeData) => {
    setLoading(true);
    try {
      const response = await exchangesApi.createExchange(exchangeData);
      const newExchange = response.data || response; // Handle both response formats
      setExchanges((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newExchange,
      ]);
      return newExchange;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptExchange = async (exchangeId, responseNote = "") => {
    try {
      const response = await exchangesApi.acceptExchange(
        exchangeId,
        responseNote,
      );
      const updatedExchange = response.data || response; // Handle both response formats
      setExchanges((prev) =>
        (Array.isArray(prev) ? prev : []).map((exchange) =>
          exchange.id === exchangeId ? updatedExchange : exchange,
        ),
      );
      return updatedExchange;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const rejectExchange = async (exchangeId, responseNote = "") => {
    try {
      const response = await exchangesApi.rejectExchange(
        exchangeId,
        responseNote,
      );
      const updatedExchange = response.data || response; // Handle both response formats
      setExchanges((prev) =>
        (Array.isArray(prev) ? prev : []).map((exchange) =>
          exchange.id === exchangeId ? updatedExchange : exchange,
        ),
      );
      return updatedExchange;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const cancelExchange = async (exchangeId) => {
    try {
      const response = await exchangesApi.cancelExchange(exchangeId);
      const updatedExchange = response.data || response; // Handle both response formats
      setExchanges((prev) =>
        (Array.isArray(prev) ? prev : []).map((exchange) =>
          exchange.id === exchangeId ? updatedExchange : exchange,
        ),
      );
      return updatedExchange;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  // Legacy function for backward compatibility
  const respondToExchange = async (exchangeId, status, responseNote = "") => {
    if (status === "ACCEPTED") {
      return await acceptExchange(exchangeId, responseNote);
    } else if (status === "REJECTED") {
      return await rejectExchange(exchangeId, responseNote);
    } else if (status === "CANCELLED") {
      return await cancelExchange(exchangeId);
    }
  };

  // Helper functions for filtering exchanges
  const getIncomingExchanges = (currentUserId) => {
    return exchanges.filter(
      (exchange) => exchange.receiverId === currentUserId,
    );
  };

  const getOutgoingExchanges = (currentUserId) => {
    return exchanges.filter(
      (exchange) => exchange.requesterId === currentUserId,
    );
  };

  const getPendingExchanges = (currentUserId) => {
    return exchanges.filter(
      (exchange) =>
        exchange.receiverId === currentUserId && exchange.status === "PENDING",
    );
  };

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  return {
    exchanges,
    loading,
    error,
    fetchExchanges,
    requestExchange,
    acceptExchange,
    rejectExchange,
    cancelExchange,
    respondToExchange, // Legacy compatibility
    getIncomingExchanges,
    getOutgoingExchanges,
    getPendingExchanges,
  };
};

export default useTaskExchanges;
