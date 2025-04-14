import { Prompt } from './types';

// Generate a random ID
const generateId = (): string => {
  return Math.floor(Math.random() * 10000 + 1).toString();
};

// Generate random date within the last month
const generateDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  return date.toISOString();
};

// Sample prompt templates
const promptTemplates = [
  {
    template: "Write a short story about a {{character_type}} who can only solve crimes by {{method}}.",
    variables: { 
      character_type: { type: "string", description: "Type of character (e.g., detective, journalist)" },
      method: { type: "string", description: "Unusual method for solving crimes" }
    }
  },
  {
    template: "Create a poem about the feeling of {{emotion}} when {{situation}}.",
    variables: { 
      emotion: { type: "string", description: "The primary emotion" },
      situation: { type: "string", description: "Specific situation causing the emotion" }
    }
  },
  {
    template: "Describe a world where {{phenomenon}} works {{differently}} for {{time_period}} each day.",
    variables: { 
      phenomenon: { type: "string", description: "Natural phenomenon" },
      differently: { type: "string", description: "How it works differently" },
      time_period: { type: "string", description: "Period of time" }
    }
  },
  {
    template: "Write a dialog between two people who {{situation}}.",
    variables: { 
      situation: { type: "string", description: "Unusual situation for the conversation" }
    }
  },
  {
    template: "Develop a character who has the ability to {{superpower}}, but only when {{condition}}.",
    variables: { 
      superpower: { type: "string", description: "Special ability" },
      condition: { type: "string", description: "Condition that triggers the ability" } 
    }
  },
];

// Generate mock prompts
export const generateMockPrompts = (count: number = 10): Prompt[] => {
  return Array(count)
    .fill(null)
    .map((_, index) => {
      const templateIndex = index % promptTemplates.length;
      const template = promptTemplates[templateIndex];
      const createdAt = generateDate();
      const updatedAt = new Date(new Date(createdAt).getTime() + Math.random() * 86400000).toISOString();
      const variableKeys = Object.keys(template.variables);
      
      return {
        id: generateId(),
        title: `Prompt ${index + 1}`,
        content: template.template,
        tags: ["sample", `type-${index % 3}`],
        variablesSchema: template.variables,
        detectedVariables: variableKeys.join(','),
        isFavorite: Math.random() > 0.7,
        createdAt,
        updatedAt,
      };
    });
};

// Export a pre-generated set of mock prompts
export const mockPrompts: Prompt[] = generateMockPrompts(10); 