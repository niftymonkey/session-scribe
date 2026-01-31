import type { TranscriptData, PlayerConfig, NPCConfig, RecapGenerationProgress } from "@/types";
import { generateRecapMultiPass, type RecapGenerationResult } from "./ai/multi-pass-generator";
import { normalizeTranscript } from "./transcript/normalize";

export type { RecapGenerationResult };

/**
 * Generate a session recap from transcript data using multi-pass processing:
 * - Pass 1: Scene Discovery + NPC Detection
 * - Pass 2: Detail Extraction (parallel per scene)
 * - Pass 3: Synthesis
 */
export async function generateRecap(
  apiKey: string,
  transcript: TranscriptData,
  playerMap: PlayerConfig[],
  npcs: NPCConfig[],
  campaignName?: string,
  bookAct?: string,
  modelId?: string,
  onProgress?: (progress: RecapGenerationProgress) => void
): Promise<RecapGenerationResult> {
  // Normalize transcript: apply speaker aliases and NPC name mappings
  const { transcript: normalizedTranscript, appliedMappings } = normalizeTranscript(
    transcript,
    playerMap,
    npcs
  );

  // Log applied mappings for debugging
  if (appliedMappings.speakers.size > 0 || appliedMappings.npcs.size > 0) {
    onProgress?.({
      stage: "summarizing",
      message: `Applied ${appliedMappings.speakers.size} speaker and ${appliedMappings.npcs.size} NPC name normalizations`,
    });
  }

  return generateRecapMultiPass(
    apiKey,
    normalizedTranscript,
    playerMap,
    campaignName,
    bookAct,
    modelId,
    onProgress
  );
}
