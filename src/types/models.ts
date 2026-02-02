export interface OpenRouterModel {
  id: string; // e.g., "openai/gpt-4o"
  name: string; // e.g., "GPT-4o"
  context_length: number;
  created?: number; // Unix timestamp
  pricing: {
    prompt: string; // Cost per 1M tokens
    completion: string;
  };
  architecture?: {
    output_modalities?: string[];
  };
}

export interface ParsedModel {
  id: string; // OpenRouter ID: "openai/gpt-4o"
  modelId: string; // OpenAI SDK ID: "gpt-4o"
  name: string;
  contextLength: number;
  promptPrice: number; // Per 1M tokens
  completionPrice: number;
  created: number; // Unix timestamp
  isRecommended: boolean;
}
