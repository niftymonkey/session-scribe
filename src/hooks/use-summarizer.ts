import { useState, useCallback } from "react";
import type { TranscriptData, PlayerConfig, NPCConfig, SessionRecap, RecapGenerationProgress, DetectedNPC } from "@/types";
import { generateRecap } from "@/lib/ai";

export type SummarizerState = "idle" | "generating" | "success" | "error";

export function useSummarizer() {
  const [state, setState] = useState<SummarizerState>("idle");
  const [recap, setRecap] = useState<SessionRecap | null>(null);
  const [detectedNPCs, setDetectedNPCs] = useState<DetectedNPC[]>([]);
  const [progress, setProgress] = useState<RecapGenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      apiKey: string,
      transcript: TranscriptData,
      playerMap: PlayerConfig[],
      npcs: NPCConfig[],
      campaignName?: string,
      bookAct?: string,
      modelId?: string
    ) => {
      setState("generating");
      setError(null);
      setProgress(null);
      setRecap(null);
      setDetectedNPCs([]);

      try {
        const result = await generateRecap(
          apiKey,
          transcript,
          playerMap,
          npcs,
          campaignName,
          bookAct,
          modelId,
          setProgress
        );
        setRecap(result.recap);
        setDetectedNPCs(result.detectedNPCs);
        setState("success");
      } catch (err) {
        console.error("Failed to generate recap:", err);
        setError(err instanceof Error ? err.message : "Failed to generate recap");
        setState("error");
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState("idle");
    setRecap(null);
    setDetectedNPCs([]);
    setProgress(null);
    setError(null);
  }, []);

  return {
    state,
    recap,
    detectedNPCs,
    progress,
    error,
    generate,
    reset,
    isGenerating: state === "generating",
  };
}
