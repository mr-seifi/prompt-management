import React from 'react';
import styled from 'styled-components';
import PromptList from '../components/prompts/PromptList';
import usePrompts from '../hooks/usePrompts';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: ${props => props.theme.spacing.lg};
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
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

const FavoritesPage: React.FC = () => {
  // Initialize with favorites filter already set to avoid extra render cycles
  const {
    prompts,
    isLoading,
    error,
    deletePrompt,
    toggleFavorite,
  } = usePrompts({ favorites: true });

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this prompt?');
    if (confirmed) {
      await deletePrompt(id);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Favorite Prompts</PageTitle>

      {isLoading && <LoadingMessage>Loading favorite prompts...</LoadingMessage>}
      
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

export default FavoritesPage; 