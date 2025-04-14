import axios from 'axios';
import { 
  Prompt, 
  PromptFormData,
  PromptFilters,
  SortOrder
} from '../types';

// Define the types we need if not exported from types
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface PromptRenderRequest {
  variable_values: Record<string, any>;
}

interface PromptRenderResponse {
  prompt_id: string;
  title: string;
  original_template: string;
  rendered_text: string;
  variables_used: Record<string, any>;
}

// Determine which API URL to use based on environment
const environment = process.env.REACT_APP_ENVIRONMENT || 'development';
const API_URL = environment === 'production' 
  ? process.env.REACT_APP_PRODUCTION_API_URL  // Use production URL
  : process.env.REACT_APP_API_URL || 'http://localhost:8000/api';  // Fallback to local URL

console.log(`Using API URL: ${API_URL} (${environment} environment)`);

const PROMPTS_URL = `${API_URL}/prompts/`;

// Create axios instance with authorization header
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development but not in production
    if (environment !== 'production') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Prompt service for interacting with the API
const promptService = {
  // Get all prompts with optional filtering
  getPrompts: async (filters: PromptFilters = {}): Promise<PaginatedResponse<Prompt>> => {
    const params: Record<string, any> = {};
    
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) params.ordering = filters.sortOrder === SortOrder.DESC ? `-${filters.sortBy}` : filters.sortBy;
    if ('page' in filters && filters.page !== undefined) params.page = filters.page;
    
    const response = await axiosInstance.get<PaginatedResponse<Prompt>>(PROMPTS_URL, { params });
    return response.data;
  },
  
  // Get a single prompt by ID
  getPrompt: async (id: string): Promise<Prompt | null> => {
    try {
      console.log(`API request: Getting prompt ${id}`);
      const response = await axiosInstance.get<Prompt>(`${PROMPTS_URL}${id}/`);
      console.log(`API response: Prompt ${id} found`, response.data);
      return response.data;
    } catch (error: any) {
      // If it's a 404 error, return null instead of throwing
      if (error.response && error.response.status === 404) {
        console.log(`API error: Prompt ${id} not found (404)`);
        return null;
      }
      
      // For other errors, log and rethrow
      console.error(`API error: Failed to get prompt ${id}`, error);
      throw error;
    }
  },
  
  // Create a new prompt
  createPrompt: async (promptData: PromptFormData): Promise<Prompt> => {
    try {
      console.log('POST request to create prompt:', {
        url: PROMPTS_URL,
        data: promptData
      });
      
      // Validate promptData before sending to API
      if (!promptData.title || !promptData.content) {
        throw new Error('Title and content are required.');
      }
      
      const response = await axiosInstance.post<Prompt>(PROMPTS_URL, promptData);
      
      console.log('Prompt created successfully, API response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating prompt:', error);
      
      // Handle different types of errors and provide meaningful messages
      if (error.response) {
        // Server responded with an error status
        const message = error.response.data?.detail || 
                         error.response.data?.message || 
                         `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request
        throw error;
      }
    }
  },
  
  // Update an existing prompt
  updatePrompt: async (id: string, promptData: Partial<PromptFormData>): Promise<Prompt> => {
    try {
      console.log(`PATCH request to update prompt ${id}:`, {
        url: `${PROMPTS_URL}${id}/`,
        data: promptData
      });
      
      const response = await axiosInstance.patch<Prompt>(`${PROMPTS_URL}${id}/`, promptData);
      
      console.log(`Prompt ${id} updated successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating prompt ${id}:`, error);
      
      if (error.response) {
        const message = error.response.data?.detail || 
                        error.response.data?.message || 
                        `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw error;
      }
    }
  },
  
  // Delete a prompt
  deletePrompt: async (id: string): Promise<void> => {
    try {
      console.log(`DELETE request for prompt ${id}`);
      await axiosInstance.delete(`${PROMPTS_URL}${id}/`);
      console.log(`Prompt ${id} deleted successfully`);
    } catch (error: any) {
      console.error(`Error deleting prompt ${id}:`, error);
      
      if (error.response) {
        const message = error.response.data?.detail || 
                        error.response.data?.message || 
                        `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw error;
      }
    }
  },
  
  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<Prompt> => {
    try {
      console.log(`PATCH request to toggle favorite for prompt ${id}`);
      const response = await axiosInstance.patch<Prompt>(`${PROMPTS_URL}${id}/toggle_favorite/`, {});
      console.log(`Favorite status toggled for prompt ${id}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error toggling favorite for prompt ${id}:`, error);
      
      if (error.response) {
        const message = error.response.data?.detail || 
                        error.response.data?.message || 
                        `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw error;
      }
    }
  },
  
  // Get variables for a prompt
  getVariables: async (id: string): Promise<string[]> => {
    try {
      console.log(`GET request for variables of prompt ${id}`);
      const response = await axiosInstance.get<{prompt_id: string, title: string, variables: Record<string, any>}>(`${PROMPTS_URL}${id}/variables/`);
      console.log(`Variables retrieved for prompt ${id}:`, response.data);
      
      // The variables endpoint returns a different structure: { prompt_id, title, variables }
      if (response.data.variables) {
        // Extract variable names from the variables object
        return Object.keys(response.data.variables);
      }
      return [];
    } catch (error: any) {
      console.error(`Error getting variables for prompt ${id}:`, error);
      return [];
    }
  },
  
  // Render a prompt with variable values
  renderPrompt: async (id: string, data: PromptRenderRequest): Promise<PromptRenderResponse> => {
    try {
      console.log(`POST request to render prompt ${id}:`, data);
      
      // Rename key to match the API's expected format if needed
      const requestData = {
        // Backend might expect variables_values instead of variable_values
        variables_values: data.variable_values
      };
      
      const response = await axiosInstance.post<PromptRenderResponse>(`${PROMPTS_URL}${id}/render/`, requestData);
      console.log(`Prompt ${id} rendered successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error rendering prompt ${id}:`, error);
      
      if (error.response) {
        const message = error.response.data?.detail || 
                        error.response.data?.message || 
                        `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw error;
      }
    }
  }
};

export default promptService; 