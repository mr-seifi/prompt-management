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

// Helper function to check if a date string is valid
const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Helper function to format a date string - exportable utility function
export const formatDate = (dateString: string | null | undefined): string => {
  if (!isValidDate(dateString)) return 'N/A';
  
  try {
    // Parse the ISO date string into a Date object
    const date = new Date(dateString as string);
    
    // Format as a readable string (e.g., "Jan 15, 2023, 3:27 PM")
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'N/A'; // Return original string if formatting fails
  }
};

// Format only the date portion (without time)
export const formatDateOnly = (dateString: string | null | undefined): string => {
  if (!isValidDate(dateString)) return 'N/A';
  
  try {
    // Parse the ISO date string into a Date object
    const date = new Date(dateString as string);
    
    // Format as a readable date string (e.g., "Jan 15, 2023")
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'N/A';
  }
};

// Format only the time portion
export const formatTimeOnly = (dateString: string | null | undefined): string => {
  if (!isValidDate(dateString)) return 'N/A';
  
  try {
    // Parse the ISO date string into a Date object
    const date = new Date(dateString as string);
    
    // Format as a readable time string (e.g., "3:27 PM")
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
};

// Format for displaying "time ago" (e.g., "2 hours ago", "3 days ago")
export const formatTimeAgo = (dateString: string | null | undefined): string => {
  if (!isValidDate(dateString)) return 'N/A';
  
  try {
    const date = new Date(dateString as string);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      // For older dates, return the formatted date
      return formatDate(dateString);
    }
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return dateString || 'N/A';
  }
};

// Format date and time for the All Prompts list view
export const formatDateTimeForDisplay = (dateString: string | null | undefined): string => {
  if (!isValidDate(dateString)) return 'N/A';
  
  try {
    const date = new Date(dateString as string);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // Format the time portion
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // If the date is today, just show "Today at [time]"
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    
    // Check if date is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    }
    
    // For older dates, show date and time
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    });
    
    return `${dateStr} at ${timeStr}`;
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateString || 'N/A';
  }
};

// Helper function to transform backend data (description) to frontend format (content)
const transformPromptFromBackend = (backendPrompt: any): Prompt => {
  // Extract the fields we need from the backend data
  const {
    description,
    favorite,
    created_at,
    updated_at,
    ...otherFields
  } = backendPrompt;
  
  // Log the date fields for debugging
  if (environment !== 'production') {
    console.log('Backend date fields:', { 
      created_at, 
      updated_at, 
      created_at_valid: isValidDate(created_at),
      updated_at_valid: isValidDate(updated_at)
    });
  }
  
  // Create a new prompt object with the correct field mappings
  return {
    ...otherFields,
    content: description, // Map description to content for frontend
    isFavorite: favorite ?? false, // Map favorite to isFavorite with fallback
    createdAt: created_at || '', // Keep original ISO date string for createdAt
    updatedAt: updated_at || '', // Keep original ISO date string for updatedAt
  } as Prompt;
};

// Helper function to transform frontend data (content) to backend format (description)
const transformPromptToBackend = (frontendData: PromptFormData): any => {
  // Extract the fields we need from the frontend data
  const {
    content,
    isFavorite,
    ...otherFields
  } = frontendData;
  
  // Create a new data object with the correct field mappings
  return {
    ...otherFields,
    description: content, // Map content to description for the backend
    favorite: isFavorite, // Map isFavorite to favorite for backend
  };
};

// Prompt service for interacting with the API
const promptService = {
  // Get all prompts with optional filtering
  getPrompts: async (filters: PromptFilters = {}): Promise<PaginatedResponse<Prompt>> => {
    const params: Record<string, any> = {};
    
    if (filters.search) params.search = filters.search;
    
    // Map camelCase field names to snake_case for ordering
    if (filters.sortBy) {
      // Convert camelCase to snake_case for backend field names
      const backendFieldMapping: Record<string, string> = {
        'updatedAt': 'updated_at',
        'createdAt': 'created_at',
        'isFavorite': 'favorite'
      };
      
      // Use the mapped field name if available, otherwise use the original
      const backendField = backendFieldMapping[filters.sortBy] || filters.sortBy;
      params.ordering = filters.sortOrder === SortOrder.DESC ? `-${backendField}` : backendField;
    }
    
    if ('page' in filters && filters.page !== undefined) params.page = filters.page;
    // Add filter for favorites
    if (filters.favorites) params.favorite = true;
    
    console.log('API Request params:', params);
    
    const response = await axiosInstance.get<PaginatedResponse<any>>(PROMPTS_URL, { params });
    
    // Transform each prompt from backend format to frontend format
    const transformedResponse: PaginatedResponse<Prompt> = {
      ...response.data,
      results: response.data.results.map(transformPromptFromBackend)
    };
    
    return transformedResponse;
  },
  
  // Get a single prompt by ID
  getPrompt: async (id: string): Promise<Prompt | null> => {
    try {
      console.log(`API request: Getting prompt ${id}`);
      const response = await axiosInstance.get<any>(`${PROMPTS_URL}${id}/`);
      console.log(`API response: Prompt ${id} found`, response.data);
      
      // Transform from backend format to frontend format
      return transformPromptFromBackend(response.data);
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
      
      // Transform from frontend format to backend format
      const apiData = transformPromptToBackend(promptData);
      
      const response = await axiosInstance.post<any>(PROMPTS_URL, apiData);
      
      console.log('Prompt created successfully, API response:', {
        status: response.status,
        data: response.data
      });
      
      // Transform from backend format to frontend format for the return value
      return transformPromptFromBackend(response.data);
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
      
      // Transform from frontend format to backend format
      const apiData = transformPromptToBackend(promptData as PromptFormData);
      
      const response = await axiosInstance.patch<any>(`${PROMPTS_URL}${id}/`, apiData);
      
      console.log(`Prompt ${id} updated successfully:`, response.data);
      
      // Transform from backend format to frontend format for the return value
      return transformPromptFromBackend(response.data);
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
      const response = await axiosInstance.patch<any>(`${PROMPTS_URL}${id}/toggle_favorite/`, {});
      console.log(`Favorite status toggled for prompt ${id}:`, response.data);
      
      // Transform from backend format to frontend format
      return transformPromptFromBackend(response.data);
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