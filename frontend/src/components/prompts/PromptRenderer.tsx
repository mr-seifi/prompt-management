import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '../ui/Button';
import Card from '../ui/Card';
import usePromptRenderer from '../../hooks/usePromptRenderer';

interface PromptRendererProps {
  promptId: string;
}

const RendererContainer = styled(Card)`
  margin-bottom: 2rem;
`;

const VariablesForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${props => props.theme.colors.textPrimary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.cardHighlight};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const ResultContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  white-space: pre-wrap;
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
`;

const ResultContent = styled.div`
  font-family: monospace;
  line-height: 1.5;
`;

const CopyButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  padding: 0.75rem;
  margin-top: 1rem;
  background-color: rgba(255, 0, 0, 0.05);
  border-radius: 4px;
  border-left: 3px solid ${props => props.theme.colors.danger};
`;

const PromptRenderer: React.FC<PromptRendererProps> = ({ promptId }) => {
  const {
    variables,
    loadVariables,
    isLoadingVariables,
    renderPrompt,
    isRendering,
    renderedContent,
    error
  } = usePromptRenderer();
  
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  
  // Load variables when component mounts
  useEffect(() => {
    if (promptId) {
      loadVariables(promptId);
    }
  }, [promptId, loadVariables]);
  
  // Reset variable values when variables change
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    variables.forEach(variable => {
      initialValues[variable] = '';
    });
    setVariableValues(initialValues);
  }, [variables]);
  
  const handleInputChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };
  
  const handleRender = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await renderPrompt(promptId, variableValues);
    if (result) {
      setShowResult(true);
    }
  };
  
  const copyToClipboard = () => {
    if (renderedContent) {
      navigator.clipboard.writeText(renderedContent);
    }
  };
  
  if (isLoadingVariables) {
    return <RendererContainer>Loading variables...</RendererContainer>;
  }
  
  return (
    <RendererContainer>
      <VariablesForm onSubmit={handleRender}>
        <h3>Fill in Template Variables</h3>
        
        {variables.length === 0 ? (
          <p>This template has no variables to fill in.</p>
        ) : (
          variables.map(variable => (
            <FormGroup key={variable}>
              <Label htmlFor={`var-${variable}`}>{variable}</Label>
              <Input
                id={`var-${variable}`}
                type="text"
                value={variableValues[variable] || ''}
                onChange={(e) => handleInputChange(variable, e.target.value)}
                placeholder={`Enter value for ${variable}`}
              />
            </FormGroup>
          ))
        )}
        
        <ButtonGroup>
          <Button type="submit" disabled={isRendering || variables.length === 0}>
            {isRendering ? 'Rendering...' : 'Render Template'}
          </Button>
        </ButtonGroup>
      </VariablesForm>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {showResult && renderedContent && (
        <ResultContainer>
          <ResultHeader>
            <ResultTitle>Rendered Result</ResultTitle>
            <CopyButton type="button" variant="primary" onClick={copyToClipboard}>
              Copy to Clipboard
            </CopyButton>
          </ResultHeader>
          <ResultContent>{renderedContent}</ResultContent>
        </ResultContainer>
      )}
    </RendererContainer>
  );
};

export default PromptRenderer; 