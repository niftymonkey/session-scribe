import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { TranscriptData, DiceLogData, DiceRoll, TurnMarker } from "@/types";

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

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Session Info</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Title:</div>
          <div className="truncate">{metadata.title}</div>
          <div className="text-muted-foreground">Date:</div>
          <div>{metadata.date.toLocaleDateString()}</div>
          <div className="text-muted-foreground">Duration:</div>
          <div>{metadata.duration}</div>
          <div className="text-muted-foreground">Entries:</div>
          <div>{entries.length}</div>
        </div>
      </div>

      <Separator />

      {/* Speakers */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Speakers ({speakers.length})</h4>
        <div className="flex flex-wrap gap-1">
          {speakers.map((speaker) => (
            <span
              key={speaker}
              className="rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {speaker}
            </span>
          ))}
        </div>
      </div>

      <Separator />

      {/* Preview entries */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Preview</h4>
        <ScrollArea className="h-48 rounded border">
          <div className="p-2 space-y-2">
            {displayEntries.map((entry, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-primary">
                    {entry.speaker}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2">
                  {entry.text}
                </p>
              </div>
            ))}
            {hasMore && (
              <p className="text-xs text-muted-foreground text-center py-2">
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
  const { entries, characters, rollCount } = diceLog;
  const displayEntries = entries.slice(0, maxEntries);
  const hasMore = entries.length > maxEntries;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Total Rolls:</div>
          <div>{rollCount}</div>
          <div className="text-muted-foreground">Characters:</div>
          <div>{characters.length}</div>
        </div>
      </div>

      <Separator />

      {/* Characters */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Characters ({characters.length})</h4>
        <div className="flex flex-wrap gap-1">
          {characters.map((char) => (
            <span
              key={char}
              className="rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <Separator />

      {/* Preview entries */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Preview</h4>
        <ScrollArea className="h-48 rounded border">
          <div className="p-2 space-y-1">
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
                  <div className="text-xs text-muted-foreground italic">
                    {(entry.data as TurnMarker).character}'s turn
                  </div>
                )}
              </div>
            ))}
            {hasMore && (
              <p className="text-xs text-muted-foreground text-center py-2">
                ...and {entries.length - maxEntries} more entries
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
