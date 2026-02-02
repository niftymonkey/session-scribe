import { describe, it, expect } from "vitest";
import type { OpenRouterModel, ParsedModel } from "@/types";
import {
  parseOpenRouterModels,
  calculateRecommendationScore,
  markRecommendedModels,
  formatContextLength,
  formatPrice,
} from "./model-service";

// Helper to create test OpenRouterModel
function createOpenRouterModel(
  overrides: Partial<OpenRouterModel> = {}
): OpenRouterModel {
  return {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    context_length: 128000,
    created: 1700000000,
    pricing: { prompt: "0.0000025", completion: "0.00001" },
    architecture: { output_modalities: ["text"] },
    ...overrides,
  };
}

// Helper to create test ParsedModel
function createParsedModel(overrides: Partial<ParsedModel> = {}): ParsedModel {
  return {
    id: "openai/gpt-4o",
    modelId: "gpt-4o",
    name: "GPT-4o",
    contextLength: 128000,
    promptPrice: 2.5,
    completionPrice: 10,
    created: 1700000000,
    isRecommended: false,
    ...overrides,
  };
}

describe("parseOpenRouterModels", () => {
  it("filters to text-capable models using output_modalities", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({
        id: "openai/gpt-4o",
        architecture: { output_modalities: ["text"] },
      }),
      createOpenRouterModel({
        id: "openai/gpt-4o-mini",
        architecture: { output_modalities: ["text"] },
      }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result).toHaveLength(2);
  });

  it("excludes models without text in output_modalities", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({
        id: "openai/gpt-4o",
        architecture: { output_modalities: ["text"] },
      }),
      createOpenRouterModel({
        id: "openai/dall-e-3",
        architecture: { output_modalities: ["image"] },
      }),
      createOpenRouterModel({
        id: "openai/tts-1",
        architecture: { output_modalities: ["audio"] },
      }),
      createOpenRouterModel({
        id: "openai/whisper",
        architecture: { output_modalities: [] },
      }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("openai/gpt-4o");
  });

  it("excludes models without architecture metadata", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({
        id: "openai/gpt-4o",
        architecture: { output_modalities: ["text"] },
      }),
      createOpenRouterModel({
        id: "openai/unknown-model",
        architecture: undefined,
      }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("openai/gpt-4o");
  });

  it("parses created timestamp", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({
        id: "openai/gpt-4o",
        created: 1715000000,
      }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result[0].created).toBe(1715000000);
  });

  it("handles missing created timestamp with default value", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({
        id: "openai/gpt-4o",
        created: undefined,
      }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result[0].created).toBe(0);
  });

  it("only includes openai models", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({ id: "openai/gpt-4o" }),
      createOpenRouterModel({ id: "anthropic/claude-3" }),
      createOpenRouterModel({ id: "google/gemini-pro" }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("openai/gpt-4o");
  });

  it("sorts by context length descending", () => {
    const models: OpenRouterModel[] = [
      createOpenRouterModel({ id: "openai/small", context_length: 8000 }),
      createOpenRouterModel({ id: "openai/large", context_length: 128000 }),
      createOpenRouterModel({ id: "openai/medium", context_length: 32000 }),
    ];

    const result = parseOpenRouterModels(models);
    expect(result[0].contextLength).toBe(128000);
    expect(result[1].contextLength).toBe(32000);
    expect(result[2].contextLength).toBe(8000);
  });
});

describe("calculateRecommendationScore", () => {
  it("scores newer models higher (recency weight)", () => {
    // Models with same price and context to isolate recency
    const oldModel = createParsedModel({
      id: "openai/old",
      created: 1700000000,
      promptPrice: 5,
      contextLength: 500000,
    });
    const newModel = createParsedModel({
      id: "openai/new",
      created: 1720000000,
      promptPrice: 5,
      contextLength: 500000,
    });

    const models = [oldModel, newModel];
    const oldScore = calculateRecommendationScore(oldModel, models);
    const newScore = calculateRecommendationScore(newModel, models);

    expect(newScore).toBeGreaterThan(oldScore);
  });

  it("scores cheaper models higher (cost weight)", () => {
    const cheapModel = createParsedModel({
      id: "openai/cheap",
      created: 1710000000,
      promptPrice: 1,
      contextLength: 400000,
    });
    const expensiveModel = createParsedModel({
      id: "openai/expensive",
      created: 1710000000,
      promptPrice: 10,
      contextLength: 400000,
    });

    const models = [cheapModel, expensiveModel];
    const cheapScore = calculateRecommendationScore(cheapModel, models);
    const expensiveScore = calculateRecommendationScore(expensiveModel, models);

    expect(cheapScore).toBeGreaterThan(expensiveScore);
  });

  it("scores larger context models higher (context weight)", () => {
    const smallContext = createParsedModel({
      id: "openai/small",
      created: 1710000000,
      promptPrice: 5,
      contextLength: 400000,
    });
    const largeContext = createParsedModel({
      id: "openai/large",
      created: 1710000000,
      promptPrice: 5,
      contextLength: 1000000,
    });

    const models = [smallContext, largeContext];
    const smallScore = calculateRecommendationScore(smallContext, models);
    const largeScore = calculateRecommendationScore(largeContext, models);

    expect(largeScore).toBeGreaterThan(smallScore);
  });

  it("applies correct weights: 45% recency, 45% cost, 10% context", () => {
    // Model with perfect recency and cost, zero context advantage
    const perfectRecencyCost = createParsedModel({
      id: "openai/perfect-rc",
      created: 1720000000, // newest
      promptPrice: 1, // cheapest
      contextLength: 400000, // smallest
    });

    // Model with perfect context, zero recency and cost advantage
    const perfectContext = createParsedModel({
      id: "openai/perfect-ctx",
      created: 1700000000, // oldest
      promptPrice: 10, // most expensive
      contextLength: 1000000, // largest
    });

    const models = [perfectRecencyCost, perfectContext];

    const rcScore = calculateRecommendationScore(perfectRecencyCost, models);
    const ctxScore = calculateRecommendationScore(perfectContext, models);

    // Perfect recency+cost (45%+45%=90%) should beat perfect context (10%)
    expect(rcScore).toBeGreaterThan(ctxScore);
    // Score difference should roughly reflect the 90% vs 10% weight
    expect(rcScore).toBeCloseTo(0.9, 1);
    expect(ctxScore).toBeCloseTo(0.1, 1);
  });

  it("handles single model case without division by zero", () => {
    const singleModel = createParsedModel();
    const models = [singleModel];

    const score = calculateRecommendationScore(singleModel, models);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
    expect(Number.isFinite(score)).toBe(true);
  });
});

describe("markRecommendedModels", () => {
  it("excludes models with less than 400K context from recommendations", () => {
    const models: ParsedModel[] = [
      createParsedModel({
        id: "openai/large-context",
        contextLength: 500000,
        created: 1720000000,
        promptPrice: 1,
      }),
      createParsedModel({
        id: "openai/small-context",
        contextLength: 128000,
        created: 1720000000,
        promptPrice: 1,
      }),
    ];

    const result = markRecommendedModels(models);
    const recommended = result.filter((m) => m.isRecommended);

    expect(recommended).toHaveLength(1);
    expect(recommended[0].id).toBe("openai/large-context");
  });

  it("excludes nano tier models from recommendations", () => {
    const models: ParsedModel[] = [
      createParsedModel({
        id: "openai/gpt-4o",
        modelId: "gpt-4o",
        contextLength: 500000,
        created: 1720000000,
        promptPrice: 1,
      }),
      createParsedModel({
        id: "openai/gpt-4o-nano",
        modelId: "gpt-4o-nano",
        contextLength: 500000,
        created: 1720000000,
        promptPrice: 0.5,
      }),
    ];

    const result = markRecommendedModels(models);
    const recommended = result.filter((m) => m.isRecommended);

    expect(recommended).toHaveLength(1);
    expect(recommended[0].id).toBe("openai/gpt-4o");
    expect(recommended.some((m) => m.modelId.includes("nano"))).toBe(false);
  });

  it("marks exactly 3 models as recommended when enough candidates exist", () => {
    const models: ParsedModel[] = [
      createParsedModel({
        id: "openai/model-1",
        contextLength: 500000,
        created: 1720000000,
        promptPrice: 1,
      }),
      createParsedModel({
        id: "openai/model-2",
        contextLength: 500000,
        created: 1719000000,
        promptPrice: 2,
      }),
      createParsedModel({
        id: "openai/model-3",
        contextLength: 500000,
        created: 1718000000,
        promptPrice: 3,
      }),
      createParsedModel({
        id: "openai/model-4",
        contextLength: 500000,
        created: 1717000000,
        promptPrice: 4,
      }),
      createParsedModel({
        id: "openai/model-5",
        contextLength: 500000,
        created: 1716000000,
        promptPrice: 5,
      }),
    ];

    const result = markRecommendedModels(models);
    const recommended = result.filter((m) => m.isRecommended);

    expect(recommended).toHaveLength(3);
  });

  it("marks fewer than 3 models when not enough candidates exist", () => {
    const models: ParsedModel[] = [
      createParsedModel({
        id: "openai/model-1",
        contextLength: 500000,
        created: 1720000000,
      }),
      createParsedModel({
        id: "openai/model-2",
        contextLength: 100000, // Below threshold
        created: 1720000000,
      }),
    ];

    const result = markRecommendedModels(models);
    const recommended = result.filter((m) => m.isRecommended);

    expect(recommended).toHaveLength(1);
  });

  it("recommends highest-scoring models", () => {
    const models: ParsedModel[] = [
      createParsedModel({
        id: "openai/best",
        contextLength: 1000000,
        created: 1720000000,
        promptPrice: 1,
      }),
      createParsedModel({
        id: "openai/good",
        contextLength: 800000,
        created: 1718000000,
        promptPrice: 2,
      }),
      createParsedModel({
        id: "openai/okay",
        contextLength: 600000,
        created: 1716000000,
        promptPrice: 3,
      }),
      createParsedModel({
        id: "openai/worst",
        contextLength: 400000,
        created: 1714000000,
        promptPrice: 10,
      }),
    ];

    const result = markRecommendedModels(models);
    const recommended = result.filter((m) => m.isRecommended);
    const recommendedIds = recommended.map((m) => m.id);

    // Best 3 should be recommended, worst should not
    expect(recommendedIds).toContain("openai/best");
    expect(recommendedIds).toContain("openai/good");
    expect(recommendedIds).toContain("openai/okay");
    expect(recommendedIds).not.toContain("openai/worst");
  });

  it("preserves all models in output (not just recommended)", () => {
    const models: ParsedModel[] = [
      createParsedModel({ id: "openai/recommended", contextLength: 500000 }),
      createParsedModel({
        id: "openai/not-recommended",
        contextLength: 100000,
      }),
    ];

    const result = markRecommendedModels(models);

    expect(result).toHaveLength(2);
    expect(result.find((m) => m.id === "openai/not-recommended")).toBeDefined();
  });

  it("handles empty input", () => {
    const result = markRecommendedModels([]);
    expect(result).toEqual([]);
  });
});

describe("formatContextLength", () => {
  it("formats thousands as K", () => {
    expect(formatContextLength(128000)).toBe("128K");
    expect(formatContextLength(8000)).toBe("8K");
    expect(formatContextLength(16000)).toBe("16K");
  });

  it("formats millions as M with one decimal", () => {
    expect(formatContextLength(1000000)).toBe("1.0M");
    expect(formatContextLength(1048576)).toBe("1.0M");
    expect(formatContextLength(2000000)).toBe("2.0M");
  });

  it("handles edge case at 1M boundary", () => {
    expect(formatContextLength(999999)).toBe("1000K");
    expect(formatContextLength(1000000)).toBe("1.0M");
  });
});

describe("formatPrice", () => {
  it("formats prices under $1 with two decimals", () => {
    expect(formatPrice(0.15)).toBe("$0.15");
    expect(formatPrice(0.05)).toBe("$0.05");
    expect(formatPrice(0.99)).toBe("$0.99");
  });

  it("formats prices $1 and over as whole dollars", () => {
    expect(formatPrice(1)).toBe("$1");
    expect(formatPrice(2.5)).toBe("$3");
    expect(formatPrice(10)).toBe("$10");
    expect(formatPrice(150)).toBe("$150");
  });

  it("handles edge case at $1 boundary", () => {
    expect(formatPrice(0.99)).toBe("$0.99");
    expect(formatPrice(1)).toBe("$1");
  });
});

describe("visual validation - LIVE OpenRouter data", () => {
  it("shows actual OpenRouter OpenAI models with filtering and recommendations", async () => {
    // Fetch real data from OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/models");
    const data = await response.json();
    const rawModels = data.data as OpenRouterModel[];

    // Get only OpenAI models for comparison
    const openaiModels = rawModels.filter((m) => m.id.startsWith("openai/"));

    // Step 1: Parse and filter
    const parsedModels = parseOpenRouterModels(rawModels);

    console.log("\n" + "=".repeat(60));
    console.log("LIVE OPENROUTER DATA - FILTERING RESULTS");
    console.log("=".repeat(60));
    console.log(`Total OpenAI models from API: ${openaiModels.length}`);
    console.log(`After text-only filtering: ${parsedModels.length} models`);

    console.log("\n--- FILTERED OUT (non-text models) ---");
    const filteredOut = openaiModels.filter(
      (m) => !parsedModels.some((p) => p.id === m.id)
    );
    filteredOut.forEach((m) => {
      const modalities = m.architecture?.output_modalities?.join(", ") || "none";
      console.log(`  - ${m.name} [${modalities}]`);
    });

    // Step 2: Mark recommendations
    const withRecommendations = markRecommendedModels(parsedModels);
    const recommended = withRecommendations.filter((m) => m.isRecommended);
    const candidates = withRecommendations.filter(
      (m) => m.contextLength >= 400000 && !m.modelId.includes("nano")
    );

    console.log("\n" + "=".repeat(60));
    console.log("RECOMMENDATION RESULTS");
    console.log("=".repeat(60));
    console.log(`Eligible candidates (400K+ context, no nano): ${candidates.length}`);
    console.log(`Recommended (top 3 by score): ${recommended.length}`);

    console.log("\n--- RECOMMENDED MODELS ---");
    recommended.forEach((m, i) => {
      const score = calculateRecommendationScore(m, candidates);
      const date = new Date(m.created * 1000).toLocaleDateString();
      console.log(
        `  ${i + 1}. ${m.name.padEnd(25)} | ${(m.contextLength / 1000).toFixed(0).padStart(5)}K ctx | $${m.promptPrice.toFixed(2).padStart(6)}/1M | ${date} | score: ${score.toFixed(3)}`
      );
    });

    console.log("\n--- ALL MODELS (sorted by context) ---");
    withRecommendations.forEach((m) => {
      const meetsContextReq = m.contextLength >= 400000;
      const isNano = m.modelId.includes("nano");
      let status = "";
      if (m.isRecommended) status = "[RECOMMENDED]";
      else if (!meetsContextReq) status = "(< 400K ctx)";
      else if (isNano) status = "(nano tier)";
      else status = "(not top 3)";

      const date = new Date(m.created * 1000).toLocaleDateString();
      console.log(
        `  ${m.name.padEnd(35)} | ${(m.contextLength / 1000).toFixed(0).padStart(5)}K ctx | $${m.promptPrice.toFixed(2).padStart(6)}/1M | ${date} ${status}`
      );
    });

    console.log("\n" + "=".repeat(60));

    // Assertions - don't assume filtering removes models since API behavior may change
    expect(parsedModels.length).toBeGreaterThan(0);
    expect(recommended.length).toBeLessThanOrEqual(3);
    expect(recommended.every((m) => m.contextLength >= 400000)).toBe(true);
    expect(recommended.every((m) => !m.modelId.includes("nano"))).toBe(true);
  }, 10000); // 10 second timeout for network request
});
