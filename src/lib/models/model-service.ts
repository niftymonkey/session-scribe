import type { OpenRouterModel, ParsedModel } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models";
const CACHE_KEY = "openrouter-models-cache-v2"; // v2: added isRecommended field
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedModels {
  models: ParsedModel[];
  timestamp: number;
}

// Recommendation algorithm constants
const RECOMMENDED_CONTEXT_THRESHOLD = 400_000;
const RECOMMENDED_COUNT = 3;
const WEIGHTS = { recency: 0.45, cost: 0.45, context: 0.1 };

// Fallback models if OpenRouter is unreachable
const FALLBACK_MODELS: ParsedModel[] = [
  {
    id: "openai/gpt-4o",
    modelId: "gpt-4o",
    name: "GPT-4o",
    contextLength: 128000,
    promptPrice: 2.5,
    completionPrice: 10,
    created: 1715299200,
    isRecommended: true,
  },
  {
    id: "openai/gpt-4o-mini",
    modelId: "gpt-4o-mini",
    name: "GPT-4o Mini",
    contextLength: 128000,
    promptPrice: 0.15,
    completionPrice: 0.6,
    created: 1721260800,
    isRecommended: true,
  },
  {
    id: "openai/gpt-4-turbo",
    modelId: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    contextLength: 128000,
    promptPrice: 10,
    completionPrice: 30,
    created: 1699315200,
    isRecommended: true,
  },
];

export function parseOpenRouterModels(rawModels: OpenRouterModel[]): ParsedModel[] {
  return rawModels
    .filter((m) => m.id.startsWith("openai/"))
    .filter((m) => m.architecture?.output_modalities?.includes("text"))
    .map((m) => ({
      id: m.id,
      modelId: m.id.replace("openai/", ""),
      name: m.name,
      contextLength: m.context_length,
      promptPrice: parseFloat(m.pricing.prompt) * 1_000_000,
      completionPrice: parseFloat(m.pricing.completion) * 1_000_000,
      created: m.created ?? 0,
      isRecommended: false,
    }))
    .sort((a, b) => b.contextLength - a.contextLength);
}

export function calculateRecommendationScore(
  model: ParsedModel,
  allModels: ParsedModel[]
): number {
  const createdValues = allModels.map((m) => m.created);
  const contextValues = allModels.map((m) => m.contextLength);
  const priceValues = allModels.map((m) => m.promptPrice);

  const maxCreated = Math.max(...createdValues);
  const minCreated = Math.min(...createdValues);
  const maxContext = Math.max(...contextValues);
  const minContext = Math.min(...contextValues);
  const maxPrice = Math.max(...priceValues);
  const minPrice = Math.min(...priceValues);

  const recencyScore =
    (model.created - minCreated) / (maxCreated - minCreated || 1);
  const contextScore =
    (model.contextLength - minContext) / (maxContext - minContext || 1);
  // Invert cost so cheaper = higher score
  const costScore =
    1 - (model.promptPrice - minPrice) / (maxPrice - minPrice || 1);

  return (
    WEIGHTS.recency * recencyScore +
    WEIGHTS.cost * costScore +
    WEIGHTS.context * contextScore
  );
}

export function markRecommendedModels(models: ParsedModel[]): ParsedModel[] {
  if (models.length === 0) return [];

  // Filter to large context, exclude nano tier
  const candidates = models.filter(
    (m) =>
      m.contextLength >= RECOMMENDED_CONTEXT_THRESHOLD &&
      !m.modelId.includes("nano")
  );

  // Score and sort
  const scored = candidates
    .map((m) => ({ model: m, score: calculateRecommendationScore(m, candidates) }))
    .sort((a, b) => b.score - a.score);

  // Top 3 are recommended
  const recommendedIds = new Set(
    scored.slice(0, RECOMMENDED_COUNT).map((s) => s.model.id)
  );

  return models.map((m) => ({
    ...m,
    isRecommended: recommendedIds.has(m.id),
  }));
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
    const parsed = parseOpenRouterModels(data.data as OpenRouterModel[]);
    const models = markRecommendedModels(parsed);

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
