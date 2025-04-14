import React from 'react';
import styled from 'styled-components';
import { Prompt } from '../../types';
import PromptCard from './PromptCard';

interface PromptListProps {
  prompts: Prompt[];
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  background-color: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  border: 1px solid rgba(0, 0, 0, 0.04);
`;

const EmptyStateMessage = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.fontSizes.large};
  font-family: ${props => props.theme.typography.fontFamilyBody};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.primary};
`;

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  onDelete,
  onToggleFavorite,
}) => {
  if (prompts.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon>📝</EmptyStateIcon>
        <EmptyStateMessage>No prompts found</EmptyStateMessage>
        <p>Create your first prompt to get started</p>
      </EmptyState>
    );
  }

  return (
    <ListContainer>
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </ListContainer>
  );
};

export default PromptList; 