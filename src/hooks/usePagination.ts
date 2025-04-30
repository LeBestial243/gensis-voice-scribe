
import { useState, useEffect, useMemo } from "react";

export function usePagination<T>({
  items,
  pageSize = 10,
  initialPage = 1
}: {
  items: T[];
  pageSize?: number;
  initialPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Ensure currentPage is within bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  // Paginate items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, currentPage, pageSize]);
  
  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems
  };
}

// Hook for server-side pagination
export function useServerPagination({
  totalItems = 0,
  pageSize = 10,
  initialPage = 1
}: {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Ensure currentPage is within bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  return {
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize
  };
}
