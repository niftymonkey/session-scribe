import { useState, useEffect } from "react";
import type { ParsedModel } from "@/types";
import { fetchModels } from "@/lib/models/model-service";

interface UseModelsResult {
  models: ParsedModel[];
  isLoading: boolean;
  error: string | null;
}

export function useModels(): UseModelsResult {
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchModels();
        if (!cancelled) {
          setModels(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load models");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { models, isLoading, error };
}
