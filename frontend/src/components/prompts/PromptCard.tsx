import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Prompt } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatDateTimeForDisplay } from '../../services/promptService';

interface PromptCardProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const CardActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const PromptTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const FavoriteIcon = styled.span<{ favorite: boolean }>`
  color: ${({ favorite, theme }) => (favorite ? theme.colors.warning : '#ccc')};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSizes.large};
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

const PromptContent = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VariablesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
  margin: ${props => props.theme.spacing.sm} 0;
`;

const Variable = styled.span`
  background-color: ${props => props.theme.colors.accent};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSizes.small};
`;

const DateInfo = styled.small`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.fontSizes.small};
  opacity: 0.8;
`;

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onDelete,
  onToggleFavorite,
}) => {
  const formattedDate = formatDateTimeForDisplay(prompt.updatedAt);
  
  // Safely extract variables from detectedVariables
  let variables: string[] = [];
  if (Array.isArray(prompt.detectedVariables)) {
    // If detectedVariables is an array, use it directly
    variables = prompt.detectedVariables.filter(Boolean);
  } else if (prompt.detectedVariables && typeof prompt.detectedVariables === 'string') {
    // If detectedVariables is a non-empty string, split it
    variables = prompt.detectedVariables.split(',').filter(Boolean);
  } else if (prompt.variablesSchema) {
    // Fall back to keys from variablesSchema if detectedVariables is not available
    variables = Object.keys(prompt.variablesSchema);
  }

  return (
    <StyledCard>
      <CardContent>
        <PromptTitle>
          <FavoriteIcon
            favorite={prompt.isFavorite}
            onClick={() => onToggleFavorite(prompt.id)}
          >
            ★
          </FavoriteIcon>
          <h3>{prompt.title}</h3>
        </PromptTitle>
        
        <PromptContent>{prompt.content}</PromptContent>
        
        {variables.length > 0 && (
          <VariablesContainer>
            {variables.map(variable => (
              <Variable key={variable}>{variable}</Variable>
            ))}
          </VariablesContainer>
        )}
        
        <DateInfo>Last updated: {formattedDate}</DateInfo>
      </CardContent>
      <CardActions>
        <Button
          variant="danger"
          size="small"
          onClick={() => onDelete(prompt.id)}
        >
          Delete
        </Button>
        <Button variant="secondary" size="small" as={Link} to={`/prompts/${prompt.id}/edit`}>
          Edit
        </Button>
        <Button variant="primary" size="small" as={Link} to={`/prompts/${prompt.id}`}>
          View
        </Button>
      </CardActions>
    </StyledCard>
  );
};

export default PromptCard; 