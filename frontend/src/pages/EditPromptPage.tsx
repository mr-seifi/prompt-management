import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PromptForm from '../components/prompts/PromptForm';
import { PromptFormData, Prompt } from '../types';
import promptsService from '../services/promptService';
import usePrompts from '../hooks/usePrompts';
import promptService from '../services/promptService';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.textPrimary};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.cardHighlight};
  color: ${props => props.theme.colors.danger};
  border-radius: ${props => props.theme.borderRadius.medium};
`;

const EditPromptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updatePrompt } = usePrompts();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (data: PromptFormData) => {
    if (!id) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updatePrompt(id, data);
      if (result) {
        navigate(`/prompts/${id}`);
      } else {
        setError('Failed to update prompt. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingMessage>Loading prompt...</LoadingMessage>;
  }

  if (!prompt && !isLoading) {
    return <ErrorMessage>Prompt not found or could not be loaded.</ErrorMessage>;
  }

  return (
    <PageContainer>
      <PageTitle>Edit Prompt</PageTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {prompt && (
        <PromptForm 
          initialValues={prompt} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      )}
    </PageContainer>
  );
};

export default EditPromptPage; 