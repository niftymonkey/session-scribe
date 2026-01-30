import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type {
  TranscriptData,
  TranscriptEntry,
  PlayerConfig,
  SessionRecap,
  RecapGenerationProgress,
  DiscoveredScene,
  SceneDetails,
} from "@/types";
import { getSystemPromptWithContext } from "../prompts/system-prompt";
import { buildPass1Prompt, buildPass2Prompt, buildPass3Prompt } from "../prompts/multi-pass";
import { Pass1Schema, Pass2Schema, Pass3Schema } from "./schemas";
import { getDefaultModelId } from "../models/model-service";

const PASS2_CONCURRENCY = 3;
const PARALLEL_THRESHOLD = 10; // Process all in parallel if <= this many scenes

/**
 * Filter transcript entries to only those within a scene's timestamp range
 */
function extractSceneEntries(
  entries: TranscriptEntry[],
  scene: DiscoveredScene
): TranscriptEntry[] {
  return entries.filter(
    (entry) =>
      entry.timestampSeconds >= scene.startTimestampSeconds &&
      entry.timestampSeconds <= scene.endTimestampSeconds
  );
}

/**
 * Pass 1: Discover scene boundaries
 */
async function runPass1(
  model: ReturnType<ReturnType<typeof createOpenAI>>,
  systemPrompt: string,
  entries: TranscriptEntry[],
  sessionTitle: string,
  playerMap: PlayerConfig[],
  onProgress?: (progress: RecapGenerationProgress) => void
): Promise<DiscoveredScene[]> {
  onProgress?.({
    stage: "summarizing",
    passName: "discovery",
    message: "Pass 1: Discovering scene boundaries...",
  });

  const prompt = buildPass1Prompt(entries, sessionTitle, playerMap);

  const { object: result } = await generateObject({
    model,
    system: systemPrompt,
    prompt,
    schema: Pass1Schema,
  });

  return result.scenes;
}

/**
 * Pass 2: Extract details for a single scene
 */
async function extractSceneDetails(
  model: ReturnType<ReturnType<typeof createOpenAI>>,
  systemPrompt: string,
  entries: TranscriptEntry[],
  scene: DiscoveredScene,
  playerMap: PlayerConfig[]
): Promise<SceneDetails> {
  const sceneEntries = extractSceneEntries(entries, scene);

  // Handle empty scenes
  if (sceneEntries.length === 0) {
    return {
      sceneName: scene.name,
      charactersPresent: scene.characters,
      timeOfDay: null,
      events: [],
      quotes: [],
      enemies: [],
    };
  }

  const prompt = buildPass2Prompt(sceneEntries, scene, playerMap);

  const { object: result } = await generateObject({
    model,
    system: systemPrompt,
    prompt,
    schema: Pass2Schema,
  });

  return result;
}

/**
 * Pass 2: Extract details for all scenes
 * - If <= PARALLEL_THRESHOLD scenes: process all in parallel
 * - If > PARALLEL_THRESHOLD scenes: process in batches to avoid rate limits
 */
async function runPass2(
  model: ReturnType<ReturnType<typeof createOpenAI>>,
  systemPrompt: string,
  entries: TranscriptEntry[],
  scenes: DiscoveredScene[],
  playerMap: PlayerConfig[],
  onProgress?: (progress: RecapGenerationProgress) => void
): Promise<SceneDetails[]> {
  // For small scene counts, process all in parallel
  if (scenes.length <= PARALLEL_THRESHOLD) {
    onProgress?.({
      stage: "summarizing",
      passName: "extraction",
      currentScene: 1,
      totalScenes: scenes.length,
      message: `Pass 2: Extracting details for ${scenes.length} scenes...`,
    });

    return Promise.all(
      scenes.map((scene) =>
        extractSceneDetails(model, systemPrompt, entries, scene, playerMap)
      )
    );
  }

  // For larger scene counts, process in batches to avoid rate limits
  const results: SceneDetails[] = [];

  for (let i = 0; i < scenes.length; i += PASS2_CONCURRENCY) {
    const batch = scenes.slice(i, i + PASS2_CONCURRENCY);

    onProgress?.({
      stage: "summarizing",
      passName: "extraction",
      currentScene: i + 1,
      totalScenes: scenes.length,
      message: `Pass 2: Extracting details for scenes ${i + 1}-${Math.min(i + PASS2_CONCURRENCY, scenes.length)} of ${scenes.length}...`,
    });

    const batchResults = await Promise.all(
      batch.map((scene) =>
        extractSceneDetails(model, systemPrompt, entries, scene, playerMap)
      )
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Pass 3: Synthesize final recap
 */
async function runPass3(
  model: ReturnType<ReturnType<typeof createOpenAI>>,
  systemPrompt: string,
  scenes: DiscoveredScene[],
  sceneDetails: SceneDetails[],
  sessionTitle: string,
  playerMap: PlayerConfig[],
  onProgress?: (progress: RecapGenerationProgress) => void
): Promise<SessionRecap> {
  onProgress?.({
    stage: "synthesizing",
    passName: "synthesis",
    message: "Pass 3: Synthesizing final recap...",
  });

  const prompt = buildPass3Prompt(scenes, sceneDetails, sessionTitle, playerMap);

  const { object: result } = await generateObject({
    model,
    system: systemPrompt,
    prompt,
    schema: Pass3Schema,
  });

  // Build the final SessionRecap
  const players = playerMap.filter((p) => p.role === "player");

  return {
    header: {
      sessionTitle,
      date: new Date(), // Will be overwritten with actual metadata
    },
    attendance: {
      players: playerMap,
    },
    metadata: {
      charactersPresent: players
        .map((p) => p.characterName)
        .filter((n): n is string => n !== null),
      playersPresent: players.map((p) => p.playerName),
    },
    scenes: result.scenes,
    openingContext: result.openingContext,
    sceneHighlights: result.sceneHighlights.map((s) => ({
      ...s,
      timeOfDay: s.timeOfDay ?? undefined,
    })),
    highlights: result.highlights,
    quotes: result.quotes,
    narrative: result.narrative,
  };
}

/**
 * Generate a session recap using multi-pass processing:
 * - Pass 1: Scene Discovery
 * - Pass 2: Detail Extraction (parallel per scene)
 * - Pass 3: Synthesis
 */
export async function generateRecapMultiPass(
  apiKey: string,
  transcript: TranscriptData,
  playerMap: PlayerConfig[],
  campaignName?: string,
  bookAct?: string,
  modelId?: string,
  onProgress?: (progress: RecapGenerationProgress) => void
): Promise<SessionRecap> {
  const openai = createOpenAI({ apiKey });
  const model = openai(modelId ?? getDefaultModelId());
  const systemPrompt = getSystemPromptWithContext(campaignName, bookAct);

  onProgress?.({
    stage: "summarizing",
    message: `Starting multi-pass generation with ${transcript.entries.length} entries...`,
  });

  // Pass 1: Discover scenes
  const scenes = await runPass1(
    model,
    systemPrompt,
    transcript.entries,
    transcript.metadata.title,
    playerMap,
    onProgress
  );

  if (scenes.length === 0) {
    throw new Error("No scenes discovered in transcript");
  }

  // Pass 2: Extract details for each scene
  const sceneDetails = await runPass2(
    model,
    systemPrompt,
    transcript.entries,
    scenes,
    playerMap,
    onProgress
  );

  // Pass 3: Synthesize final recap
  const recap = await runPass3(
    model,
    systemPrompt,
    scenes,
    sceneDetails,
    transcript.metadata.title,
    playerMap,
    onProgress
  );

  // Set correct date from transcript metadata
  recap.header.date = transcript.metadata.date;

  onProgress?.({
    stage: "complete",
    message: "Recap generated successfully!",
  });

  return recap;
}
