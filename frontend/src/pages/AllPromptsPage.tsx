import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import PromptList from '../components/prompts/PromptList';
import PromptFilters from '../components/prompts/PromptFilters';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import usePrompts from '../hooks/usePrompts';

// Match the backend page size from Django REST Framework settings
const PAGE_SIZE = 12;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: ${props => props.theme.spacing.lg};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: ${props => props.theme.colors.textPrimary};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.danger};
  background-color: ${props => props.theme.colors.cardHighlight};
  border-radius: ${props => props.theme.borderRadius.medium};
`;

const AllPromptsPage: React.FC = () => {
  const {
    prompts,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    error,
    filters,
    applyFilters,
    deletePrompt,
    toggleFavorite,
  } = usePrompts();

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this prompt?');
    if (confirmed) {
      await deletePrompt(id);
    }
  };

  // Handler for page changes
  const handlePageChange = (page: number) => {
    // When search is active, we handle pagination on the client side
    // and don't send the page parameter to backend
    applyFilters({ page });
  };

  // Handler for filter changes that should reset pagination
  const handleFilterChange = (newFilters: any) => {
    // If it's a search filter, we'll handle the pagination on client side
    // but we still want to update the UI to show page 1
    if ('search' in newFilters) {
      applyFilters({
        ...newFilters,
        page: 1 // Reset to page 1 for search, though this won't be sent to backend
      });
    }
    // If changing any other filter (besides page), reset to page 1
    else if (!('page' in newFilters)) {
      applyFilters({ ...newFilters, page: 1 });
    } 
    // For direct page changes, just apply as is
    else {
      applyFilters(newFilters);
    }
  };

  // Determine current page from filters or default to 1
  const currentPage = filters.page || 1;

  return (
    <PageContainer>
      <HeaderContainer>
        <PageTitle>All Prompts</PageTitle>
        <Button as={Link} to="/prompts/new">
          Create New Prompt
        </Button>
      </HeaderContainer>

      <PromptFilters filters={filters} onFilterChange={handleFilterChange} />

      {isLoading && <LoadingMessage>Loading prompts...</LoadingMessage>}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {!isLoading && !error && (
        <>
          <PromptList
            prompts={prompts}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
          />
          
          <Pagination 
            currentPage={currentPage}
            totalItems={totalCount}
            itemsPerPage={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </PageContainer>
  );
};

export default AllPromptsPage; 