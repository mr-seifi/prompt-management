import React from 'react';
import styled from 'styled-components';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
`;

const PageInfo = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 1rem;
  font-size: 0.9rem;
`;

const PageButton = styled(Button)<{ active?: boolean }>`
  min-width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.active && `
    background-color: ${props.theme.colors.accent};
    color: white;
    &:hover {
      background-color: ${props.theme.colors.accent};
    }
  `}
`;

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }
  
  // Generate array of page numbers to display
  const pageNumbers = [];
  const maxPageButtons = 5; // Maximum number of page buttons to show
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  // Adjust if we're at the end
  if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <PaginationContainer>
      {/* First page button */}
      <PageButton 
        variant="primary" 
        size="small"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </PageButton>
      
      {/* Previous page button */}
      <PageButton 
        variant="primary" 
        size="small"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lsaquo;
      </PageButton>
      
      {/* Page number buttons */}
      {pageNumbers.map(page => (
        <PageButton
          key={page}
          variant="primary"
          size="small"
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </PageButton>
      ))}
      
      {/* Next page button */}
      <PageButton 
        variant="primary" 
        size="small"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &rsaquo;
      </PageButton>
      
      {/* Last page button */}
      <PageButton 
        variant="primary" 
        size="small"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        &raquo;
      </PageButton>
      
      <PageInfo>
        Page {currentPage} of {totalPages} ({totalItems} items)
      </PageInfo>
    </PaginationContainer>
  );
};

export default Pagination; 