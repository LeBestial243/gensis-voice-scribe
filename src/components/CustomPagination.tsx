
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CustomPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: CustomPaginationProps) => {
  // Generate page numbers to display
  const generatePagination = () => {
    // Always show first page, last page, current page, and one page before and after current
    const pages = new Set<number>();
    pages.add(1); // First page
    if (totalPages > 1) pages.add(totalPages); // Last page
    pages.add(currentPage); // Current page
    
    if (currentPage > 1) pages.add(currentPage - 1); // One before current
    if (currentPage < totalPages) pages.add(currentPage + 1); // One after current
    
    return Array.from(pages).sort((a, b) => a - b);
  };
  
  const pages = generatePagination();
  
  if (totalPages <= 1) return null;
  
  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} 
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            href="#"
          />
        </PaginationItem>
        
        {pages.map((page, i) => {
          // Check if we need to render ellipsis
          const shouldRenderEllipsisBefore = i > 0 && page > pages[i-1] + 1;
          const shouldRenderEllipsisAfter = i < pages.length - 1 && page < pages[i+1] - 1;
          
          return (
            <React.Fragment key={page}>
              {shouldRenderEllipsisBefore && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationLink 
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  href="#"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
              
              {shouldRenderEllipsisAfter && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </React.Fragment>
          );
        })}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            href="#"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
