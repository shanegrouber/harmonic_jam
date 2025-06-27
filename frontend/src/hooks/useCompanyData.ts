import { useState, useEffect, useCallback } from "react";
import { Company } from "../types";
import { getCollectionsById } from "../utils/jam-api";
import { useSearch } from "../utils/useApi";

export const useCompanyData = (
  selectedCollectionId: string,
  currentPage: number,
  currentPageSize: number,
  refreshTrigger: number,
  onPageChange?: (page: number) => void
) => {
  const [response, setResponse] = useState<Company[]>([]);
  const [total, setTotal] = useState<number>();
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Search functionality
  const { searchQuery, debouncedSearchQuery, handleSearchChange } = useSearch();

  // Calculate offset from current page and page size
  const offset = currentPage * currentPageSize;

  // Reset to first page when search query changes
  useEffect(() => {
    if (
      debouncedSearchQuery !== searchQuery &&
      currentPage !== 0 &&
      onPageChange
    ) {
      onPageChange(0);
    }
  }, [debouncedSearchQuery, searchQuery, currentPage, onPageChange]);

  const fetchData = useCallback(async () => {
    const startTime = performance.now();
    try {
      const newResponse = await getCollectionsById(
        selectedCollectionId,
        offset,
        currentPageSize,
        debouncedSearchQuery
      );
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      setResponse(newResponse.companies);
      setTotal(newResponse.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [selectedCollectionId, offset, currentPageSize, debouncedSearchQuery]);

  useEffect(() => {
    fetchData();
  }, [
    selectedCollectionId,
    offset,
    currentPageSize,
    refreshTrigger,
    debouncedSearchQuery,
    fetchData,
  ]);

  const refreshData = () => {
    fetchData();
  };

  return {
    response,
    setResponse,
    total,
    setTotal,
    loadTime,
    searchQuery,
    debouncedSearchQuery,
    handleSearchChange,
    refreshData,
  };
};
