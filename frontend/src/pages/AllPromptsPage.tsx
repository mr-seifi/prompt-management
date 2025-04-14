import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import PromptList from '../components/prompts/PromptList';
import PromptFilters from '../components/prompts/PromptFilters';
import Button from '../components/ui/Button';
import usePrompts from '../hooks/usePrompts';

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

  return (
    <PageContainer>
      <HeaderContainer>
        <PageTitle>All Prompts</PageTitle>
        <Button as={Link} to="/prompts/new">
          Create New Prompt
        </Button>
      </HeaderContainer>

      <PromptFilters filters={filters} onFilterChange={applyFilters} />

      {isLoading && <LoadingMessage>Loading prompts...</LoadingMessage>}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {!isLoading && !error && (
        <PromptList
          prompts={prompts}
          onDelete={handleDelete}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </PageContainer>
  );
};

export default AllPromptsPage; 