import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PromptForm from '../components/prompts/PromptForm';
import { PromptFormData } from '../types';
import usePrompts from '../hooks/usePrompts';

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

const ErrorMessage = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.cardHighlight};
  color: ${props => props.theme.colors.danger};
  border-radius: ${props => props.theme.borderRadius.medium};
`;

const CreatePromptPage: React.FC = () => {
  const navigate = useNavigate();
  const { createPrompt } = usePrompts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PromptFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createPrompt(data);
      if (result) {
        navigate(`/prompts/${result.id}`);
      } else {
        setError('Failed to create prompt. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Create New Prompt</PageTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <PromptForm 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </PageContainer>
  );
};

export default CreatePromptPage; 