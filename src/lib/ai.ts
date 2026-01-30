import type { TranscriptData, PlayerConfig, SessionRecap, RecapGenerationProgress } from "@/types";
import { generateRecapMultiPass } from "./ai/multi-pass-generator";

/**
 * Generate a session recap from transcript data using multi-pass processing:
 * - Pass 1: Scene Discovery
 * - Pass 2: Detail Extraction (parallel per scene)
 * - Pass 3: Synthesis
 */
export async function generateRecap(
  apiKey: string,
  transcript: TranscriptData,
  playerMap: PlayerConfig[],
  campaignName?: string,
  bookAct?: string,
  modelId?: string,
  onProgress?: (progress: RecapGenerationProgress) => void
): Promise<SessionRecap> {
  return generateRecapMultiPass(
    apiKey,
    transcript,
    playerMap,
    campaignName,
    bookAct,
    modelId,
    onProgress
  );
}
