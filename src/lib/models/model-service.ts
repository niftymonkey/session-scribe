import type { OpenRouterModel, ParsedModel } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models";
const CACHE_KEY = "openrouter-models-cache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedModels {
  models: ParsedModel[];
  timestamp: number;
}

// Fallback models if OpenRouter is unreachable
const FALLBACK_MODELS: ParsedModel[] = [
  {
    id: "openai/gpt-4o",
    modelId: "gpt-4o",
    name: "GPT-4o",
    contextLength: 128000,
    promptPrice: 2.5,
    completionPrice: 10,
  },
  {
    id: "openai/gpt-4o-mini",
    modelId: "gpt-4o-mini",
    name: "GPT-4o Mini",
    contextLength: 128000,
    promptPrice: 0.15,
    completionPrice: 0.6,
  },
  {
    id: "openai/gpt-4-turbo",
    modelId: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    contextLength: 128000,
    promptPrice: 10,
    completionPrice: 30,
  },
];

function parseOpenRouterModels(rawModels: OpenRouterModel[]): ParsedModel[] {
  return rawModels
    .filter((m) => m.id.startsWith("openai/"))
    .map((m) => ({
      id: m.id,
      modelId: m.id.replace("openai/", ""),
      name: m.name,
      contextLength: m.context_length,
      promptPrice: parseFloat(m.pricing.prompt) * 1_000_000,
      completionPrice: parseFloat(m.pricing.completion) * 1_000_000,
    }))
    .filter((m) => !m.modelId.includes("realtime") && !m.modelId.includes("audio"))
    .sort((a, b) => b.contextLength - a.contextLength);
}

function getCachedModels(): ParsedModel[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { models, timestamp }: CachedModels = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return models;
  } catch {
    return null;
  }
}

function setCachedModels(models: ParsedModel[]): void {
  try {
    const cached: CachedModels = {
      models,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore localStorage errors
  }
}

export async function fetchModels(): Promise<ParsedModel[]> {
  // Check cache first
  const cached = getCachedModels();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(OPENROUTER_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = parseOpenRouterModels(data.data as OpenRouterModel[]);

    if (models.length > 0) {
      setCachedModels(models);
      return models;
    }

    // If no OpenAI models found, use fallback
    return FALLBACK_MODELS;
  } catch (error) {
    console.warn("Failed to fetch models from OpenRouter, using fallback:", error);
    return FALLBACK_MODELS;
  }
}

export function getDefaultModelId(): string {
  return "gpt-4o";
}

export function formatContextLength(length: number): string {
  if (length >= 1_000_000) {
    return `${(length / 1_000_000).toFixed(1)}M`;
  }
  return `${(length / 1000).toFixed(0)}K`;
}

export function formatPrice(price: number): string {
  if (price < 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toFixed(0)}`;
}
