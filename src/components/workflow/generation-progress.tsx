import { useState, useEffect, useRef } from "react";
import { Loader2, Search, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecapGenerationProgress } from "@/types";

interface GenerationProgressProps {
  progress: RecapGenerationProgress | null;
  startTime: number | null;
}

const PASS_INFO = {
  discovery: {
    name: "Discovery",
    description: "Identifying scenes and key characters",
    icon: Search,
  },
  extraction: {
    name: "Extraction",
    description: "Extracting details from each scene",
    icon: FileText,
  },
  synthesis: {
    name: "Synthesis",
    description: "Weaving the narrative together",
    icon: Sparkles,
  },
} as const;

type PassName = keyof typeof PASS_INFO;

export function GenerationProgress({ progress, startTime }: GenerationProgressProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const eventLogRef = useRef<HTMLDivElement>(null);

  // Elapsed time counter
  useEffect(() => {
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Add to event log when message changes
  useEffect(() => {
    if (progress?.message) {
      setEventLog((prev) => {
        // Avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1] === progress.message) {
          return prev;
        }
        return [...prev.slice(-19), progress.message]; // Keep last 20
      });
    }
  }, [progress?.message]);

  // Scroll event log to bottom - use requestAnimationFrame to ensure DOM is updated
  useEffect(() => {
    if (eventLogRef.current) {
      requestAnimationFrame(() => {
        if (eventLogRef.current) {
          eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
        }
      });
    }
  }, [eventLog]);

  // Reset event log when starting fresh
  useEffect(() => {
    if (!progress || progress.stage === "chunking") {
      setEventLog([]);
    }
  }, [progress?.stage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentPass = progress?.passName as PassName | undefined;
  const passes: PassName[] = ["discovery", "extraction", "synthesis"];

  // Calculate overall progress
  const getOverallProgress = () => {
    if (!progress) return 0;

    const passIndex = currentPass ? passes.indexOf(currentPass) : 0;
    const baseProgress = passIndex * 33;

    if (progress.currentScene && progress.totalScenes && progress.totalScenes > 0) {
      const sceneProgress = (progress.currentScene / progress.totalScenes) * 33;
      return Math.min(baseProgress + sceneProgress, 99);
    }

    if (progress.currentChunk && progress.totalChunks && progress.totalChunks > 0) {
      const chunkProgress = (progress.currentChunk / progress.totalChunks) * 33;
      return Math.min(baseProgress + chunkProgress, 99);
    }

    return Math.min(baseProgress + 10, 99);
  };

  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-6">
      {/* Main Progress Visualization */}
      <div className="surface-card rounded-xl p-8">
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Animated Icon */}
          <div className="relative">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/20">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
          </div>

          {/* Title and Current Action */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
              Chronicling Your Adventure
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {progress?.message ?? "Preparing to weave the tale..."}
            </p>
          </div>

          {/* Elapsed Time */}
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <span className="text-xs">Elapsed</span>
            <span className="font-mono text-sm text-foreground/80">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="surface-card rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          {passes.map((pass) => {
            const info = PASS_INFO[pass];
            const Icon = info.icon;
            const isCurrent = currentPass === pass;
            const isComplete =
              currentPass && passes.indexOf(currentPass) > passes.indexOf(pass);

            return (
              <div
                key={pass}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                  isCurrent && "bg-accent/10",
                  isComplete && "opacity-60"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                    isCurrent && "bg-accent/15 text-accent border-accent/40",
                    isComplete && "bg-success/15 text-success border-success/30",
                    !isCurrent && !isComplete && "bg-secondary/20 text-muted-foreground/50 border-transparent"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-foreground",
                      isComplete && "text-muted-foreground",
                      !isCurrent && !isComplete && "text-muted-foreground/50"
                    )}
                  >
                    {info.name}
                  </div>
                  <div className="text-xs text-muted-foreground/60">{info.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-secondary/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Scene/Chunk Progress */}
        {progress?.currentScene != null && progress?.totalScenes != null && progress.totalScenes > 0 && (
          <div className="mt-3 text-center text-xs text-muted-foreground/60">
            Scene {progress.currentScene} of {progress.totalScenes}
          </div>
        )}
        {progress?.currentChunk != null && progress?.totalChunks != null && progress.totalChunks > 0 && progress.currentScene == null && (
          <div className="mt-3 text-center text-xs text-muted-foreground/60">
            Processing chunk {progress.currentChunk} of {progress.totalChunks}
          </div>
        )}
      </div>

      {/* Event Log */}
      {eventLog.length > 0 && (
        <div className="surface-card rounded-xl p-4">
          <h4 className="text-xs font-medium text-muted-foreground/60 mb-2">Activity Log</h4>
          <div
            ref={eventLogRef}
            className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-border/50"
          >
            {eventLog.map((event, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs text-muted-foreground/70 transition-all",
                  i === eventLog.length - 1 && "text-foreground/80"
                )}
              >
                {event}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
