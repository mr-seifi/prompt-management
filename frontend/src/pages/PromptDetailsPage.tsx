import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Prompt } from '../types';
import promptService from '../services/promptService';
import usePrompts from '../hooks/usePrompts';
import { formatDateTimeForDisplay } from '../services/promptService';
import PromptRenderer from '../components/prompts/PromptRenderer';
import ReactDOM from 'react-dom';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
  overflow: visible;
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
  overflow: visible;
`;

const ContentContainer = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  color: ${props => props.theme.colors.textSecondary};
  position: relative;
  overflow: visible;
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
  z-index: 10;

  &:hover {
    background-color: ${props => props.theme.colors.accent}30;
  }
`;

const TooltipContainer = styled.div`
  position: fixed;
  z-index: 9999;
  padding: 0.75rem;
  background-color: ${props => props.theme.colors.cardHelpHighlight};
  border-radius: ${props => props.theme.borderRadius.small};
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  max-width: 280px;
  min-width: 180px;
  pointer-events: none;
  text-align: center;

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
  cursor: pointer;
`;

const FavoriteIcon = styled.span<{ isFavorite: boolean }>`
  color: ${({ isFavorite, theme }) => (isFavorite ? theme.colors.warning : '#ccc')};
  font-size: 1.5rem;
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
  overflow: visible;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textPrimary};
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const DeleteButton = styled(Button)`
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.danger};
  color: white;
  border-radius: ${props => props.theme.borderRadius.medium};
  
  &:hover {
    background-color: #FF3333;
  }
`;

const EditButton = styled(Button)`
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #211951;
  color: white;
  border-radius: ${props => props.theme.borderRadius.medium};
  
  &:hover {
    background-color: #342c68;
  }
`;

interface HighlightedContentProps {
  content: string;
  variablesSchema?: Record<string, any>;
}

const HighlightedContent: React.FC<HighlightedContentProps> = ({ content, variablesSchema = {} }) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    name: string;
    position: { x: number; y: number };
  } | null>(null);

  const showTooltip = useCallback((e: React.MouseEvent, variableName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top - 10;
    
    setTooltip({
      visible: true,
      name: variableName,
      position: { x: centerX, y: topY }
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

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
      <HighlightedVariable 
        key={`var-${match.index}`}
        onMouseEnter={(e) => showTooltip(e, variableName)}
        onMouseLeave={hideTooltip}
      >
        {`{{${variableName}}}`}
      </HighlightedVariable>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return (
    <>
      <ContentContainer>{parts}</ContentContainer>
      {tooltip && tooltip.visible && ReactDOM.createPortal(
        <TooltipContainer 
          style={{
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <TooltipTitle>{tooltip.name}</TooltipTitle>
          <TooltipContent>
            {variablesSchema[tooltip.name]?.description || `Value for ${tooltip.name}`}
          </TooltipContent>
        </TooltipContainer>,
        document.body
      )}
    </>
  );
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
          <DeleteButton onClick={handleDelete} aria-label="Delete prompt">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
          </DeleteButton>
          <EditButton as={Link} to={`/prompts/${prompt.id}/edit`} aria-label="Edit prompt">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
          </EditButton>
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
              <SectionTitle>
                Description
                <FavoriteStatus onClick={handleToggleFavorite}>
                  <FavoriteIcon isFavorite={prompt.isFavorite}>★</FavoriteIcon>
                </FavoriteStatus>
              </SectionTitle>
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