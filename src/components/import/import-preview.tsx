import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, Dices } from "lucide-react";
import type { TranscriptData, DiceLogData, DiceRoll, TurnMarker } from "@/types";

/**
 * Parse session identifier from title (e.g., "1-3-41 Audio Transcript" → { book: 1, act: 3, session: 41 })
 */
function parseSessionId(title: string): { book: number; act: number; session: number } | null {
  const match = title.match(/^(\d+)-(\d+)-(\d+)/);
  if (!match) return null;
  return {
    book: parseInt(match[1], 10),
    act: parseInt(match[2], 10),
    session: parseInt(match[3], 10),
  };
}

/**
 * Format session identifier for display
 */
function formatSessionTitle(title: string): { formatted: string; subtitle: string | null } {
  const parsed = parseSessionId(title);
  if (!parsed) {
    return { formatted: title, subtitle: null };
  }
  return {
    formatted: `Session ${parsed.session}`,
    subtitle: `Book ${parsed.book}, Act ${parsed.act}`,
  };
}

interface TranscriptPreviewProps {
  transcript: TranscriptData;
  maxEntries?: number;
}

export function TranscriptPreview({
  transcript,
  maxEntries = 10,
}: TranscriptPreviewProps) {
  const { metadata, entries, speakers } = transcript;
  const displayEntries = entries.slice(0, maxEntries);
  const hasMore = entries.length > maxEntries;

  // Filter out empty speaker names
  const validSpeakers = speakers.filter((s) => s.trim().length > 0);

  const { formatted: sessionTitle, subtitle: sessionSubtitle } = formatSessionTitle(metadata.title);

  return (
    <div className="space-y-4">
      {/* Session Header - Compact Chronicle Style */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-5 h-5 text-accent shrink-0" />
          <h3 className="text-base font-medium" style={{ fontFamily: 'var(--font-display)' }}>
            {sessionTitle}
          </h3>
          {sessionSubtitle && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-sm text-accent">{sessionSubtitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span>{metadata.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>{metadata.duration}</span>
          <span>{entries.length} entries</span>
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Speakers */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Speakers</h4>
          <span className="text-xs text-muted-foreground">({validSpeakers.length})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {validSpeakers.map((speaker) => (
            <span
              key={speaker}
              className="rounded-full bg-secondary/50 border border-border/40 px-2.5 py-0.5 text-xs"
            >
              {speaker}
            </span>
          ))}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Preview entries */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Preview</h4>
        <ScrollArea className="h-48 rounded-lg border border-border/40 bg-background/50">
          <div className="p-3 space-y-3">
            {displayEntries.map((entry, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-primary">
                    {entry.speaker}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2 mt-0.5">
                  {entry.text}
                </p>
              </div>
            ))}
            {hasMore && (
              <p className="text-xs text-muted-foreground/70 text-center py-2">
                ...and {entries.length - maxEntries} more entries
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface DiceLogPreviewProps {
  diceLog: DiceLogData;
  maxEntries?: number;
}

export function DiceLogPreview({
  diceLog,
  maxEntries = 15,
}: DiceLogPreviewProps) {
  const { entries, characters, rollCount, filename } = diceLog;
  const displayEntries = entries.slice(0, maxEntries);
  const hasMore = entries.length > maxEntries;

  return (
    <div className="space-y-4">
      {/* Header - Compact Style (matching TranscriptPreview) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Dices className="w-5 h-5 text-accent shrink-0" />
          <h3 className="text-base font-medium" style={{ fontFamily: 'var(--font-display)' }}>
            Dice Log
          </h3>
          {filename && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-sm text-muted-foreground truncate">{filename}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span>{rollCount} rolls</span>
          <span>{entries.length} entries</span>
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Characters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Characters</h4>
          <span className="text-xs text-muted-foreground">({characters.length})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {characters.map((char) => (
            <span
              key={char}
              className="rounded-full bg-secondary/50 border border-border/40 px-2.5 py-0.5 text-xs"
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* Preview entries */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Preview</h4>
        <ScrollArea className="h-48 rounded-lg border border-border/40 bg-background/50">
          <div className="p-3 space-y-2">
            {displayEntries.map((entry, i) => (
              <div key={i} className="text-sm">
                {entry.type === "roll" && (
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-primary">
                      {(entry.data as DiceRoll).character}
                    </span>
                    <span className="text-muted-foreground">
                      {(entry.data as DiceRoll).rollType}
                    </span>
                    <span className="font-mono text-accent">
                      {(entry.data as DiceRoll).result}
                    </span>
                  </div>
                )}
                {entry.type === "turn" && (
                  <div className="text-xs text-muted-foreground/70 italic">
                    {(entry.data as TurnMarker).character}'s turn
                  </div>
                )}
              </div>
            ))}
            {hasMore && (
              <p className="text-xs text-muted-foreground/70 text-center py-2">
                ...and {entries.length - maxEntries} more entries
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
