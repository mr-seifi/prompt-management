import { useState, useEffect, useCallback } from 'react';
import { Prompt, PromptFilters, PromptFormData, SortOrder, PaginatedResponse } from '../types';
import promptService from '../services/promptService';

const usePrompts = (initialFilters: PromptFilters = {}) => {
  const [promptsData, setPromptsData] = useState<PaginatedResponse<Prompt>>({
    count: 0,
    next: null,
    previous: null,
    results: []
  });
  const [filters, setFilters] = useState<PromptFilters>({
    sortBy: 'updatedAt',
    sortOrder: SortOrder.DESC,
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prompts with filters applied
  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await promptService.getPrompts(filters);
      setPromptsData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch prompts. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  // Get the current page of results and adjusted count for client-side pagination
  const getClientSidePaginationData = useCallback(() => {
    const page = filters.page || 1;
    const pageSize = 12; // Match backend page size
    
    // If there's no search, just return server-side pagination data
    if (!filters.search) {
      return {
        results: promptsData.results,
        count: promptsData.count
      };
    }

    // For search results, we do client-side pagination
    const allResults = promptsData.results;
    const totalCount = allResults.length;
    
    // When search is active, we do client-side pagination by slicing the results
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const paginatedResults = allResults.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      count: totalCount
    };
  }, [filters.page, filters.search, promptsData.results]);

  // Apply filter changes
  const applyFilters = useCallback((newFilters: PromptFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Create a new prompt
  const createPrompt = async (promptData: PromptFormData): Promise<Prompt | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newPrompt = await promptService.createPrompt(promptData);
      console.log('Prompt created successfully:', newPrompt);
      
      // Just check if the API returned anything with an ID
      if (newPrompt && newPrompt.id) {
        fetchPrompts(); // Refresh the list after creating
        return newPrompt;
      } else {
        throw new Error('API returned success but no prompt data');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to create prompt. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      console.error('Create prompt error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing prompt
  const updatePrompt = async (id: string, promptData: Partial<PromptFormData>): Promise<Prompt | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPrompt = await promptService.updatePrompt(id, promptData);
      fetchPrompts(); // Refresh the list after updating
      return updatedPrompt;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update prompt. Please try again.');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a prompt
  const deletePrompt = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await promptService.deletePrompt(id);
      fetchPrompts(); // Refresh the list after deleting
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete prompt. Please try again.');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string): Promise<Prompt | null> => {
    setError(null);
    try {
      const updatedPrompt = await promptService.toggleFavorite(id);
      fetchPrompts(); // Refresh the list to show updated favorite status
      return updatedPrompt;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update favorite status. Please try again.');
      console.error(err);
      return null;
    }
  };

  // Effect to fetch prompts when filters change
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Get pagination data
  const paginationData = getClientSidePaginationData();

  return {
    prompts: paginationData.results,
    totalCount: paginationData.count,
    hasNextPage: paginationData.count > (filters.page || 1) * 12,
    hasPreviousPage: (filters.page || 1) > 1,
    isLoading,
    error,
    applyFilters,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    refetch: fetchPrompts,
    filters
  };
};

export default usePrompts; 