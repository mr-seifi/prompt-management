export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  detectedVariables?: string[] | string;
  variablesSchema?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PromptFormData = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>;

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface PromptFilters {
  search?: string;
  tags?: string[];
  favorites?: boolean;
  sortBy?: keyof Prompt;
  sortOrder?: SortOrder;
  page?: number;
} 