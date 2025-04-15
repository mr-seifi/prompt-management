import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Prompt } from '../types';
import promptService from '../services/promptService';
import usePrompts from '../hooks/usePrompts';
import { formatDateTimeForDisplay } from '../services/promptService';
import PromptRenderer from '../components/prompts/PromptRenderer';

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

const ContentContainer = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  color: ${props => props.theme.colors.textSecondary};
`;

const HighlightedVariable = styled.span`
  background-color: ${props => props.theme.colors.cardHighlight};
  color: ${props => props.theme.colors.textPrimary};
  padding: 0 4px;
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: help;
  position: relative;
  display: inline-flex;
  align-items: center;
  border-bottom: 1px dashed ${props => props.theme.colors.accent};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accent}30;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => props.theme.colors.cardHelpHighlight};
  color: ${props => props.theme.colors.textPrimary};
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.small};
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  min-width: 180px;
  max-width: 280px;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  font-size: 0.9rem;
  text-align: center;
  pointer-events: none;

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: ${props => props.theme.colors.cardHighlight} transparent transparent transparent;
  }

  ${HighlightedVariable}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const TooltipTitle = styled.div`
  font-weight: bold;
  margin-bottom: 0.25rem;
  font-size: 1.2rem;
  color: ${props => props.theme.colors.accent};
`;

const TooltipContent = styled.div`
  font-style: italic;
  color: ${props => props.theme.colors.textTertiary};
  font-size: 0.85rem;
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
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.textPrimary};
`;

const TabContainer = styled.div`
  margin-bottom: 1rem;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TabButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.accent : 'transparent'};
  color: ${props => props.active ? props.theme.colors.accent : props.theme.colors.textSecondary};
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.accent};
  }
`;

interface HighlightedContentProps {
  content: string;
  variablesSchema?: Record<string, any>;
}

const HighlightedContent: React.FC<HighlightedContentProps> = ({ content, variablesSchema = {} }) => {
  if (!content) return null;

  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  const testRegex = new RegExp(regex);
  const hasVariables = testRegex.test(content);

  regex.lastIndex = 0;
  
  if (!hasVariables) {
    return <ContentContainer>{content}</ContentContainer>;
  }

  while ((match = regex.exec(content)) !== null) {
    const variableName = match[1];
    
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    
    parts.push(
      <HighlightedVariable key={`var-${match.index}`}>
        {`{{${variableName}}}`}
        <Tooltip>
          <TooltipTitle>{variableName}</TooltipTitle>
          <TooltipContent>
            {variablesSchema[variableName]?.description || `Value for ${variableName}`}
          </TooltipContent>
        </Tooltip>
      </HighlightedVariable>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return <ContentContainer>{parts}</ContentContainer>;
};

const PromptDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, deletePrompt } = usePrompts();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'render'>('details');
  const [showRenderer, setShowRenderer] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await promptService.getPrompt(id);
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
          <Button variant="primary" as={Link} to={`/prompts/${prompt.id}/edit`}>
            Edit
          </Button>
        </ButtonGroup>
      </PageHeader>
      
      <TabContainer>
        <TabButtons>
          <TabButton 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')}
          >
            Details
          </TabButton>
          <TabButton 
            active={activeTab === 'render'} 
            onClick={() => {
              setActiveTab('render');
              setShowRenderer(true);
            }}
          >
            Render
          </TabButton>
        </TabButtons>
      </TabContainer>
      
      {activeTab === 'details' ? (
        <>
          <StyledCard>
            <PromptDetail>
              <SectionTitle>Description</SectionTitle>
              <HighlightedContent 
                content={prompt.content} 
                variablesSchema={prompt.variablesSchema} 
              />
              
              {prompt.tags && prompt.tags.length > 0 && (
                <TagsContainer>
                  {prompt.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </TagsContainer>
              )}
              
              <PromptMeta>
                <div>
                  Last updated: {prompt.updatedAt}
                </div>
                <FavoriteStatus onClick={handleToggleFavorite}>
                  <FavoriteIcon isFavorite={prompt.isFavorite}>★</FavoriteIcon>
                  {prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </FavoriteStatus>
              </PromptMeta>
            </PromptDetail>
          </StyledCard>
        </>
      ) : (
        showRenderer && <PromptRenderer promptId={prompt.id} />
      )}
    </PageContainer>
  ) : null;
};

export default PromptDetailsPage; 