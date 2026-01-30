import { ScrollText, Dices, Upload, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImportState } from "@/hooks/use-file-import";

interface FileDropZoneProps {
  type: "transcript" | "dice-log";
  state: ImportState;
  error?: string | null;
  hasData: boolean;
  onImport: () => void;
  onClear: () => void;
  metadata?: {
    title?: string;
    entryCount?: number;
    duration?: string;
    speakers?: string[];
    rollCount?: number;
    characters?: string[];
  };
}

export function FileDropZone({
  type,
  state,
  error,
  hasData,
  onImport,
  onClear,
  metadata,
}: FileDropZoneProps) {
  const isTranscript = type === "transcript";
  const label = isTranscript ? "Session Transcript" : "Dice Log";
  const description = isTranscript
    ? "Teams meeting transcript (.txt)"
    : "Roll20 dice log (.txt)";
  const Icon = isTranscript ? ScrollText : Dices;

  return (
    <div
      className={cn(
        "relative rounded-lg border transition-all duration-200 group",
        state === "idle" && "border-border/50 bg-card/40 hover:border-primary/30 hover:bg-card/60",
        state === "loading" && "border-accent/40 bg-accent/5",
        state === "success" && "border-success/40 bg-success/5",
        state === "error" && "border-destructive/40 bg-destructive/5"
      )}
    >
      {/* Clear button when data is loaded */}
      {hasData && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="absolute right-2 top-2 h-7 w-7 opacity-60 hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex flex-col items-center gap-4 p-6 text-center">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-200",
            state === "idle" && "bg-secondary/40 group-hover:bg-accent/10 group-hover:scale-105",
            state === "loading" && "bg-accent/10",
            state === "success" && "bg-success/10",
            state === "error" && "bg-destructive/10"
          )}
        >
          {state === "loading" ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          ) : state === "success" ? (
            <CheckCircle className="h-6 w-6 text-success" />
          ) : state === "error" ? (
            <AlertCircle className="h-6 w-6 text-destructive" />
          ) : (
            <Icon className={cn(
              "h-6 w-6 transition-colors duration-200",
              "text-muted-foreground group-hover:text-primary"
            )} />
          )}
        </div>

        {/* Content based on state */}
        {state === "idle" && (
          <>
            <div className="space-y-1">
              <p className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Select File
            </Button>
          </>
        )}

        {state === "loading" && (
          <div className="space-y-1">
            <p className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>Loading...</p>
            <p className="text-sm text-muted-foreground">Reading {label.toLowerCase()}</p>
          </div>
        )}

        {state === "error" && (
          <>
            <div className="space-y-1">
              <p className="font-medium text-destructive" style={{ fontFamily: 'var(--font-display)' }}>
                Import Failed
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="gap-2"
            >
              Try Again
            </Button>
          </>
        )}

        {state === "success" && metadata && (
          <div className="w-full space-y-3">
            {metadata.title && (
              <p className="font-medium text-sm truncate px-2" style={{ fontFamily: 'var(--font-display)' }}>
                {metadata.title}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {metadata.entryCount !== undefined && (
                <span className="inline-flex items-center rounded-md bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {metadata.entryCount} entries
                </span>
              )}
              {metadata.duration && (
                <span className="inline-flex items-center rounded-md bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {metadata.duration}
                </span>
              )}
              {metadata.rollCount !== undefined && (
                <span className="inline-flex items-center rounded-md bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {metadata.rollCount} rolls
                </span>
              )}
              {metadata.speakers && metadata.speakers.length > 0 && (
                <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  {metadata.speakers.length} speakers
                </span>
              )}
              {metadata.characters && metadata.characters.length > 0 && (
                <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  {metadata.characters.length} characters
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
