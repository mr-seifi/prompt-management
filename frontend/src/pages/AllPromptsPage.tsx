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
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.md};
    gap: 1rem;
  }

  @media (max-width: 480px) {
    padding: ${props => props.theme.spacing.sm};
    gap: 0.75rem;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  button {
    &:hover {
      color: white !important;
      background-color: ${props => props.theme.colors.primary};
    }
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: ${props => props.theme.colors.textPrimary};
  
  @media (max-width: 1024px) {
    font-size: 1.8rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 0.9rem;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.danger};
  background-color: ${props => props.theme.colors.cardHighlight};
  border-radius: ${props => props.theme.borderRadius.medium};
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 0.9rem;
  }
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

  const handlePageChange = (page: number) => {
    applyFilters({ page });
  };

  // Handler for filter changes that should reset pagination
  const handleFilterChange = (newFilters: any) => {
    // If changing any filter other than page, reset to page 1
    if ('page' in newFilters) {
      applyFilters(newFilters);
    } else {
      applyFilters({ ...newFilters, page: 1 });
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