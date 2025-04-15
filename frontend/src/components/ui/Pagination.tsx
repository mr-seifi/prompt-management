import React from 'react';
import styled from 'styled-components';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 1.5rem 0;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: ${props => (props.isActive ? '600' : '400')};
  background-color: ${props => (props.isActive ? props.theme.colors.primary : 'transparent')};
  color: ${props => (props.isActive ? 'white' : props.theme.colors.textPrimary)};
  border: 1px solid ${props => (props.isActive ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.1)')};
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.isActive ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: transparent;
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const EllipsisIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: ${props => props.theme.colors.textSecondary};
`;

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Ensure current page is within valid range
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // No need to show pagination if there's only 1 page
  if (totalPages <= 1) {
    return null;
  }

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    
    // Always include first page
    pageNumbers.push(1);
    
    // Calculate start and end of page numbers to show
    let startPage = Math.max(2, validCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
    
    // Adjust starting page if we're near the end
    if (endPage === totalPages - 1) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 3));
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push('...');
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Always include last page if there's more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <PaginationContainer>
      {/* Previous Page Button */}
      <PageButton
        onClick={() => onPageChange(validCurrentPage - 1)}
        disabled={validCurrentPage === 1}
        aria-label="Previous page"
      >
        &laquo;
      </PageButton>
      
      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return <EllipsisIndicator key={`ellipsis-${index}`}>...</EllipsisIndicator>;
        }
        
        return (
          <PageButton
            key={`page-${page}`}
            isActive={page === validCurrentPage}
            onClick={() => page !== validCurrentPage && onPageChange(page as number)}
            aria-label={`Page ${page}`}
            aria-current={page === validCurrentPage ? 'page' : undefined}
          >
            {page}
          </PageButton>
        );
      })}
      
      {/* Next Page Button */}
      <PageButton
        onClick={() => onPageChange(validCurrentPage + 1)}
        disabled={validCurrentPage === totalPages}
        aria-label="Next page"
      >
        &raquo;
      </PageButton>
    </PaginationContainer>
  );
};

export default Pagination; 