import { useState, useCallback } from 'react';
import promptService from '../services/promptService';

interface UsePromptRendererReturn {
  variables: string[];
  loadVariables: (promptId: string) => Promise<void>;
  isLoadingVariables: boolean;
  renderPrompt: (promptId: string, variableValues: Record<string, string>) => Promise<boolean>;
  isRendering: boolean;
  renderedContent: string | null;
  error: string | null;
}

const usePromptRenderer = (): UsePromptRendererReturn => {
  const [variables, setVariables] = useState<string[]>([]);
  const [isLoadingVariables, setIsLoadingVariables] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedContent, setRenderedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVariables = useCallback(async (promptId: string) => {
    setIsLoadingVariables(true);
    setError(null);
    try {
      const vars = await promptService.getVariables(promptId);
      setVariables(vars);
    } catch (err: any) {
      console.error('Error loading variables:', err);
      setError('Failed to load variables. Please try again.');
    } finally {
      setIsLoadingVariables(false);
    }
  }, []);

  const renderPrompt = useCallback(async (promptId: string, variableValues: Record<string, string>) => {
    setIsRendering(true);
    setError(null);
    try {
      const result = await promptService.renderPrompt(promptId, { variable_values: variableValues });
      setRenderedContent(result.rendered_text);
      return true;
    } catch (err: any) {
      console.error('Error rendering prompt:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Failed to render prompt. Please try again.');
      }
      return false;
    } finally {
      setIsRendering(false);
    }
  }, []);

  return {
    variables,
    loadVariables,
    isLoadingVariables,
    renderPrompt,
    isRendering,
    renderedContent,
    error
  };
};

export default usePromptRenderer; 