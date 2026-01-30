import { Loader2 } from "lucide-react";
import { RecapDisplay } from "./recap-display";
import { RecapActions } from "./recap-actions";
import type { SessionRecap, RecapGenerationProgress } from "@/types";
import type { SummarizerState } from "@/hooks/use-summarizer";

interface RecapPanelProps {
  state: SummarizerState;
  recap: SessionRecap | null;
  progress: RecapGenerationProgress | null;
  error: string | null;
}

export function RecapPanel({ state, recap, progress, error }: RecapPanelProps) {
  if (state === "idle") {
    return null;
  }

  if (state === "generating") {
    return (
      <div className="surface-card rounded-lg p-8">
        <div className="flex flex-col items-center justify-center py-8 gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 animate-pulse-glow">
              <Loader2 className="h-7 w-7 text-accent animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg text-glow" style={{ fontFamily: 'var(--font-display)' }}>
              Chronicling Your Adventure
            </h3>
            <p className="text-sm text-muted-foreground">
              {progress?.message ?? "Weaving the tale..."}
            </p>
            {progress?.currentChunk && progress?.totalChunks && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="flex gap-1">
                  {Array.from({ length: progress.totalChunks }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < progress.currentChunk!
                          ? "bg-accent"
                          : i === progress.currentChunk! - 1
                          ? "bg-accent animate-gentle-pulse"
                          : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Part {progress.currentChunk} of {progress.totalChunks}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg text-destructive" style={{ fontFamily: 'var(--font-display)' }}>
            Chronicle Failed
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (state === "success" && recap) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            Session Chronicle
          </h2>
          <RecapActions recap={recap} />
        </div>
        <RecapDisplay recap={recap} />
      </div>
    );
  }

  return null;
}
