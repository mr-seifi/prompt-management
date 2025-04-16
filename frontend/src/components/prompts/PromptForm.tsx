import React, { useState, useEffect, useRef } from 'react';
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
  font-weight: 700;
  color: ${props => props.theme.colors.textPrimary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
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
  border: 1px solid rgba(0, 0, 0, 0.1);
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

const VariablePreviewContainer = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background-color: rgba(255, 255, 255, 0.03);
  min-height: 100px;
  position: relative;
  color: ${props => props.theme.colors.textPrimary};
  white-space: pre-wrap;
  line-height: 1.6;
  cursor: text;
`;

const HighlightedVariable = styled.span`
  background-color: ${props => props.theme.colors.accent + '33'};
  border-radius: 3px;
  padding: 0 4px;
  border: 1px dashed ${props => props.theme.colors.accent};
  cursor: pointer;
  position: relative;
  
  &:hover {
    background-color: ${props => props.theme.colors.accent + '66'};
  }
`;

const VariablePopup = styled.div`
  position: fixed;
  background-color: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.accent};
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
  z-index: 100;
  max-width: 350px;
  min-width: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const PopupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
`;

const PopupDescription = styled.div`
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const PopupActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const PopupButton = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background-color: ${props => `${props.theme.colors.accent}cc`};
  }
`;

const PopupInputContainer = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
`;

const PopupInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
  }
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

const NotificationBanner = styled.div`
  background-color: ${props => props.theme.colors.accent + '33'};
  color: ${props => props.theme.colors.textPrimary};
  padding: 10px 15px;
  border-radius: 4px;
  border-left: 4px solid ${props => props.theme.colors.accent};
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationText = styled.div`
  font-size: 0.9rem;
`;

const NotificationButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.accent};
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  
  &:hover {
    color: ${props => props.theme.colors.textPrimary};
  }
`;

interface VariablePopupState {
  visible: boolean;
  variable: string;
  position: { top: number; left: number };
}

const VariableHighlighter: React.FC<{
  content: string;
  variablesSchema: Record<string, any>;
  onContentClick: () => void;
  onUpdateVariableDescription: (variable: string, description: string) => void;
}> = ({ content, variablesSchema, onContentClick, onUpdateVariableDescription }) => {
  const [popup, setPopup] = useState<VariablePopupState>({
    visible: false,
    variable: '',
    position: { top: 0, left: 0 }
  });
  const [description, setDescription] = useState('');

  useEffect(() => {
    const handleClickOutside = () => {
      setPopup(prev => ({ ...prev, visible: false }));
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (popup.visible && popup.variable) {
      const currentDesc = variablesSchema[popup.variable]?.description || '';
      setDescription(currentDesc);
    }
  }, [popup.visible, popup.variable, variablesSchema]);

  const renderContent = () => {
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variableName = match[1];
      
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      parts.push(
        <HighlightedVariable
          key={`var-${match.index}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            setPopup({
              visible: true,
              variable: variableName,
              position: { 
                top: 0,
                left: 0
              }
            });
          }}
        >
          {variableName}
        </HighlightedVariable>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts;
  };

  const handleSaveDescription = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onUpdateVariableDescription(popup.variable, description);
    setPopup(prev => ({ ...prev, visible: false }));
  };

  return (
    <VariablePreviewContainer onClick={(e) => {
      e.preventDefault();
      onContentClick();
    }}>
      {renderContent()}
      
      {popup.visible && (
        <VariablePopup
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <PopupTitle>Variable: {popup.variable}</PopupTitle>
          
          <PopupDescription>
            Provide a description for this variable:
          </PopupDescription>
          
          <PopupInputContainer>
            <PopupInput
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Description for ${popup.variable}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveDescription(e);
                }
              }}
            />
          </PopupInputContainer>
          
          <PopupActions>
            <PopupButton onClick={handleSaveDescription}>
              Save
            </PopupButton>
            <PopupButton onClick={(e) => {
              e.preventDefault();
              setPopup(prev => ({ ...prev, visible: false }));
            }}>
              Cancel
            </PopupButton>
          </PopupActions>
        </VariablePopup>
      )}
    </VariablePreviewContainer>
  );
};

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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newlyDetectedVars, setNewlyDetectedVars] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const extractVariables = () => {
      const content = formData.content;
      if (!content) return;
      
      const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
      const foundVariables = new Set<string>();
      const newVariables: string[] = [];
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        foundVariables.add(varName);
        
        if (!(formData.variablesSchema && formData.variablesSchema[varName])) {
          newVariables.push(varName);
        }
      }
      
      if (newVariables.length > 0) {
        setNewlyDetectedVars(newVariables);
        setShowNotification(true);
        
        setFormData((prev: PromptFormData): PromptFormData => {
          const updatedSchema = { ...(prev.variablesSchema || {}) };
          
          newVariables.forEach(variable => {
            updatedSchema[variable] = {
              type: 'string',
              description: ''
            };
          });
          
          return {
            ...prev,
            variablesSchema: updatedSchema
          };
        });
      }
    };
    
    extractVariables();
  }, [formData.content]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    if (name === 'content') {
      // Extract current variables from the new content
      const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
      const currentVariables = new Set<string>();
      let match;
      
      while ((match = regex.exec(value)) !== null) {
        currentVariables.add(match[1]);
      }

      setFormData((prev) => {
        // Clean up variablesSchema to only keep current variables
        const updatedSchema = { ...(prev.variablesSchema || {}) };
        Object.keys(updatedSchema).forEach(variable => {
          if (!currentVariables.has(variable)) {
            delete updatedSchema[variable];
          }
        });

        return {
          ...prev,
          [name]: value,
          variablesSchema: updatedSchema
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleFocusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleUpdateVariableDescription = (variableName: string, description: string) => {
    setFormData(prev => ({
      ...prev,
      variablesSchema: {
        ...(prev.variablesSchema || {}),
        [variableName]: {
          type: 'string',
          description: description || `Value for ${variableName}`
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allVariablesHaveDescriptions = Object.entries(formData.variablesSchema || {}).every(
      ([_, schema]) => Boolean(schema.description)
    );
    
    if (!allVariablesHaveDescriptions) {
      alert('Please provide descriptions for all variables by clicking on them in the preview.');
      return;
    }
    
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
            ref={textareaRef}
          />
          
          {showNotification && newlyDetectedVars.length > 0 && (
            <NotificationBanner>
              <NotificationText>
                {newlyDetectedVars.length === 1 
                  ? `New variable detected: ${newlyDetectedVars[0]}. Click on it to add a description.`
                  : `${newlyDetectedVars.length} new variables detected. Click on each to add descriptions.`
                }
              </NotificationText>
              <NotificationButton onClick={() => setShowNotification(false)}>
                Dismiss
              </NotificationButton>
            </NotificationBanner>
          )}
          
          {formData.content && (
            <>
              <Label>Preview with Variable Highlighting</Label>
              <VariableHighlighter 
                content={formData.content}
                variablesSchema={formData.variablesSchema || {}}
                onContentClick={handleFocusTextarea}
                onUpdateVariableDescription={handleUpdateVariableDescription}
              />
              <HelpText>Click on highlighted variables to provide descriptions for them</HelpText>
            </>
          )}
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
            <Label htmlFor="isFavorite">Add to Favorites</Label>
          </Checkbox>
        </FormGroup>

        <ButtonGroup>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !formData.title || !formData.content}
          >
            {isSubmitting 
              ? 'Saving...' 
              : initialValues.id 
                ? 'Update Prompt' 
                : 'Create Prompt'
            }
          </Button>
        </ButtonGroup>
      </Form>
    </Card>
  );
};

export default PromptForm; 