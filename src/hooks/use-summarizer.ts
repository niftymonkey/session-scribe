import { useState, useCallback } from "react";
import type { TranscriptData, PlayerConfig, SessionRecap, RecapGenerationProgress } from "@/types";
import { generateRecap } from "@/lib/ai";

export type SummarizerState = "idle" | "generating" | "success" | "error";

export function useSummarizer() {
  const [state, setState] = useState<SummarizerState>("idle");
  const [recap, setRecap] = useState<SessionRecap | null>(null);
  const [progress, setProgress] = useState<RecapGenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      apiKey: string,
      transcript: TranscriptData,
      playerMap: PlayerConfig[],
      campaignName?: string,
      bookAct?: string,
      modelId?: string
    ) => {
      setState("generating");
      setError(null);
      setProgress(null);
      setRecap(null);

      try {
        const result = await generateRecap(
          apiKey,
          transcript,
          playerMap,
          campaignName,
          bookAct,
          modelId,
          setProgress
        );
        setRecap(result);
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
    setProgress(null);
    setError(null);
  }, []);

  return {
    state,
    recap,
    progress,
    error,
    generate,
    reset,
    isGenerating: state === "generating",
  };
}
