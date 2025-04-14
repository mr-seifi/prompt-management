import React, { useState } from 'react';
import styled from 'styled-components';
import { Prompt, PromptFormData } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface PromptFormProps {
  initialValues?: Partial<Prompt>;
  onSubmit: (data: PromptFormData) => void;
  isSubmitting?: boolean;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.cardHighlight};
  }
`;

const VariablesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const VariableItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const VariableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VariableName = styled.div`
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textPrimary};
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
  
  &:hover {
    color: ${props => props.theme.colors.danger};
  }
`;

const AddVariableButton = styled(Button)`
  align-self: flex-start;
  margin-top: 0.5rem;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxInput = styled.input`
  width: auto;
  margin-right: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const HelpText = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

const PromptForm: React.FC<PromptFormProps> = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<PromptFormData>({
    title: initialValues.title || '',
    content: initialValues.content || '',
    tags: initialValues.tags || [],
    variablesSchema: initialValues.variablesSchema || {},
    isFavorite: initialValues.isFavorite || false,
  });
  
  const [newVarName, setNewVarName] = useState('');
  const [newVarDescription, setNewVarDescription] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const addVariable = () => {
    if (newVarName.trim()) {
      setFormData(prev => ({
        ...prev,
        variablesSchema: {
          ...prev.variablesSchema,
          [newVarName.trim()]: {
            type: 'string',
            description: newVarDescription.trim() || `Description for ${newVarName.trim()}`
          }
        }
      }));
      setNewVarName('');
      setNewVarDescription('');
    }
  };
  
  const removeVariable = (name: string) => {
    const updatedSchema = { ...formData.variablesSchema };
    delete updatedSchema[name];
    
    setFormData(prev => ({
      ...prev,
      variablesSchema: updatedSchema
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter prompt title"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="content">Description</Label>
          <HelpText>Use {'{{'} variableName {'}}'}  syntax to insert variables in your prompt template</HelpText>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Enter prompt description with variables like {{ variable_name }}"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Variables</Label>
          <HelpText>Define variables that will be replaced in your prompt template</HelpText>
          
          <VariablesSection>
            {Object.entries(formData.variablesSchema || {}).map(([name, schema]) => (
              <VariableItem key={name}>
                <VariableHeader>
                  <VariableName>{name}</VariableName>
                  <RemoveButton onClick={() => removeVariable(name)}>×</RemoveButton>
                </VariableHeader>
                <div>Type: string</div>
                <div>Description: {schema.description}</div>
              </VariableItem>
            ))}
            
            <VariableItem>
              <FormGroup>
                <Label htmlFor="newVarName">Variable Name</Label>
                <Input
                  id="newVarName"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="e.g. project_name"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="newVarDescription">Description</Label>
                <Input
                  id="newVarDescription"
                  value={newVarDescription}
                  onChange={(e) => setNewVarDescription(e.target.value)}
                  placeholder="What this variable represents"
                />
              </FormGroup>
              
              <AddVariableButton type="button" variant="secondary" onClick={addVariable}>
                Add Variable
              </AddVariableButton>
            </VariableItem>
          </VariablesSection>
        </FormGroup>

        <FormGroup>
          <Checkbox>
            <CheckboxInput
              id="isFavorite"
              name="isFavorite"
              type="checkbox"
              checked={formData.isFavorite}
              onChange={handleChange}
            />
            <Label htmlFor="isFavorite">Add to favorites</Label>
          </Checkbox>
        </FormGroup>

        <ButtonGroup>
          <Button type="button" variant="secondary" as="a" href="/prompts">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : initialValues.id
              ? 'Update Prompt'
              : 'Create Prompt'}
          </Button>
        </ButtonGroup>
      </Form>
    </Card>
  );
};

export default PromptForm; 