import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Prompt } from '../types';
import { promptsApi } from '../services/api';
import usePrompts from '../hooks/usePrompts';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: ${props => props.theme.colors.textPrimary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const PromptDetail = styled.div`
  margin-bottom: 1.5rem;
`;

const PromptContent = styled.p`
  white-space: pre-wrap;
  line-height: 1.6;
  color: ${props => props.theme.colors.textSecondary};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  margin: ${props => props.theme.spacing.md} 0;
`;

const Tag = styled.span`
  background-color: ${props => props.theme.colors.accent};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSizes.small};
`;

const PromptMeta = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const FavoriteStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const FavoriteIcon = styled.span<{ isFavorite: boolean }>`
  color: ${({ isFavorite, theme }) => (isFavorite ? theme.colors.warning : '#ccc')};
  font-size: 1.25rem;
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

const StyledCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
`;

const PromptDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, deletePrompt } = usePrompts();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await promptsApi.getPrompt(id);
        setPrompt(data);
      } catch (err) {
        setError('Failed to load prompt. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompt();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!prompt) return;
    
    try {
      const success = await toggleFavorite(prompt.id);
      if (success) {
        setPrompt(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!prompt || !window.confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const success = await deletePrompt(prompt.id);
      if (success) {
        navigate('/prompts');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingMessage>Loading prompt...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!prompt && !isLoading) {
    return <ErrorMessage>Prompt not found or could not be loaded.</ErrorMessage>;
  }

  return prompt ? (
    <PageContainer>
      <PageHeader>
        <PageTitle>{prompt.title}</PageTitle>
        <ButtonGroup>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="secondary" as={Link} to={`/prompts/${prompt.id}/edit`}>
            Edit
          </Button>
        </ButtonGroup>
      </PageHeader>
      
      <StyledCard>
        <PromptDetail>
          <PromptContent>{prompt.content}</PromptContent>
          
          {prompt.tags && prompt.tags.length > 0 && (
            <TagsContainer>
              {prompt.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </TagsContainer>
          )}
          
          <PromptMeta>
            <div>
              Last updated: {new Date(prompt.updatedAt).toLocaleDateString()}
            </div>
            <FavoriteStatus onClick={handleToggleFavorite}>
              <FavoriteIcon isFavorite={prompt.isFavorite}>★</FavoriteIcon>
              {prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </FavoriteStatus>
          </PromptMeta>
        </PromptDetail>
      </StyledCard>
    </PageContainer>
  ) : null;
};

export default PromptDetailsPage; 