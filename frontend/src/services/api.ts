import { Prompt, PromptFilters, PromptFormData, SortOrder } from '../types';

// Mock data for development
const mockPrompts: Prompt[] = [
  {
    id: '1',
    title: 'Creative Story Starter',
    content: 'Write a short story about a character who discovers they have an unusual ability one ordinary morning.',
    tags: ['creative writing', 'fiction', 'storytelling'],
    isFavorite: true,
    createdAt: new Date('2023-05-10').toISOString(),
    updatedAt: new Date('2023-07-15').toISOString(),
  },
  {
    id: '2',
    title: 'Product Description Generator',
    content: 'Create a compelling product description for a new smartphone that emphasizes its innovative features and benefits.',
    tags: ['marketing', 'copywriting', 'product'],
    isFavorite: false,
    createdAt: new Date('2023-06-22').toISOString(),
    updatedAt: new Date('2023-06-22').toISOString(),
  },
  {
    id: '3',
    title: 'Problem-Solution Essay Outline',
    content: 'Outline a problem-solution essay addressing the challenge of plastic pollution in oceans, including causes, effects, and potential solutions.',
    tags: ['academic', 'research', 'environment'],
    isFavorite: true,
    createdAt: new Date('2023-04-03').toISOString(),
    updatedAt: new Date('2023-08-01').toISOString(),
  },
  {
    id: '4',
    title: 'Character Development Questions',
    content: 'Create a detailed character profile by answering the following questions: What is their greatest fear? What do they want more than anything? What event from their past shaped them most? What is their greatest strength and weakness?',
    tags: ['character development', 'fiction', 'writing'],
    isFavorite: false,
    createdAt: new Date('2023-02-15').toISOString(),
    updatedAt: new Date('2023-05-20').toISOString(),
  },
  {
    id: '5',
    title: 'Blog Post Introduction Hooks',
    content: 'Generate five different attention-grabbing introductions for a blog post about sustainable living practices that anyone can adopt.',
    tags: ['blogging', 'writing', 'content creation'],
    isFavorite: true,
    createdAt: new Date('2023-07-01').toISOString(),
    updatedAt: new Date('2023-07-02').toISOString(),
  }
];

// Helper to simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock API service
export const promptsApi = {
  // Get all prompts with optional filtering
  getPrompts: async (filters: PromptFilters = {}): Promise<Prompt[]> => {
    await delay(500); // Simulate network delay
    
    let filteredPrompts = [...mockPrompts];
    
    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPrompts = filteredPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchLower) || 
        prompt.content.toLowerCase().includes(searchLower) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(prompt => 
        filters.tags!.some(tag => prompt.tags.includes(tag))
      );
    }
    
    if (filters.favorites) {
      filteredPrompts = filteredPrompts.filter(prompt => prompt.isFavorite);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      filteredPrompts.sort((a, b) => {
        const sortOrder = filters.sortOrder === SortOrder.DESC ? -1 : 1;
        
        switch (filters.sortBy) {
          case 'title':
            return sortOrder * a.title.localeCompare(b.title);
          case 'createdAt':
            return sortOrder * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'updatedAt':
            return sortOrder * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
          default:
            return 0;
        }
      });
    }
    
    return filteredPrompts;
  },
  
  // Get a single prompt by ID
  getPrompt: async (id: string): Promise<Prompt | null> => {
    await delay(300);
    const prompt = mockPrompts.find(p => p.id === id);
    return prompt || null;
  },
  
  // Create a new prompt
  createPrompt: async (promptData: PromptFormData): Promise<Prompt> => {
    await delay(600);
    const newPrompt: Prompt = {
      id: generateId(),
      title: promptData.title,
      content: promptData.content,
      tags: promptData.tags || [],
      isFavorite: promptData.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockPrompts.push(newPrompt);
    return newPrompt;
  },
  
  // Update an existing prompt
  updatePrompt: async (id: string, promptData: PromptFormData): Promise<Prompt | null> => {
    await delay(500);
    const promptIndex = mockPrompts.findIndex(p => p.id === id);
    
    if (promptIndex === -1) return null;
    
    const updatedPrompt: Prompt = {
      ...mockPrompts[promptIndex],
      title: promptData.title,
      content: promptData.content,
      tags: promptData.tags || mockPrompts[promptIndex].tags,
      isFavorite: promptData.isFavorite !== undefined ? promptData.isFavorite : mockPrompts[promptIndex].isFavorite,
      updatedAt: new Date().toISOString(),
    };
    
    mockPrompts[promptIndex] = updatedPrompt;
    return updatedPrompt;
  },
  
  // Delete a prompt
  deletePrompt: async (id: string): Promise<boolean> => {
    await delay(400);
    const promptIndex = mockPrompts.findIndex(p => p.id === id);
    
    if (promptIndex === -1) return false;
    
    mockPrompts.splice(promptIndex, 1);
    return true;
  },
  
  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<Prompt | null> => {
    await delay(300);
    const promptIndex = mockPrompts.findIndex(p => p.id === id);
    
    if (promptIndex === -1) return null;
    
    const updatedPrompt: Prompt = {
      ...mockPrompts[promptIndex],
      isFavorite: !mockPrompts[promptIndex].isFavorite,
      updatedAt: new Date().toISOString(),
    };
    
    mockPrompts[promptIndex] = updatedPrompt;
    return updatedPrompt;
  }
}; 