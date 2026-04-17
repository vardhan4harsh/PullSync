// OWNER: Harsh Vardhan
// hooks/usePRs.js — Fetch PR list from backend API with mock fallback
import { useState, useEffect, useCallback } from "react";
import { prAPI } from "../services/api";
import { MOCK_PRS } from "../services/mockData";

export function usePRs(filters = {}) {
  const [prs, setPRs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const fetchPRs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await prAPI.list(filters);
      setPRs(result.data);
      setTotal(result.total);
      setUsingMock(false);
    } catch (err) {
      // Network error → fall back to mock
      if (err.message.includes("fetch") || err.message.includes("Failed") || err.message.includes("NetworkError")) {
        setPRs(MOCK_PRS);
        setTotal(MOCK_PRS.length);
        setUsingMock(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  const addPR = useCallback((newPR) => {
    setPRs((prev) => [newPR, ...prev]);
    setTotal((t) => t + 1);
  }, []);

  return { prs, total, loading, error, usingMock, refetch: fetchPRs, addPR };
}
